import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import { prisma } from "../src/lib/prisma.js";
import { CLINIC_TIMEZONE } from "../src/lib/timezone.js";

// Mesma senha pra todas as contas de demonstração — é só pra avaliação do
// desafio, nunca um padrão aceitável fora desse contexto.
export const DEMO_PASSWORD = "Auren@123";

function inDays(days: number, time: string): Date {
  const [hour, minute] = time.split(":").map(Number);
  return DateTime.now()
    .setZone(CLINIC_TIMEZONE)
    .plus({ days })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toJSDate();
}

export async function seedDemoData(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const clinicUser = await prisma.user.upsert({
    where: { email: "equipe@auren.com" },
    update: {},
    create: { name: "Marina Oliveira", email: "equipe@auren.com", passwordHash, role: "CLINIC" },
  });

  const patientNames = ["Ana Costa", "Bruno Mendes", "Clara Ribeiro", "Daniel Santos"];
  const patients = await Promise.all(
    patientNames.map((name) => {
      const email = `${name.toLowerCase().replace(" ", ".")}@auren.com`;
      return prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, passwordHash, role: "PATIENT" },
      });
    }),
  );
  const [ana, bruno, clara, daniel] = patients;
  if (!ana || !bruno || !clara || !daniel) throw new Error("seed: expected 4 patients");

  const examTypeNames = ["Raio-X", "Ultrassom", "Ressonância magnética"];
  const examTypes = await Promise.all(
    examTypeNames.map((name) => prisma.examType.upsert({ where: { name }, update: {}, create: { name } })),
  );
  const [raioX, ultrassom, ressonancia] = examTypes;
  if (!raioX || !ultrassom || !ressonancia) throw new Error("seed: expected 3 exam types");

  // Agendamento futuro, ainda sem laudo — o exame nem aconteceu.
  await prisma.appointment.create({
    data: {
      patientId: ana.id,
      examTypeId: ultrassom.id,
      scheduledAt: inDays(2, "08:00"),
      createdById: clinicUser.id,
      slotKey: inDays(2, "08:00").toISOString(),
    },
  });

  // Exame já realizado (passado) com laudo publicado — não faria sentido um
  // laudo existir antes do exame acontecer.
  const withPublishedReport = await prisma.appointment.create({
    data: {
      patientId: bruno.id,
      examTypeId: raioX.id,
      scheduledAt: inDays(-3, "08:30"),
      createdById: clinicUser.id,
      slotKey: inDays(-3, "08:30").toISOString(),
    },
  });
  await prisma.report.create({
    data: {
      appointmentId: withPublishedReport.id,
      title: "Raio-X de tórax — sem alterações",
      content:
        "Estruturas ósseas e partes moles sem alterações significativas. Área cardíaca dentro dos limites da normalidade.",
      professionalName: "Dr. Felipe Andrade",
      status: "PUBLISHED",
      publishedAt: inDays(-2, "10:00"),
    },
  });

  // Exame de ontem com laudo ainda em rascunho — só a clínica enxerga.
  const withDraftReport = await prisma.appointment.create({
    data: {
      patientId: clara.id,
      examTypeId: ressonancia.id,
      scheduledAt: inDays(-1, "09:00"),
      createdById: clinicUser.id,
      slotKey: inDays(-1, "09:00").toISOString(),
    },
  });
  await prisma.report.create({
    data: {
      appointmentId: withDraftReport.id,
      title: "Ressonância magnética — aguardando revisão",
      content: "Rascunho inicial: laudo em elaboração, pendente de revisão final antes da publicação.",
      professionalName: "Dra. Camila Nogueira",
      status: "DRAFT",
    },
  });

  // Agendamento futuro cancelado — não pode receber laudo.
  await prisma.appointment.create({
    data: {
      patientId: daniel.id,
      examTypeId: raioX.id,
      scheduledAt: inDays(3, "10:00"),
      createdById: clinicUser.id,
      status: "CANCELLED",
      cancelledAt: DateTime.now().toJSDate(),
      slotKey: null,
    },
  });

  console.log("Seed concluído.");
  console.log(`Clínica: equipe@auren.com / ${DEMO_PASSWORD}`);
  console.log(
    `Pacientes: ${patientNames.map((n) => `${n.toLowerCase().replace(" ", ".")}@auren.com`).join(", ")} / ${DEMO_PASSWORD}`,
  );
}
