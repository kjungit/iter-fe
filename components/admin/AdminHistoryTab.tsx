"use client";

import { useQuery } from "@tanstack/react-query";
import { Table } from "@/components/ui/Table";
import { CursorPager } from "@/components/ui/CursorPager";
import { useCursorPager } from "@/lib/hooks/useCursorPager";
import {
  ADMIN_ACTION_LABELS,
  ADMIN_ACTION_TARGET_LABELS,
  fetchAdminActions,
} from "@/lib/api/admin";
import { formatDisplayDate } from "@/lib/format";

export function AdminHistoryTab() {
  const { cursor, hasPrev, goNext, goPrev } = useCursorPager();

  const { data } = useQuery({
    queryKey: ["admin", "actions", cursor],
    queryFn: () => fetchAdminActions({ cursor, size: 20 }),
  });

  return (
    <div>
      <Table
        rows={data?.content ?? []}
        rowKey={(row) => row.actionId}
        gridTemplateColumns="0.9fr 0.7fr 1.4fr 1.1fr"
        columns={[
          { key: "occurredAt", header: "일시", render: (row) => formatDisplayDate(row.createdAt) },
          { key: "admin", header: "관리자", render: (row) => `#${row.adminId}` },
          { key: "action", header: "처리 내용", render: (row) => ADMIN_ACTION_LABELS[row.action] },
          {
            key: "target",
            header: "대상",
            render: (row) => `${ADMIN_ACTION_TARGET_LABELS[row.targetType]} #${row.targetId}`,
          },
        ]}
      />
      <CursorPager hasPrev={hasPrev} hasNext={!!data?.hasNext} onPrev={goPrev} onNext={() => goNext(data)} />
    </div>
  );
}
