"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { fetchAdminUsers } from "@/lib/api/admin";
import { adminUserStatusBadge } from "@/lib/status";
import { CursorPager } from "@/components/ui/CursorPager";
import { useCursorPager } from "@/lib/hooks/useCursorPager";

export function AdminUsersTab() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const { cursor, hasPrev, goNext, goPrev, reset } = useCursorPager();

  const { data } = useQuery({
    queryKey: ["admin", "users", keyword, cursor],
    queryFn: () => fetchAdminUsers({ keyword: keyword || undefined, cursor, size: 20 }),
  });

  return (
    <div>
      <Input
        className="mb-3 max-w-[280px]"
        placeholder="이름·이메일 검색"
        value={keyword}
        onChange={(event) => {
          reset();
          setKeyword(event.target.value);
        }}
      />
      <Table
        rows={data?.content ?? []}
        rowKey={(row) => row.userId}
        gridTemplateColumns="1fr 1.4fr 1fr 0.8fr"
        onRowClick={(row) => router.push(`/admin/users/${row.userId}`)}
        columns={[
          { key: "name", header: "이름", render: (row) => row.name },
          { key: "email", header: "이메일", render: (row) => row.email },
          {
            key: "status",
            header: "상태",
            render: (row) => {
              const badge = adminUserStatusBadge(row.status);
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
