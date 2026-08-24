"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { CursorPager } from "@/components/ui/CursorPager";
import { useCursorPager } from "@/lib/hooks/useCursorPager";
import { EQUIPMENT_CATEGORY_LABELS } from "@/lib/api/equipment";
import { fetchAdminEquipment } from "@/lib/api/admin";
import { formatDailyPrice } from "@/lib/format";
import { equipmentStatusBadge } from "@/lib/status";

export function AdminEquipmentTab() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const { cursor, hasPrev, goNext, goPrev, reset } = useCursorPager();

  const { data } = useQuery({
    queryKey: ["admin", "equipment", keyword, cursor],
    queryFn: () => fetchAdminEquipment({ keyword: keyword || undefined, cursor, size: 20 }),
  });

  return (
    <div>
      <Input
        className="mb-3 max-w-[280px]"
        placeholder="장비명 검색"
        value={keyword}
        onChange={(event) => {
          reset();
          setKeyword(event.target.value);
        }}
      />
      <Table
        rows={data?.content ?? []}
        rowKey={(row) => row.equipmentId}
        gridTemplateColumns="1.4fr 0.8fr 1fr 1fr 0.8fr"
        onRowClick={(row) => router.push(`/admin/equipment/${row.equipmentId}`)}
        columns={[
          { key: "name", header: "장비명", render: (row) => row.name },
          { key: "category", header: "카테고리", render: (row) => EQUIPMENT_CATEGORY_LABELS[row.category] },
          { key: "price", header: "일 대여료", render: (row) => formatDailyPrice(row.dailyPrice) },
          { key: "owner", header: "등록자", render: (row) => row.ownerNickname },
          {
            key: "status",
            header: "상태",
            render: (row) => {
              const badge = equipmentStatusBadge(row.status);
              return <Badge label={badge.label} palette={badge.palette} />;
            },
          },
          { key: "action", header: "", render: () => "상세" },
        ]}
      />
      <CursorPager hasPrev={hasPrev} hasNext={!!data?.hasNext} onPrev={goPrev} onNext={() => goNext(data)} />
    </div>
  );
}
