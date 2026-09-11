"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Table } from "@/components/ui/Table";
import { CursorPager } from "@/components/ui/CursorPager";
import { useCursorPager } from "@/lib/hooks/useCursorPager";
import { fetchAdminReports } from "@/lib/api/admin";
import { REPORT_STATUS_LABELS, type ReportStatus } from "@/lib/api/reports";
import { formatDisplayDate } from "@/lib/format";
import { reportStatusBadge } from "@/lib/status";

const STATUS_FILTERS: (ReportStatus | "")[] = ["", "RECEIVED", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

export function AdminReportsTab() {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus | "">("");
  const { cursor, hasPrev, goNext, goPrev, reset } = useCursorPager();

  const { data } = useQuery({
    queryKey: ["admin", "reports", status, cursor],
    queryFn: () => fetchAdminReports({ status: status || undefined, cursor, size: 20 }),
  });

  return (
    <div>
      <FilterSelect
        className="mb-3 w-[200px]"
        value={status}
        options={STATUS_FILTERS.map((option) => ({
          value: option,
          label: option ? REPORT_STATUS_LABELS[option] : "전체 상태",
        }))}
        onChange={(next) => {
          reset();
          setStatus(next);
        }}
      />
      <Table
        rows={data?.content ?? []}
        rowKey={(row) => row.reportId}
        gridTemplateColumns="1.6fr 1fr 1fr 0.8fr"
        onRowClick={(row) => router.push(`/admin/reports/${row.reportId}`)}
        columns={[
          { key: "content", header: "신고 사유", render: (row) => row.reason },
          { key: "reporter", header: "신고자", render: (row) => row.reporterNickname },
          {
            key: "status",
            header: "상태",
            render: (row) => {
              const badge = reportStatusBadge(row.status);
              return <Badge label={badge.label} palette={badge.palette} />;
            },
          },
          { key: "createdAt", header: "접수일", render: (row) => formatDisplayDate(row.createdAt) },
        ]}
      />
      <CursorPager hasPrev={hasPrev} hasNext={!!data?.hasNext} onPrev={goPrev} onNext={() => goNext(data)} />
    </div>
  );
}
