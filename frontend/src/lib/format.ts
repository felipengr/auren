/** "2026-11-12" -> "quinta-feira, 12 de novembro" (interpretado como data civil, sem fuso). */
export function formatCivilDateLong(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const local = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(local);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** "2026-11-12" -> "12/11/2026" */
export function formatCivilDateShort(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/** ISO instant -> "quinta-feira, 12 de novembro às 08:00" no fuso da clínica. */
export function formatInstantLong(iso: string): string {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
  const capitalized = datePart.charAt(0).toUpperCase() + datePart.slice(1);
  return `${capitalized} às ${timePart}`;
}

const SHORT_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** ISO instant -> "12 nov. 2026 · 09:30" no fuso da clínica (central de laudos). */
export function formatInstantShort(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const month = SHORT_MONTHS[Number(get("month")) - 1] ?? "";
  return `${get("day")} ${month}. ${get("year")} · ${get("hour")}:${get("minute")}`;
}

export function formatPublishedAt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}
