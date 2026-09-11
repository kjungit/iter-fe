"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { CursorPager } from "@/components/ui/CursorPager";
import { useCursorPager } from "@/lib/hooks/useCursorPager";
import { fetchAdminPayments } from "@/lib/api/admin";
import { formatCurrency, formatDisplayDate } from "@/lib/format";
import { paymentStatusBadge } from "@/lib/status";

export function AdminPaymentsTab() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const { cursor, hasPrev, goNext, goPrev, reset } = useCursorPager();

  const { data } = useQuery({
    queryKey: ["admin", "payments", keyword, cursor],
    queryFn: () => fetchAdminPayments({ keyword: keyword || undefined, cursor, size: 20 }),
  });

  return (
    <div>
      <Input
        className="mb-3 max-w-[280px]"
        placeholder="주문번호·구매자 검색"
        value={keyword}
        onChange={(event) => {
          reset();
          setKeyword(event.target.value);
        }}
      />
      <Table
        rows={data?.content ?? []}
        rowKey={(row) => row.paymentId}
        gridTemplateColumns="1.2fr 1fr 1fr 0.9fr 0.9fr"
        onRowClick={(row) => router.push(`/admin/payments/${row.paymentId}`)}
        columns={[
          { key: "equipment", header: "장비", render: (row) => row.equipmentName },
          { key: "renter", header: "구매자", render: (row) => row.renterNickname },
          { key: "amount", header: "결제금액", render: (row) => formatCurrency(row.amount) },
          {
            key: "status",
            header: "상태",
            render: (row) => {
              const badge = paymentStatusBadge(row.paymentStatus);
              return <Badge label={badge.label} palette={badge.palette} />;
            },
          },
          { key: "createdAt", header: "결제일", render: (row) => formatDisplayDate(row.createdAt) },
        ]}
      />
      <CursorPager hasPrev={hasPrev} hasNext={!!data?.hasNext} onPrev={goPrev} onNext={() => goNext(data)} />
    </div>
  );
}
