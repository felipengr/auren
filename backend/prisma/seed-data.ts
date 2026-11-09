import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import { prisma } from "../src/lib/prisma.js";
import { CLINIC_TIMEZONE, civilDateTimeToUtc } from "../src/lib/timezone.js";
import { dailySlotTimes } from "../src/lib/clinic-config.js";

// Mesma senha pra todas as contas de demonstração — é só pra avaliação do
// desafio, nunca um padrão aceitável fora desse contexto.
export const DEMO_PASSWORD = "Auren@123";

const FUTURE_BUSINESS_DAYS = 10; // hoje + os próximos dias úteis
const PAST_BUSINESS_DAYS = 5; // os últimos dias úteis antes de hoje

function isWeekend(dt: DateTime): boolean {
  return dt.weekday === 6 || dt.weekday === 7; // luxon: 1=segunda … 7=domingo
}

/** Hoje (se não cair num fim de semana) + os próximos dias úteis, em ordem. */
function businessDaysFromToday(count: number): DateTime[] {
  const days: DateTime[] = [];
  let cursor = DateTime.now().setZone(CLINIC_TIMEZONE).startOf("day");
  while (days.length < count) {
    if (!isWeekend(cursor)) days.push(cursor);
    cursor = cursor.plus({ days: 1 });
  }
  return days;
}

/** Os últimos dias úteis antes de hoje, do mais antigo pro mais recente. */
function businessDaysBeforeToday(count: number): DateTime[] {
  const days: DateTime[] = [];
  let cursor = DateTime.now().setZone(CLINIC_TIMEZONE).startOf("day").minus({ days: 1 });
  while (days.length < count) {
    if (!isWeekend(cursor)) days.push(cursor);
    cursor = cursor.minus({ days: 1 });
  }
  return days.reverse();
}

function civilDate(dt: DateTime): string {
  return dt.toFormat("yyyy-MM-dd");
}

const REPORT_TEMPLATES: Record<string, Array<{ title: string; content: string }>> = {
  "Raio-X": [
    {
      title: "Raio-X de tórax — sem alterações",
      content:
        "Estruturas ósseas e partes moles sem alterações significativas. Área cardíaca dentro dos limites da normalidade.",
    },
    {
      title: "Raio-X de tórax — achados leves",
      content: "Discreto espessamento peribrônquico, sem sinais de consolidação ou derrame pleural.",
    },
  ],
  Ultrassom: [
    {
      title: "Ultrassom abdominal — sem alterações",
      content: "Órgãos abdominais com ecotextura e dimensões preservadas. Ausência de coleções ou massas.",
    },
    {
      title: "Ultrassom abdominal — achados leves",
      content: "Discreta esteatose hepática. Demais órgãos avaliados sem alterações relevantes.",
    },
  ],
  "Ressonância magnética": [
    {
      title: "Ressonância magnética — sem alterações",
      content: "Estudo sem evidências de lesões expansivas ou alterações de sinal significativas.",
    },
    {
      title: "Ressonância magnética — achados leves",
      content: "Pequena alteração de sinal inespecífica, sem correlação clínica relevante no momento.",
    },
  ],
};

const PROFESSIONALS = ["Dr. Felipe Andrade", "Dra. Camila Nogueira", "Dr. Marcos Vieira", "Dra. Patrícia Lemos"];

