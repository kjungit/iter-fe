import { parseISODate } from "@/lib/date";

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatDailyPrice(pricePerDay: number): string {
  return `일 ${formatCurrency(pricePerDay)}`;
}

export function formatDisplayDate(isoDate: string): string {
  const date = parseISODate(isoDate);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  return `${formatDisplayDate(startIso)} ~ ${formatDisplayDate(endIso)}`;
}

export function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
