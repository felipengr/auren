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

export function formatPublishedAt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}
