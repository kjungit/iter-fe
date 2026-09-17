import { parseISODate, parseISODateTime } from "@/lib/date";

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

export function formatChatTime(isoDateTime: string): string {
  const date = parseISODateTime(isoDateTime);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** 채팅방 목록의 "마지막 메시지" 신선도 표시용 — 알림/대여내역처럼 날짜만 보여주기엔 정보가 부족하다. */
export function formatRelativeTime(isoDateTime: string): string {
  const diffMin = Math.floor((Date.now() - parseISODateTime(isoDateTime).getTime()) / 60_000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`;
  return formatDisplayDate(isoDateTime);
}
