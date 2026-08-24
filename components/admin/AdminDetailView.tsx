"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Textarea } from "@/components/ui/Textarea";
import type { AdminTabKey } from "@/components/admin/AdminListView";
import { EQUIPMENT_CATEGORY_LABELS, PRODUCT_CONDITION_LABELS, type EquipmentStatus } from "@/lib/api/equipment";
import { REPORT_STATUS_LABELS, type ReportStatus } from "@/lib/api/reports";
import { fetchRentalDetail } from "@/lib/api/rentals";
import {
  fetchAdminEquipmentDetail,
  fetchAdminPaymentDetail,
  fetchAdminReportDetail,
  fetchAdminUserDetail,
  updateAdminEquipmentStatus,
  updateAdminReportStatus,
  updateAdminUserStatus,
  type UserRole,
  type UserStatus,
} from "@/lib/api/admin";
import { formatCurrency, formatDisplayDate } from "@/lib/format";
import {
  adminUserStatusBadge,
  equipmentStatusBadge,
  paymentStatusBadge,
  reportStatusBadge,
  type BadgeInfo,
} from "@/lib/status";
import { ApiError } from "@/lib/api/client";
import { useConfirm } from "@/lib/store/confirm-modal-context";

const ENTITY_LABEL: Record<Exclude<AdminTabKey, "history">, string> = {
  users: "회원",
  equipment: "장비",
  reports: "신고",
  payments: "결제",
};

interface DetailShellProps {
  entity: Exclude<AdminTabKey, "history">;
  title: string;
  subtitle: string;
  badge: BadgeInfo;
  children: ReactNode;
  statusPanel?: ReactNode;
}

function DetailShell({ entity, title, subtitle, badge, children, statusPanel }: DetailShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 pt-7 pb-24">
      <Link href={`/admin?tab=${entity}`} className="text-[13px] font-semibold text-text-secondary">
        ← {ENTITY_LABEL[entity]} 목록
      </Link>

      <div className="mt-4 mb-6">
        <div className="text-[12px] font-bold text-text-secondary">{ENTITY_LABEL[entity]}</div>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-[22px] font-extrabold text-ink">{title}</h1>
          <Badge label={badge.label} palette={badge.palette} size="md" />
        </div>
        <div className="mt-1 text-[12.5px] text-text-secondary">{subtitle}</div>
      </div>

      <div className={statusPanel ? "grid grid-cols-[1.2fr_0.8fr] items-start gap-5" : ""}>
        <div className="flex flex-col gap-5">{children}</div>
        {statusPanel && (
          <div className="sticky top-[84px] rounded-lg border border-border p-5">{statusPanel}</div>
        )}
      </div>
    </div>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border border-border p-5">
      <h2 className="mb-3 text-[13px] font-bold text-ink">기본 정보</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-[#F4F4F4] pb-2.5 text-[12.5px]">
            <span className="text-text-secondary">{label}</span>
            <span className="font-semibold text-[#222222]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusChangePanel<TStatus extends string>({
  options,
  optionLabels,
  currentLabel,
  memoLabel,
  onApply,
  loading,
  error,
}: {
  options: TStatus[];
  optionLabels: Record<TStatus, string>;
  currentLabel: string;
  memoLabel: string;
  onApply: (status: TStatus, memo: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const [selected, setSelected] = useState<TStatus | null>(null);
  const [memo, setMemo] = useState("");
  const confirm = useConfirm();

  const active = selected ?? options[0];

  const handleApply = async () => {
    if (!memo.trim()) return;
    if (!(await confirm({ message: `상태를 "${optionLabels[active]}"(으)로 변경하시겠어요?` }))) return;
    onApply(active, memo);
  };

  return (
    <>
      <h2 className="mb-1 text-[13px] font-bold text-ink">상태 변경</h2>
      <p className="mb-3 text-[12px] text-text-secondary">현재 상태: {currentLabel}</p>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isSelected = option === active;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              className={
                "rounded-sm border px-3.5 py-[11px] text-left text-[12.5px] font-bold " +
                (isSelected
                  ? "border-ink-strong bg-ink-strong text-white"
                  : "border-border-input bg-white text-text-body-3")
              }
            >
              {optionLabels[option]}
            </button>
          );
        })}
      </div>
      <Textarea
        className="mt-3.5"
        minHeight={90}
        placeholder={memoLabel}
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
      />
      {error && <p className="mt-2 text-[12px] text-badge-danger-fg">{error}</p>}
      <Button
        variant="primary"
        fullWidth
        className="mt-3.5"
        disabled={!memo.trim()}
        loading={loading}
        onClick={handleApply}
      >
        상태 변경 적용
      </Button>
    </>
  );
}

