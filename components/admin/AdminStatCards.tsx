"use client";

import { StatCard } from "@/components/ui/StatCard";
import { useAppData } from "@/lib/store/app-data-context";

export function AdminStatCards() {
  const { adminMembers, equipment, reports, disputes } = useAppData();

  const unresolvedReports = reports.filter(
    (report) => report.status !== "처리완료" && report.status !== "반려",
  ).length;
  const openDisputes = disputes.filter((dispute) => dispute.status !== "종결").length;

  return (
    <div className="mb-5 grid grid-cols-4 gap-3">
      <StatCard label="전체 회원" value={adminMembers.length} />
      <StatCard label="등록 장비" value={equipment.length} />
      <StatCard label="미처리 신고" value={unresolvedReports} />
      <StatCard label="진행 중 분쟁" value={openDisputes} />
    </div>
  );
}
