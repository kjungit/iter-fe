"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/ui/StatCard";
import { fetchAdminStats } from "@/lib/api/admin";

export function AdminStatCards() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
  });

  return (
    <div className="mb-5 grid grid-cols-4 gap-3">
      <StatCard label="전체 회원" value={data?.userCount ?? "-"} />
      <StatCard label="등록 장비" value={data?.equipmentCount ?? "-"} />
      <StatCard label="접수된 신고" value={data?.unresolvedReportCount ?? "-"} />
      <StatCard label="전체 결제" value={data?.paymentCount ?? "-"} />
    </div>
  );
}
