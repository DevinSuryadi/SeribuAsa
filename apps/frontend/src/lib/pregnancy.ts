// Pregnancy dates follow Naegele's rule: the expected birth date is 280 days after the
// first day of the last menstrual period (HPHT). Dates are handled as local YYYY-MM-DD strings.

const DAY_MS = 86_400_000;
export const PREGNANCY_LENGTH_DAYS = 280;

const toUtcDay = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

export function localIsoDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(value: string, days: number): string {
  return new Date(toUtcDay(value) + days * DAY_MS).toISOString().slice(0, 10);
}

export function expectedBirthDate(lastMenstrualPeriod: string): string {
  return addDays(lastMenstrualPeriod, PREGNANCY_LENGTH_DAYS);
}

export function gestationalWeeks(lastMenstrualPeriod: string, on: string): number {
  return Math.max(0, Math.floor((toUtcDay(on) - toUtcDay(lastMenstrualPeriod)) / DAY_MS / 7));
}
