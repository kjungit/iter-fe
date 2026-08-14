"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDisplayDate } from "@/lib/format";
import { reportStatusBadge } from "@/lib/status";
import { useMockData } from "@/lib/store/mock-data-context";

export function ReportsListView() {
  const { reports, currentUser } = useMockData();
  const mine = reports.filter((report) => report.reporterId === currentUser.id);

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pt-7 pb-24">
      <Link href="/mypage" className="text-[13px] font-semibold text-text-secondary">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 mb-5 text-[20px] font-extrabold text-ink">내 신고 내역</h1>
      <div className="flex flex-col gap-2.5">
        {mine.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">신고 내역이 없습니다.</p>
        )}
        {mine.map((report) => {
          const badge = reportStatusBadge(report.status);
          return (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <div className="text-[14px] font-bold text-ink">{report.reason}</div>
                <div className="mt-1 text-[12.5px] text-text-secondary">
                  {report.equipmentName} · 접수 {formatDisplayDate(report.createdAt)}
                </div>
              </div>
              <Badge label={badge.label} palette={badge.palette} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
