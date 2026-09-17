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

/**
 * "YYYY-MM-DD"(LocalDate)뿐 아니라 "YYYY-MM-DDTHH:mm:ss.SSSSSS"(LocalDateTime) 문자열도 받는다 —
 * 신고/알림/관리자 처리이력 등 BE의 createdAt류는 대부분 LocalDateTime이라 "T" 이후를 버리지
 * 않으면 day가 "21T13:17:20.955093" 같은 문자열이 되어 NaN이 된다. 시각은 표시에 안 쓰므로
 * 날짜만 취해도 안전하다.
 */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * `parseISODate`는 날짜만 취하려고 의도적으로 시각을 버리므로(주석 참고), 채팅 메시지 시각처럼
 * 시:분까지 필요한 표시에는 이 함수를 쓴다. "T" 이후가 없으면 자정으로 취급한다.
 */
export function parseISODateTime(value: string): Date {
  const [datePart, timePart = "00:00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map((part) => Number(part.split(".")[0]));
  return new Date(year, month - 1, day, hour, minute, second || 0);
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
 * Custom calendar range-selection rule (handoff README §2): first click arms a single day
 * (start=end). A second click on a later day extends `end` to form the range. Any click while
 * a complete range (start!==end) is already selected, or a click before the armed start, resets
 * to a fresh single-day selection. ISO "YYYY-MM-DD" strings compare correctly with plain `<`/`>`.
 */
export function applyCalendarRangeClick(current: DateRange, clickedIso: string): DateRange {
  const hasCompleteRange = !!current.start && !!current.end && current.start !== current.end;
  if (!current.start || hasCompleteRange) {
    return { start: clickedIso, end: clickedIso };
  }
  if (clickedIso < current.start) {
    return { start: clickedIso, end: clickedIso };
  }
  return { start: current.start, end: clickedIso };
}
