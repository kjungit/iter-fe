export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** 0 (Sun) - 6 (Sat) weekday of the 1st of the given month. */
export function firstWeekdayOfMonth(date: Date): number {
  return startOfMonth(date).getDay();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

export function diffInDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface DateRange {
  start: string | null;
  end: string | null;
}

/**
 * Custom calendar range-selection rule (handoff README §2):
 * no range yet, or start===end already, or the clicked date is before the
 * current start -> reset start=end=clicked. Otherwise only extend `end`.
 * ISO "YYYY-MM-DD" strings compare correctly with plain `<`/`>`.
 */
export function applyCalendarRangeClick(current: DateRange, clickedIso: string): DateRange {
  if (!current.start || !current.end || current.start === current.end || clickedIso < current.start) {
    return { start: clickedIso, end: clickedIso };
  }
  return { start: current.start, end: clickedIso };
}