export async function seedDemoData(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const clinicUser = await prisma.user.upsert({
    where: { email: "equipe@auren.com" },
    update: {},
    create: { name: "Marina Oliveira", email: "equipe@auren.com", passwordHash, role: "CLINIC" },
  });

  const patientNames = [
    "Ana Costa",
    "Bruno Mendes",
    "Clara Ribeiro",
    "Daniel Santos",
    "Felipe Martins",
    "Juliana Ramos",
    "Lucas Fernandes",
    "Mariana Alves",
    "Rafael Lima",
    "Beatriz Moura",
    "Gabriel Torres",
    "Larissa Pinto",
  ];
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

  const examTypeNames = ["Raio-X", "Ultrassom", "Ressonância magnética"];
  const examTypes = await Promise.all(
    examTypeNames.map((name) => prisma.examType.upsert({ where: { name }, update: {}, create: { name } })),
  );

  const slots = dailySlotTimes();

  // Agenda futura (hoje + próximos dias úteis): bem mais preenchida, mas
  // ainda deixando horários livres visíveis — o padrão de quais slots ficam
  // ocupados roda a cada dia pra não parecer sempre "só de manhã" ou
  // "só à tarde".
  const futureDays = businessDaysFromToday(FUTURE_BUSINESS_DAYS);
  let futureCount = 0;
  let cancelledCount = 0;
  let futureIndex = 0; // contador independente da condição de ocupação do
  // slot — ver nota equivalente no laço dos dias passados mais abaixo.

  for (const [dayIndex, day] of futureDays.entries()) {
    const date = civilDate(day);

    for (const [slotIndex, time] of slots.entries()) {
      const isBooked = (slotIndex + dayIndex) % 2 === 0; // ~metade dos horários do dia
      if (!isBooked) continue;

      const patient = patients[futureIndex % patients.length]!;
      const examType = examTypes[futureIndex % examTypes.length]!;
      const scheduledAt = civilDateTimeToUtc(date, time);
      futureIndex++;

      // Um punhado de agendamentos futuros cancelados, pra variedade de
      // situação na agenda — sem laudo, horário liberado de volta. Os
      // índices escolhidos sempre satisfazem a paridade de "ocupado" acima.
      const shouldCancel = (dayIndex === 1 && slotIndex === 3) || (dayIndex === 5 && slotIndex === 5);

      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          examTypeId: examType.id,
          scheduledAt,
          createdById: clinicUser.id,
          status: shouldCancel ? "CANCELLED" : "SCHEDULED",
          cancelledAt: shouldCancel ? DateTime.now().toJSDate() : null,
          slotKey: shouldCancel ? null : scheduledAt.toISOString(),
        },
      });

      if (shouldCancel) cancelledCount++;
      else futureCount++;
    }
  }

  // Dias úteis passados: exames já realizados, todos com laudo. O dia mais
  // recente (o "ontem útil") fica em rascunho; os anteriores, publicados —
  // como pedido, só o laudo de ontem ainda não foi revisado/publicado.
  const pastDays = businessDaysBeforeToday(PAST_BUSINESS_DAYS);
  let publishedCount = 0;
  let draftCount = 0;
  let pastIndex = 0; // contador independente da condição de ocupação do slot,
  // pra não acoplar matematicamente a escolha de exame/profissional a ela
  // (acoplar os dois ao mesmo "% 3" faz a escolha de exame virar constante)

  for (const [dayIndex, day] of pastDays.entries()) {
    const date = civilDate(day);
    const isMostRecentPastDay = dayIndex === pastDays.length - 1;

    for (const [slotIndex, time] of slots.entries()) {
      const isBooked = (slotIndex + dayIndex) % 3 === 0; // uns 6-7 exames por dia
      if (!isBooked) continue;

      const patient = patients[(dayIndex * 2 + slotIndex) % patients.length]!;
      const examType = examTypes[pastIndex % examTypes.length]!;
      const scheduledAt = civilDateTimeToUtc(date, time);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          examTypeId: examType.id,
          scheduledAt,
          createdById: clinicUser.id,
          status: "SCHEDULED",
          slotKey: scheduledAt.toISOString(),
        },
      });

      const templates = REPORT_TEMPLATES[examType.name]!;
      const template = templates[pastIndex % templates.length]!;
      const professionalName = PROFESSIONALS[pastIndex % PROFESSIONALS.length]!;
      pastIndex++;

      await prisma.report.create({
        data: {
          appointmentId: appointment.id,
          title: template.title,
          content: template.content,
          professionalName,
          status: isMostRecentPastDay ? "DRAFT" : "PUBLISHED",
          publishedAt: isMostRecentPastDay ? null : day.plus({ hours: 4 }).toJSDate(),
        },
      });

      if (isMostRecentPastDay) draftCount++;
      else publishedCount++;
    }
  }

  console.log("Seed concluído.");
  console.log(`Clínica: equipe@auren.com / ${DEMO_PASSWORD}`);
  console.log(
    `Pacientes (${patientNames.length}): ${patientNames.map((n) => `${n.toLowerCase().replace(" ", ".")}@auren.com`).join(", ")} / ${DEMO_PASSWORD}`,
  );
  console.log(
    `Agenda futura: ${futureCount} agendamentos + ${cancelledCount} cancelados em ${futureDays.length} dias úteis (${civilDate(futureDays[0]!)} a ${civilDate(futureDays.at(-1)!)}).`,
  );
  console.log(
    `Laudos passados: ${publishedCount} publicados + ${draftCount} em rascunho em ${pastDays.length} dias úteis (${civilDate(pastDays[0]!)} a ${civilDate(pastDays.at(-1)!)}).`,
  );
}
