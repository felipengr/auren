import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors.js";
import { civilDateToUtcDayBounds, civilDateTimeToUtc, isInThePast, utcToClinicCivil } from "../../lib/timezone.js";
import { dailySlotTimes } from "../../lib/clinic-config.js";

const clinicListInclude = {
  patient: { select: { id: true, name: true, email: true } },
  examType: { select: { id: true, name: true } },
  report: { select: { id: true, status: true } },
} satisfies Prisma.AppointmentInclude;

type ClinicAppointment = Prisma.AppointmentGetPayload<{ include: typeof clinicListInclude }>;

function serializeForClinic(appointment: ClinicAppointment) {
  const { date, time, isoWithOffset } = utcToClinicCivil(appointment.scheduledAt);
  return {
    id: appointment.id,
    patient: appointment.patient,
    examType: appointment.examType,
    date,
    time,
    scheduledAt: isoWithOffset,
    status: appointment.status,
    report: appointment.report ? { id: appointment.report.id, status: appointment.report.status } : null,
    cancelledAt: appointment.cancelledAt,
  };
}

export async function listForClinic(filters: { date?: string; patientId?: string }) {
  const where: Prisma.AppointmentWhereInput = {};

  if (filters.patientId) {
    where.patientId = filters.patientId;
  }

  if (filters.date) {
    // scheduledAt is stored as a UTC instant; filtering "by day" means the
    // whole civil day in the clinic's timezone, so we derive UTC bounds from it.
    const { start, end } = civilDateToUtcDayBounds(filters.date);
    where.scheduledAt = { gte: start, lt: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: clinicListInclude,
    orderBy: { scheduledAt: "asc" },
  });

  return appointments.map(serializeForClinic);
}

export async function getForClinic(id: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: clinicListInclude });
  if (!appointment) throw new NotFoundError("Agendamento");
  return serializeForClinic(appointment);
}

export async function listForPatient(patientId: string) {
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: clinicListInclude,
    orderBy: { scheduledAt: "asc" },
  });

  return appointments.map((appointment) => {
    const serialized = serializeForClinic(appointment);
    return {
      id: serialized.id,
      examType: serialized.examType,
      date: serialized.date,
      time: serialized.time,
      scheduledAt: serialized.scheduledAt,
      status: serialized.status,
      hasPublishedReport: serialized.report?.status === "PUBLISHED",
    };
  });
}

export async function getForPatient(id: string, patientId: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: clinicListInclude });
  // Same 404 whether it doesn't exist or belongs to someone else — never
  // confirm to a patient that another patient's appointment exists.
  if (!appointment || appointment.patientId !== patientId) {
    throw new NotFoundError("Agendamento");
  }
  return serializeForClinic(appointment);
}

export async function create(input: {
  patientId: string;
  examTypeId: string;
  scheduledAt: Date;
  createdById: string;
}) {
  if (isInThePast(input.scheduledAt)) {
    throw new ValidationError("Não é possível agendar no passado");
  }

  const [patient, examType] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.patientId } }),
    prisma.examType.findUnique({ where: { id: input.examTypeId } }),
  ]);

  if (!patient || patient.role !== "PATIENT") throw new NotFoundError("Paciente");
  if (!examType) throw new NotFoundError("Tipo de exame");

  const slotKey = input.scheduledAt.toISOString();

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: input.patientId,
        examTypeId: input.examTypeId,
        scheduledAt: input.scheduledAt,
        createdById: input.createdById,
        slotKey,
      },
      include: clinicListInclude,
    });
    return serializeForClinic(appointment);
  } catch (error) {
    // The unique constraint on slotKey is what actually makes two concurrent
    // bookings for the same slot safe: only one INSERT can win the race, the
    // other fails here with P2002 regardless of what any pre-check said.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("Este horário já está ocupado");
    }
    throw error;
  }
}

export async function availableSlots(date: string) {
  const { start, end } = civilDateToUtcDayBounds(date);

  const scheduled = await prisma.appointment.findMany({
    where: { status: "SCHEDULED", scheduledAt: { gte: start, lt: end } },
    select: { scheduledAt: true },
  });
  const occupied = new Set(scheduled.map((a) => a.scheduledAt.toISOString()));

  const now = new Date();

  return dailySlotTimes().map((time) => {
    const instant = civilDateTimeToUtc(date, time);
    const isPast = isInThePast(instant, now);
    const isBooked = occupied.has(instant.toISOString());
    return {
      time,
      scheduledAt: instant.toISOString(),
      available: !isBooked && !isPast,
      reason: isBooked ? ("booked" as const) : isPast ? ("past" as const) : null,
    };
  });
}

export async function cancel(id: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { report: { select: { status: true } } },
  });

  if (!appointment) throw new NotFoundError("Agendamento");
  if (appointment.status === "CANCELLED") {
    throw new ConflictError("Este agendamento já está cancelado");
  }
  if (appointment.report?.status === "PUBLISHED") {
    throw new ConflictError("Não é possível cancelar um agendamento com laudo publicado");
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED", slotKey: null, cancelledAt: new Date() },
    include: clinicListInclude,
  });

  return serializeForClinic(updated);
}
