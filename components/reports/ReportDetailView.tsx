"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Timeline } from "@/components/ui/Timeline";
import { formatDisplayDate } from "@/lib/format";
import { reportStatusBadge } from "@/lib/status";
import { useMockData } from "@/lib/store/mock-data-context";

export function ReportDetailView({ reportId }: { reportId: string }) {
  const { reports } = useMockData();
  const report = reports.find((candidate) => candidate.id === reportId);

  if (!report) {
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
  const steps = report.progress.map((step) => ({
    label: step.label,
    state: step.reachedAt ? ("reached" as const) : ("unreached" as const),
    caption: step.reachedAt ? formatDisplayDate(step.reachedAt) : "대기 중",
  }));

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
        접수일 {formatDisplayDate(report.createdAt)} · 신고번호 {report.id}
      </div>

      <div className="mb-[18px] rounded-lg border border-border px-5 py-[18px]">
        <div className="text-[12.5px] font-bold text-text-secondary">대상 거래</div>
        <div className="mt-1.5 text-[13.5px] font-bold text-ink">{report.equipmentName}</div>
        <div className="mt-1 text-[12.5px] text-text-secondary">{report.reportedUserName}</div>
      </div>

      <div className="mb-[18px] rounded-lg border border-border px-5 py-[18px]">
        <div className="text-[12.5px] font-bold text-text-secondary">신고 내용</div>
        <p className="mt-1.5 text-[13.5px] leading-[1.65] text-text-body-1">{report.detail}</p>
      </div>

      <div className="rounded-lg bg-surface px-5 py-[18px]">
        <div className="mb-3 text-[12.5px] font-bold text-text-secondary">처리 진행</div>
        <Timeline steps={steps} orientation="vertical" dotSize="sm" />
      </div>
    </div>
  );
}
