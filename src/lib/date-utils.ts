/**
 * Narzędzia do obsługi dat i strefy czasowej Europe/Warsaw
 */

export function getWarsawDate(inputDate?: Date | string): Date {
  const date = inputDate ? new Date(inputDate) : new Date();
  return date;
}

export function getWarsawTimeParts(inputDate?: Date | string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number; // 0 = niedziela, 1 = poniedziałek, ..., 6 = sobota
} {
  const date = inputDate ? new Date(inputDate) : new Date();
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "narrow",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  // Obliczenie dnia tygodnia w strefie Europe/Warsaw
  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Warsaw",
    weekday: "short",
  }).format(date);

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10),
    hour: parseInt(partMap.hour, 10),
    minute: parseInt(partMap.minute, 10),
    dayOfWeek: dayMap[weekdayStr] ?? date.getDay(),
  };
}

/**
 * Sprawdza czy w strefie Europe/Warsaw trwa weekend (sobota 00:00 - niedziela 23:59)
 */
export function isWeekendWarsaw(inputDate?: Date | string): boolean {
  const { dayOfWeek } = getWarsawTimeParts(inputDate);
  return dayOfWeek === 6 || dayOfWeek === 0; // 6 = sobota, 0 = niedziela
}

/**
 * Sprawdza czy data mieści się w zadanym przedziale czasowym
 */
export function isDateWithinRange(
  inputDate?: Date | string,
  startDate?: string,
  endDate?: string,
  noEndDate: boolean = false
): boolean {
  const current = inputDate ? new Date(inputDate).getTime() : Date.now();

  if (startDate) {
    const start = new Date(startDate).getTime();
    if (current < start) return false;
  }

  if (!noEndDate && endDate) {
    const end = new Date(endDate).getTime();
    if (current > end) return false;
  }

  return true;
}

/**
 * Dodaje liczbę dni (np. 30 dni ważności kodu) i zwraca ISO string
 */
export function addDaysWarsaw(days: number, fromDate?: Date | string): string {
  const base = fromDate ? new Date(fromDate) : new Date();
  const result = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return result.toISOString();
}

/**
 * Formatuje datę po polsku w strefie Europe/Warsaw
 */
export function formatDateTimeWarsaw(
  inputDate?: Date | string,
  includeTime: boolean = true
): string {
  if (!inputDate) return "—";
  const date = new Date(inputDate);
  if (isNaN(date.getTime())) return "—";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  };

  return new Intl.DateTimeFormat("pl-PL", options).format(date);
}

