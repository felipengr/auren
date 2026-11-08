/**
 * Sala única, horário de funcionamento fixo. Não veio especificado no
 * desafio, então assumimos um expediente comum de clínica — documentado
 * no README como decisão técnica.
 */
export const CLINIC_OPEN_HOUR = 8;
export const CLINIC_CLOSE_HOUR = 18; // último slot começa às 17:30
export const SLOT_MINUTES = 30;

export function dailySlotTimes(): string[] {
  const times: string[] = [];
  for (let minutes = CLINIC_OPEN_HOUR * 60; minutes < CLINIC_CLOSE_HOUR * 60; minutes += SLOT_MINUTES) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    times.push(`${hh}:${mm}`);
  }
  return times;
}
