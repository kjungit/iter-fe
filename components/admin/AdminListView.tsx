"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { ADMIN_TABS, HISTORY_TABLE_SPEC, TABLE_SPEC, type AdminTabKey } from "@/lib/admin-config";
import {
  disputeStatusBadge,
  equipmentStatusBadge,
  memberStatusBadge,
  reportStatusBadge,
} from "@/lib/status";
import { useAppData } from "@/lib/store/app-data-context";

export function AdminListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { adminMembers, equipment, reports, disputes, adminHistory } = useAppData();

  const requestedTab = searchParams.get("tab") as AdminTabKey | null;
  const tab: AdminTabKey = ADMIN_TABS.some((item) => item.value === requestedTab)
    ? (requestedTab as AdminTabKey)
    : "users";

  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 pt-7 pb-24">
      <h1 className="text-[20px] font-extrabold text-ink">관리자</h1>
      <p className="mt-1.5 mb-5 text-[12.5px] text-text-secondary">
        회원 · 장비 · 신고를 조회하고 상태를 처리합니다.
      </p>

      <Tabs
        className="mb-5"
        value={tab}
        onChange={(value) => router.push(`/admin?tab=${value}`)}
        items={ADMIN_TABS}
      />

      <AdminStatCards />

      {tab === "users" && (
        <Table
          rows={adminMembers}
          rowKey={(row) => row.id}
          gridTemplateColumns={TABLE_SPEC.users.gridTemplateColumns}
          onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
          columns={[
            { key: "name", header: "이름", render: (row) => row.name },
            { key: "email", header: "이메일", render: (row) => row.email },
            {
              key: "status",
              header: "상태",
              render: (row) => {
                const badge = memberStatusBadge(row.status);
                return <Badge label={badge.label} palette={badge.palette} />;
              },
            },
            { key: "action", header: "", render: () => "상세" },
          ]}
        />
      )}

      {tab === "equipment" && (
        <Table
          rows={equipment}
          rowKey={(row) => row.id}
          gridTemplateColumns={TABLE_SPEC.equipment.gridTemplateColumns}
          onRowClick={(row) => router.push(`/admin/equipment/${row.id}`)}
          columns={[
            { key: "name", header: "장비명", render: (row) => row.name },
            { key: "owner", header: "등록자", render: (row) => row.ownerName },
            {
              key: "status",
              header: "상태",
              render: (row) => {
                const badge = equipmentStatusBadge(row.status);
                return <Badge label={badge.label} palette={badge.palette} />;
              },
            },
            { key: "action", header: "", render: () => "처리" },
          ]}
        />
      )}

      {tab === "reports" && (
        <Table
          rows={reports}
          rowKey={(row) => row.id}
          gridTemplateColumns={TABLE_SPEC.reports.gridTemplateColumns}
          onRowClick={(row) => router.push(`/admin/reports/${row.id}`)}
          columns={[
            {
              key: "content",
              header: "신고 내용",
              render: (row) => `${row.reason} · ${row.equipmentName}`,
            },
            { key: "reporter", header: "신고자", render: (row) => row.reporterName },
            {
              key: "status",
              header: "상태",
              render: (row) => {
                const badge = reportStatusBadge(row.status);
                return <Badge label={badge.label} palette={badge.palette} />;
              },
            },
            { key: "action", header: "", render: () => "처리" },
          ]}
        />
      )}

      {tab === "disputes" && (
        <Table
          rows={disputes}
          rowKey={(row) => row.id}
          gridTemplateColumns={TABLE_SPEC.disputes.gridTemplateColumns}
          onRowClick={(row) => router.push(`/admin/disputes/${row.id}`)}
          columns={[
            { key: "reason", header: "분쟁 사유", render: (row) => row.reason },
            { key: "parties", header: "당사자", render: (row) => row.partyNames.join(" · ") },
            {
              key: "status",
              header: "상태",
              render: (row) => {
                const badge = disputeStatusBadge(row.status);
                return <Badge label={badge.label} palette={badge.palette} />;
              },
            },
            { key: "action", header: "", render: () => "처리" },
          ]}
        />
      )}

      {tab === "history" && (
        <Table
          rows={adminHistory}
          rowKey={(row) => row.id}
          gridTemplateColumns={HISTORY_TABLE_SPEC.gridTemplateColumns}
          columns={[
            { key: "occurredAt", header: "일시", render: (row) => row.occurredAt },
            { key: "adminName", header: "관리자", render: (row) => row.adminName },
            { key: "action", header: "처리 내용", render: (row) => row.action },
            { key: "target", header: "대상", render: (row) => row.targetLabel },
          ]}
        />
      )}
    </div>
  );
}