export function AdminDetailView({
  entity,
  id,
}: {
  entity: Exclude<AdminTabKey, "history">;
  id: string;
}) {
  if (entity === "users") return <AdminUserDetail id={id} />;
  if (entity === "equipment") return <AdminEquipmentDetail id={id} />;
  if (entity === "reports") return <AdminReportDetail id={id} />;
  return <AdminPaymentDetail id={id} />;
}

/** 관리자 정책(AdminUserService.validateStatusChange)과 동일: 같은 상태로는 변경 불가, ADMIN은
 * 정지 불가, DELETED(탈퇴)는 조치 대상 아님. */
function allowedUserStatusOptions(status: UserStatus, role: UserRole): ("ACTIVE" | "SUSPENDED")[] {
  if (status === "DELETED") return [];
  if (status === "ACTIVE") return role === "ADMIN" ? [] : ["SUSPENDED"];
  return ["ACTIVE"];
}

/** 관리자 정책(AdminEquipmentService.validateStatusChange)과 동일: ACTIVE/INACTIVE → 차단(SUSPENDED)만,
 * SUSPENDED → 차단 해제(INACTIVE, 재공개는 등록자 몫)만 허용. MAINTENANCE/DELETED는 관리자 조치 대상 아님. */
function allowedEquipmentStatusOptions(status: EquipmentStatus): ("INACTIVE" | "SUSPENDED")[] {
  if (status === "ACTIVE" || status === "INACTIVE") return ["SUSPENDED"];
  if (status === "SUSPENDED") return ["INACTIVE"];
  return [];
}

/** 신고 상세 등에 끼워 넣는 축약형 카드 — DetailShell 없이 배지+기본정보+상태변경 패널만. */
function TargetStatusCard({
  title,
  badge,
  infoItems,
  statusPanel,
}: {
  title: ReactNode;
  badge: BadgeInfo;
  infoItems: Array<[string, string]>;
  statusPanel?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[13px] font-bold text-ink">{title}</h2>
        <Badge label={badge.label} palette={badge.palette} />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {infoItems.map(([label, value]) => (
          <div key={label} className="flex justify-between text-[12.5px]">
            <span className="text-text-secondary">{label}</span>
            <span className="font-semibold text-[#222222]">{value}</span>
          </div>
        ))}
      </div>
      {statusPanel}
    </div>
  );
}

function ReportTargetUserCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: user, isLoading } = useQuery({
    queryKey: ["admin", "users", "detail", userId],
    queryFn: () => fetchAdminUserDetail(userId),
  });

  const mutation = useMutation({
    mutationFn: (input: { status: "ACTIVE" | "SUSPENDED"; reason: string }) =>
      updateAdminUserStatus(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "detail", userId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "상태 변경에 실패했습니다."),
  });

  if (isLoading || !user) return null;

  const badge = adminUserStatusBadge(user.status);
  const allowedOptions = allowedUserStatusOptions(user.status, user.role);

  return (
    <TargetStatusCard
      title={
        <>
          신고 대상 회원 —{" "}
          <Link href={`/admin/users/${userId}`} className="underline">
            {user.name}
          </Link>
        </>
      }
      badge={badge}
      infoItems={[
        ["이메일", user.email],
        ["누적 신고", `${user.reportCount}건`],
      ]}
      statusPanel={
        allowedOptions.length > 0 ? (
          <StatusChangePanel
            options={allowedOptions}
            optionLabels={{ ACTIVE: "정지 해제", SUSPENDED: "정지" }}
            currentLabel={badge.label}
            memoLabel="처리 사유를 입력하면 관리자 처리 이력에 기록됩니다."
            loading={mutation.isPending}
            error={error}
            onApply={(status, reason) => {
              setError(null);
              mutation.mutate({ status, reason });
            }}
          />
        ) : undefined
      }
    />
  );
}

function ReportTargetEquipmentCard({ equipmentId }: { equipmentId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: item, isLoading } = useQuery({
    queryKey: ["admin", "equipment", "detail", equipmentId],
    queryFn: () => fetchAdminEquipmentDetail(equipmentId),
  });

  const mutation = useMutation({
    mutationFn: (input: { status: "INACTIVE" | "SUSPENDED"; reason: string }) =>
      updateAdminEquipmentStatus(equipmentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "equipment"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "equipment", "detail", equipmentId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "상태 변경에 실패했습니다."),
  });

  if (isLoading || !item) return null;

  const badge = equipmentStatusBadge(item.status);
  const allowedOptions = allowedEquipmentStatusOptions(item.status);

  return (
    <>
      <TargetStatusCard
        title={
          <>
            신고 대상 장비 —{" "}
            <Link href={`/admin/equipment/${equipmentId}`} className="underline">
              {item.name}
            </Link>
          </>
        }
        badge={badge}
        infoItems={[
          ["등록자", item.ownerNickname],
          ["카테고리", EQUIPMENT_CATEGORY_LABELS[item.category]],
        ]}
        statusPanel={
          allowedOptions.length > 0 ? (
            <StatusChangePanel
              options={allowedOptions}
              optionLabels={{ INACTIVE: "차단 해제(숨김 전환)", SUSPENDED: "차단" }}
              currentLabel={badge.label}
              memoLabel="처리 사유를 입력하면 관리자 처리 이력에 기록됩니다."
              loading={mutation.isPending}
              error={error}
              onApply={(status, reason) => {
                setError(null);
                mutation.mutate({ status, reason });
              }}
            />
          ) : undefined
        }
      />
      <ReportTargetUserCard userId={item.ownerId} />
    </>
  );
}

