"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminEquipmentTab } from "@/components/admin/AdminEquipmentTab";
import { AdminHistoryTab } from "@/components/admin/AdminHistoryTab";
import { AdminPaymentsTab } from "@/components/admin/AdminPaymentsTab";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { Tabs, type TabItem } from "@/components/ui/Tabs";

export type AdminTabKey = "users" | "equipment" | "reports" | "payments" | "history";

const ADMIN_TABS: TabItem[] = [
  { value: "users", label: "회원" },
  { value: "equipment", label: "장비" },
  { value: "reports", label: "신고" },
  { value: "payments", label: "결제" },
  { value: "history", label: "처리 이력" },
];

export function AdminListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get("tab") as AdminTabKey | null;
  const tab: AdminTabKey = ADMIN_TABS.some((item) => item.value === requestedTab)
    ? (requestedTab as AdminTabKey)
    : "users";

  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 pt-7 pb-24">
      <h1 className="text-[20px] font-extrabold text-ink">관리자</h1>
      <p className="mt-1.5 mb-5 text-[12.5px] text-text-secondary">
        회원 · 장비 · 신고 · 결제를 조회하고 상태를 처리합니다.
      </p>

      <Tabs
        className="mb-5"
        value={tab}
        onChange={(value) => router.push(`/admin?tab=${value}`)}
        items={ADMIN_TABS}
      />

      <AdminStatCards />

      {tab === "users" && <AdminUsersTab />}
      {tab === "equipment" && <AdminEquipmentTab />}
      {tab === "reports" && <AdminReportsTab />}
      {tab === "payments" && <AdminPaymentsTab />}
      {tab === "history" && <AdminHistoryTab />}
    </div>
  );
}
