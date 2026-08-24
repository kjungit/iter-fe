"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Pager } from "@/components/ui/Pager";
import { formatDisplayDate } from "@/lib/format";
import { fetchMyReports } from "@/lib/api/reports";
import { reportStatusBadge } from "@/lib/status";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

const PAGE_SIZE = 20;

export function ReportsListView() {
  const currentUser = useRequireAuth();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "mine", page],
    queryFn: () => fetchMyReports({ page, size: PAGE_SIZE }),
    enabled: !!currentUser,
  });
  const reports = data?.content;

  if (!currentUser) return null;

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pt-7 pb-24">
      <Link href="/mypage" className="text-[13px] font-semibold text-text-secondary">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 mb-5 text-[20px] font-extrabold text-ink">내 신고 내역</h1>
      <div className="flex flex-col gap-2.5">
        {isLoading && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
        )}
        {!isLoading && reports?.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">신고 내역이 없습니다.</p>
        )}
        {reports?.map((report) => {
          const badge = reportStatusBadge(report.status);
          return (
            <Link
              key={report.reportId}
              href={`/reports/${report.reportId}`}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <div className="text-[14px] font-bold text-ink">{report.reason}</div>
                <div className="mt-1 text-[12.5px] text-text-secondary">
                  접수 {formatDisplayDate(report.createdAt)}
                </div>
              </div>
              <Badge label={badge.label} palette={badge.palette} />
            </Link>
          );
        })}
      </div>
      {data && <Pager page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