function ReportTargetRentalCard({ rentalId }: { rentalId: string }) {
  const { data: rental, isLoading } = useQuery({
    queryKey: ["rental", "detail", rentalId],
    queryFn: () => fetchRentalDetail(rentalId),
  });

  if (isLoading || !rental) return null;

  return (
    <>
      <ReportTargetEquipmentCard equipmentId={rental.equipment.equipmentId} />
      <ReportTargetUserCard userId={rental.renter.id} />
    </>
  );
}

function AdminUserDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: user, isLoading } = useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => fetchAdminUserDetail(id),
  });

  const mutation = useMutation({
    mutationFn: (input: { status: "ACTIVE" | "SUSPENDED"; reason: string }) =>
      updateAdminUserStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      router.push("/admin?tab=users");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "상태 변경에 실패했습니다."),
  });

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  const badge = adminUserStatusBadge(user.status);
  const allowedOptions = allowedUserStatusOptions(user.status, user.role);

  return (
    <DetailShell
      entity="users"
      title={user.name}
      subtitle={user.email}
      badge={badge}
      statusPanel={
        allowedOptions.length > 0 ? (
          <StatusChangePanel
            options={allowedOptions}
            optionLabels={{ ACTIVE: "정지 해제", SUSPENDED: "정지" }}
            currentLabel={badge.label}
            memoLabel="처리 사유를 입력하면 관리자 처리 이력에 기록됩니다."
            loading={mutation.isPending}
            error={error}
            onApply={(status, reason) => {
              setError(null);
              mutation.mutate({ status, reason });
            }}
          />
        ) : undefined
      }
    >
      <InfoGrid
        items={[
          ["이메일", user.email],
          ["휴대폰", user.phone],
          ["닉네임", user.nickname],
          ["가입일", formatDisplayDate(user.createdAt)],
          ["누적 신고", `${user.reportCount}건`],
          ["대여 건수", `대여함 ${user.rentedCount} / 대여해줌 ${user.lentCount}`],
          ["연체 이력", `${user.overdueCount}건`],
        ]}
      />
    </DetailShell>
  );
}

function AdminEquipmentDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: item, isLoading } = useQuery({
    queryKey: ["admin", "equipment", "detail", id],
    queryFn: () => fetchAdminEquipmentDetail(id),
  });

  const mutation = useMutation({
    mutationFn: (input: { status: "INACTIVE" | "SUSPENDED"; reason: string }) =>
      updateAdminEquipmentStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "equipment"] });
      router.push("/admin?tab=equipment");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "상태 변경에 실패했습니다."),
  });

  if (isLoading || !item) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  const badge = equipmentStatusBadge(item.status);
  const allowedOptions = allowedEquipmentStatusOptions(item.status);

  return (
    <DetailShell
      entity="equipment"
      title={item.name}
      subtitle={EQUIPMENT_CATEGORY_LABELS[item.category]}
      badge={badge}
      statusPanel={
        allowedOptions.length > 0 ? (
          <StatusChangePanel
            options={allowedOptions}
            optionLabels={{ INACTIVE: "차단 해제(숨김 전환)", SUSPENDED: "차단" }}
            currentLabel={badge.label}
            memoLabel="처리 사유를 입력하면 관리자 처리 이력에 기록됩니다."
            loading={mutation.isPending}
            error={error}
            onApply={(status, reason) => {
              setError(null);
              mutation.mutate({ status, reason });
            }}
          />
        ) : undefined
      }
    >
      <InfoGrid
        items={[
          ["카테고리", EQUIPMENT_CATEGORY_LABELS[item.category]],
          ["등록자", item.ownerNickname],
          ["일 대여료", formatCurrency(item.dailyPrice)],
          ["상품 상태", PRODUCT_CONDITION_LABELS[item.productCondition]],
          ["대여 가능 기간", `${item.availableFrom ?? "-"} ~ ${item.availableTo ?? "-"}`],
          ["등록일", formatDisplayDate(item.createdAt)],
        ]}
      />
      <div className="rounded-lg border border-border p-5">
        <h2 className="mb-1 text-[13px] font-bold text-ink">설명</h2>
        <p className="text-[13px] leading-[1.6] text-text-body-1">{item.description}</p>
      </div>
      {item.imageUrls.length > 0 && (
        <div className="rounded-lg border border-border p-5">
          <h2 className="mb-3 text-[13px] font-bold text-ink">등록 이미지</h2>
          <div className="grid grid-cols-4 gap-2">
            {item.imageUrls.slice(0, 8).map((url) => (
              <ImagePlaceholder key={url} size="sm" rounded="rounded-sm" src={url} />
            ))}
          </div>
        </div>
      )}
    </DetailShell>
  );
}

