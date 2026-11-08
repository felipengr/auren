import { prisma } from "../../lib/prisma.js";
import { ConflictError, NotFoundError } from "../../lib/errors.js";
import { Prisma } from "../../generated/prisma/client.js";

const include = {
  appointment: {
    select: {
      id: true,
      patientId: true,
      scheduledAt: true,
      status: true,
      examType: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ReportInclude;

type ReportWithAppointment = Prisma.ReportGetPayload<{ include: typeof include }>;

function serialize(report: ReportWithAppointment) {
  return {
    id: report.id,
    appointmentId: report.appointmentId,
    title: report.title,
    content: report.content,
    professionalName: report.professionalName,
    status: report.status,
    publishedAt: report.publishedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    appointment: {
      id: report.appointment.id,
      examType: report.appointment.examType,
      scheduledAt: report.appointment.scheduledAt,
    },
  };
}

export async function createDraft(input: {
  appointmentId: string;
  title: string;
  content: string;
  professionalName: string;
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { report: true },
  });

  if (!appointment) throw new NotFoundError("Agendamento");
  if (appointment.status === "CANCELLED") {
    throw new ConflictError("Agendamentos cancelados não podem receber laudo");
  }
  if (appointment.report) {
    throw new ConflictError("Este agendamento já possui um laudo");
  }

  const report = await prisma.report.create({
    data: {
      appointmentId: input.appointmentId,
      title: input.title,
      content: input.content,
      professionalName: input.professionalName,
      status: "DRAFT",
    },
    include,
  });

  return serialize(report);
}

export async function updateDraft(
  id: string,
  input: Partial<{ title: string; content: string; professionalName: string }>,
) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new NotFoundError("Laudo");
  if (report.status !== "DRAFT") {
    throw new ConflictError("Laudos publicados não podem ser editados");
  }

  const updated = await prisma.report.update({ where: { id }, data: input, include });
  return serialize(updated);
}

export async function publish(id: string) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new NotFoundError("Laudo");
  if (report.status !== "DRAFT") {
    throw new ConflictError("Este laudo já foi publicado");
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    include,
  });
  return serialize(updated);
}

export async function getForClinic(id: string) {
  const report = await prisma.report.findUnique({ where: { id }, include });
  if (!report) throw new NotFoundError("Laudo");
  return serialize(report);
}

export async function getByAppointmentForClinic(appointmentId: string) {
  const report = await prisma.report.findUnique({ where: { appointmentId }, include });
  if (!report) throw new NotFoundError("Laudo");
  return serialize(report);
}

export async function getByAppointmentForPatient(appointmentId: string, patientId: string) {
  const report = await prisma.report.findUnique({ where: { appointmentId }, include });
  if (!report || report.status !== "PUBLISHED" || report.appointment.patientId !== patientId) {
    throw new NotFoundError("Laudo");
  }
  return serialize(report);
}

export async function getForPatient(id: string, patientId: string) {
  const report = await prisma.report.findUnique({ where: { id }, include });
  // A draft, someone else's report, or a non-existent id all look identical
  // from the outside: NotFound. Never confirm a draft exists to a patient.
  if (!report || report.status !== "PUBLISHED" || report.appointment.patientId !== patientId) {
    throw new NotFoundError("Laudo");
  }
  return serialize(report);
}

export async function listPublishedForPatient(patientId: string) {
  const reports = await prisma.report.findMany({
    where: { status: "PUBLISHED", appointment: { patientId } },
    include,
    orderBy: { publishedAt: "desc" },
  });
  return reports.map(serialize);
}
