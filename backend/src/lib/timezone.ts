import { DateTime } from "luxon";

/**
 * Timezone de referência para toda a aplicação. O Brasil não observa mais
 * horário de verão desde 2019, então America/Sao_Paulo é um offset fixo
 * (UTC-3) — documentado aqui em vez de hardcoded para deixar a intenção clara.
 */
export const CLINIC_TIMEZONE = "America/Sao_Paulo";

const SLOT_MINUTES = 30;

/** "2026-11-12" + "08:00" (horário local da clínica) -> instante UTC. */
export function civilDateTimeToUtc(date: string, time: string): Date {
  const dt = DateTime.fromFormat(`${date} ${time}`, "yyyy-MM-dd HH:mm", {
    zone: CLINIC_TIMEZONE,
  });

  if (!dt.isValid) {
    throw new InvalidDateTimeError(dt.invalidReason ?? "invalid date/time");
  }

  return dt.toJSDate();
}

/** Instante UTC -> horário civil da clínica, pronto pra resposta da API. */
export function utcToClinicCivil(instant: Date): { date: string; time: string; isoWithOffset: string } {
  const dt = DateTime.fromJSDate(instant, { zone: "utc" }).setZone(CLINIC_TIMEZONE);
  return {
    date: dt.toFormat("yyyy-MM-dd"),
    time: dt.toFormat("HH:mm"),
    isoWithOffset: dt.toISO() ?? dt.toJSDate().toISOString(),
  };
}

/** Agendamentos só podem cair em horários fixos de 30 min (ex.: 08:00, 08:30). */
export function isAlignedToSlot(instant: Date): boolean {
  const dt = DateTime.fromJSDate(instant, { zone: "utc" }).setZone(CLINIC_TIMEZONE);
  return dt.second === 0 && dt.millisecond === 0 && dt.minute % SLOT_MINUTES === 0;
}

export function isInThePast(instant: Date, now: Date = new Date()): boolean {
  return instant.getTime() < now.getTime();
}

/** UTC bounds [start, end) for a whole civil day in the clinic's timezone. */
export function civilDateToUtcDayBounds(date: string): { start: Date; end: Date } {
  const start = DateTime.fromFormat(date, "yyyy-MM-dd", { zone: CLINIC_TIMEZONE }).startOf("day");
  if (!start.isValid) {
    throw new InvalidDateTimeError(start.invalidReason ?? "invalid date");
  }
  return { start: start.toJSDate(), end: start.plus({ days: 1 }).toJSDate() };
}

export class InvalidDateTimeError extends Error {
  constructor(reason: string) {
    super(`Invalid date/time: ${reason}`);
    this.name = "InvalidDateTimeError";
  }
}