const REPORT_TARGET_TYPE_LABELS: Record<"USER" | "EQUIPMENT" | "RENTAL", string> = {
  USER: "회원",
  EQUIPMENT: "장비",
  RENTAL: "거래",
};

/** 관리자 정책(AdminReportService.validateStatusChange)과 동일한 상태 전이표. */
function allowedReportTransitions(status: ReportStatus): ReportStatus[] {
  switch (status) {
    case "RECEIVED":
      return ["UNDER_REVIEW", "RESOLVED", "REJECTED"];
    case "UNDER_REVIEW":
      return ["RESOLVED", "REJECTED"];
    case "RESOLVED":
    case "REJECTED":
      return [];
  }
}

function AdminReportDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: report, isLoading } = useQuery({
    queryKey: ["admin", "reports", "detail", id],
    queryFn: () => fetchAdminReportDetail(id),
  });

  const mutation = useMutation({
    mutationFn: (input: { status: ReportStatus; adminMemo: string }) =>
      updateAdminReportStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      router.push("/admin?tab=reports");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "상태 변경에 실패했습니다."),
  });

  if (isLoading || !report) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  const badge = reportStatusBadge(report.status);
  const allowedOptions = allowedReportTransitions(report.status);

  return (
    <DetailShell
      entity="reports"
      title={report.reason}
      subtitle={`신고자 ${report.reporterNickname}`}
      badge={badge}
      statusPanel={
        allowedOptions.length > 0 ? (
          <StatusChangePanel
            options={allowedOptions}
            optionLabels={REPORT_STATUS_LABELS}
            currentLabel={badge.label}
            memoLabel="관리자 처리 메모 (필수)"
            loading={mutation.isPending}
            error={error}
            onApply={(status, adminMemo) => {
              setError(null);
              mutation.mutate({ status, adminMemo });
            }}
          />
        ) : undefined
      }
    >
      <InfoGrid
        items={[
          ["신고번호", report.reportId],
          ["신고자", report.reporterNickname],
          ["대상 유형", REPORT_TARGET_TYPE_LABELS[report.targetType]],
          ["대상 ID", report.targetId],
          ["접수일", formatDisplayDate(report.createdAt)],
          ["처리일", report.resolvedAt ? formatDisplayDate(report.resolvedAt) : "-"],
          ...(report.adminMemo ? ([["관리자 메모", report.adminMemo]] as Array<[string, string]>) : []),
        ]}
      />
      <div className="rounded-lg border border-border p-5">
        <h2 className="mb-1 text-[13px] font-bold text-ink">신고 내용</h2>
        <p className="text-[13px] leading-[1.6] text-text-body-1">{report.description}</p>
      </div>

      {report.targetType === "USER" && <ReportTargetUserCard userId={report.targetId} />}
      {report.targetType === "EQUIPMENT" && <ReportTargetEquipmentCard equipmentId={report.targetId} />}
      {report.targetType === "RENTAL" && <ReportTargetRentalCard rentalId={report.targetId} />}
    </DetailShell>
  );
}

function AdminPaymentDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", "detail", id],
    queryFn: () => fetchAdminPaymentDetail(id),
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-16 text-center text-[13px] text-text-secondary">
        불러오는 중...
      </div>
    );
  }

  const { payment, rental } = data;
  const badge = paymentStatusBadge(payment.paymentStatus);

  return (
    <DetailShell
      entity="payments"
      title={payment.equipmentName}
      subtitle={`주문번호 ${payment.orderId}`}
      badge={badge}
    >
      <InfoGrid
        items={[
          ["구매자", `${payment.renterName} (${payment.renterNickname})`],
          ["결제금액", formatCurrency(payment.amount)],
          ["결제일", payment.paidAt ? formatDisplayDate(payment.paidAt) : "-"],
          ["환불일", payment.refundedAt ? formatDisplayDate(payment.refundedAt) : "-"],
          ["대여 기간", `${rental.startDate} ~ ${rental.endDate} (${rental.rentalDays}일)`],
          ["대여 총액", formatCurrency(rental.totalPrice)],
          ["대여 상태", rental.rentalStatus],
        ]}
      />
    </DetailShell>
  );
}
