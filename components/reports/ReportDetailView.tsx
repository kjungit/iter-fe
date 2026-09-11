"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Timeline } from "@/components/ui/Timeline";
import { formatDisplayDate } from "@/lib/format";
import { fetchReportDetail } from "@/lib/api/reports";
import { reportStatusBadge } from "@/lib/status";

const TARGET_TYPE_LABELS: Record<string, string> = {
  USER: "회원",
  EQUIPMENT: "장비",
  RENTAL: "거래",
};

export function ReportDetailView({ reportId }: { reportId: string }) {
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ["reports", "detail", reportId],
    queryFn: () => fetchReportDetail(reportId),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[620px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="mx-auto max-w-[620px] px-6 py-16 text-center text-[13px] text-text-secondary">
        신고 내역을 찾을 수 없습니다.{" "}
        <Link href="/reports" className="font-semibold text-ink-strong">
          신고 내역으로
        </Link>
      </div>
    );
  }

  const badge = reportStatusBadge(report.status);
  const isTerminal = report.status === "RESOLVED" || report.status === "REJECTED";
  const steps = [
    { label: "접수 완료", state: "reached" as const, caption: formatDisplayDate(report.createdAt) },
    {
      label: "관리자 검토",
      state: (report.status !== "RECEIVED" ? "reached" : "unreached") as "reached" | "unreached",
      caption: report.status !== "RECEIVED" ? "검토 중" : "대기 중",
    },
    {
      label: "처리 완료",
      state: (isTerminal ? "reached" : "unreached") as "reached" | "unreached",
      caption: report.resolvedAt ? formatDisplayDate(report.resolvedAt) : "대기 중",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[620px] px-6 pt-7 pb-24">
      <Link href="/reports" className="text-[13px] font-semibold text-text-secondary">
        ← 신고 내역
      </Link>
      <div className="mt-2 flex items-center gap-2">
        <h1 className="text-[20px] font-extrabold text-ink">{report.reason}</h1>
        <Badge label={badge.label} palette={badge.palette} size="md" />
      </div>
      <div className="mt-1 mb-6 text-[12.5px] text-text-secondary">
        접수일 {formatDisplayDate(report.createdAt)} · 신고번호 {report.reportId}
      </div>

      <div className="mb-[18px] rounded-lg border border-border px-5 py-[18px]">
        <div className="text-[12.5px] font-bold text-text-secondary">신고 대상</div>
        <div className="mt-1.5 text-[13.5px] font-bold text-ink">
          {TARGET_TYPE_LABELS[report.targetType]} #{report.targetId}
        </div>
        <div className="mt-1 text-[12.5px] text-text-secondary">신고자 {report.reporterNickname}</div>
      </div>

      <div className="mb-[18px] rounded-lg border border-border px-5 py-[18px]">
        <div className="text-[12.5px] font-bold text-text-secondary">신고 내용</div>
        <p className="mt-1.5 text-[13.5px] leading-[1.65] text-text-body-1">{report.description}</p>
      </div>

      <div className="rounded-lg bg-surface px-5 py-[18px]">
        <div className="mb-3 text-[12.5px] font-bold text-text-secondary">처리 진행</div>
        <Timeline steps={steps} orientation="vertical" dotSize="sm" />
      </div>
    </div>
  );
}
