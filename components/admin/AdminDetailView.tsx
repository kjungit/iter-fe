"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Textarea } from "@/components/ui/Textarea";
import { Timeline } from "@/components/ui/Timeline";
import {
  ENTITY_LABEL,
  ENTITY_TARGET_TYPE,
  HAS_EVIDENCE,
  RELATED_ITEMS_LABEL,
  STATUS_OPTIONS,
  type AdminEntityKey,
} from "@/lib/admin-config";
import { formatCurrency, formatDisplayDate } from "@/lib/format";
import {
  disputeStatusBadge,
  equipmentStatusBadge,
  memberStatusBadge,
  reportStatusBadge,
  type BadgeInfo,
} from "@/lib/status";
import { useConfirm } from "@/lib/store/confirm-modal-context";
import { useAppData } from "@/lib/store/app-data-context";

interface RelatedItem {
  title: string;
  meta: string;
  badge?: string;
}

interface DetailContent {
  title: string;
  subtitle: string;
  badge: BadgeInfo;
  basicInfo: Array<[string, string]>;
  evidencePhotoUrls: string[];
  relatedItems: RelatedItem[];
  quickActions: Array<{ label: string; danger?: boolean; onClick?: () => void }>;
}

export function AdminDetailView({ entity, id }: { entity: AdminEntityKey; id: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const store = useAppData();
  const { updateAdminStatus, fileDispute } = store;

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [memo, setMemo] = useState("");

  const content = buildDetailContent(entity, id, store, () => {
    fileDispute(id);
    router.push("/admin?tab=disputes");
  });

  if (!content) {
    return (
      <div className="mx-auto max-w-[1000px] px-6 py-16 text-center text-[13px] text-text-secondary">
        대상을 찾을 수 없습니다.{" "}
        <Link href={`/admin?tab=${entity}`} className="font-semibold text-ink-strong">
          목록으로
        </Link>
      </div>
    );
  }

  const currentStatus = content.badge.label;
  const activeStatus = selectedStatus ?? currentStatus;

  const targetHistory = store.adminHistory.filter(
    (item) => item.targetType === ENTITY_TARGET_TYPE[entity] && item.targetId === id,
  );

  const handleApply = async () => {
    if (!(await confirm({ message: `상태를 "${activeStatus}"(으)로 변경하시겠어요?` }))) return;
    updateAdminStatus(ENTITY_TARGET_TYPE[entity], id, activeStatus, memo);
    router.push(`/admin?tab=${entity}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 pt-7 pb-24">
      <Link href={`/admin?tab=${entity}`} className="text-[13px] font-semibold text-text-secondary">
        ← {ENTITY_LABEL[entity]} 목록
      </Link>

      <div className="mt-4 mb-6 flex items-start justify-between">
        <div>
          <div className="text-[12px] font-bold text-text-secondary">{ENTITY_LABEL[entity]}</div>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-[22px] font-extrabold text-ink">{content.title}</h1>
            <Badge label={content.badge.label} palette={content.badge.palette} size="md" />
          </div>
          <div className="mt-1 text-[12.5px] text-text-secondary">{content.subtitle}</div>
        </div>
        {content.quickActions.length > 0 && (
          <div className="flex gap-2">
            {content.quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.danger ? "danger-outline" : "secondary"}
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] items-start gap-5">
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-border p-5">
            <h2 className="mb-3 text-[13px] font-bold text-ink">기본 정보</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {content.basicInfo.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-[#F4F4F4] pb-2.5 text-[12.5px]"
                >
                  <span className="text-text-secondary">{label}</span>
                  <span className="font-semibold text-[#222222]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {HAS_EVIDENCE[entity] && (
            <div className="rounded-lg border border-border p-5">
              <h2 className="mb-1 text-[13px] font-bold text-ink">첨부 증빙</h2>
              <p className="mb-3 text-[12px] text-text-secondary">신고·분쟁 처리 시 참고할 증빙 자료입니다.</p>
              {content.evidencePhotoUrls.length === 0 ? (
                <p className="text-[12.5px] text-text-secondary">등록된 증빙이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {content.evidencePhotoUrls.slice(0, 4).map((url) => (
                    <ImagePlaceholder key={url} size="sm" rounded="rounded-sm" />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border p-5">
            <h2 className="mb-3 text-[13px] font-bold text-ink">{RELATED_ITEMS_LABEL[entity]}</h2>
            <div className="flex flex-col gap-2">
              {content.relatedItems.length === 0 && (
                <p className="text-[12.5px] text-text-secondary">연관 내역이 없습니다.</p>
              )}
              {content.relatedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-sm bg-surface-alt px-3.5 py-3"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{item.title}</div>
                    <div className="mt-0.5 text-[12px] text-text-secondary">{item.meta}</div>
                  </div>
                  {item.badge && (
                    <span className="text-[12px] font-bold text-text-body-2">{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border p-5">
            <h2 className="mb-3 text-[13px] font-bold text-ink">이 대상의 처리 이력</h2>
            {targetHistory.length === 0 ? (
              <p className="text-[12.5px] text-text-secondary">처리 이력이 없습니다.</p>
            ) : (
              <Timeline
                orientation="vertical"
                dotSize="sm"
                steps={targetHistory.map((item) => ({
                  label: item.action,
                  state: "reached",
                  caption: `${item.occurredAt} · ${item.adminName}`,
                }))}
              />
            )}
          </div>
        </div>

        <div className="sticky top-[84px] rounded-lg border border-border p-5">
          <h2 className="mb-3 text-[13px] font-bold text-ink">상태 변경</h2>
          <div className="flex flex-col gap-2">
            {STATUS_OPTIONS[entity].map((option) => {
              const selected = option === activeStatus;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedStatus(option)}
                  className={
                    "rounded-sm border px-3.5 py-[11px] text-left text-[12.5px] font-bold " +
                    (selected
                      ? "border-ink-strong bg-ink-strong text-white"
                      : "border-border-input bg-white text-text-body-3")
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
          <Textarea
            className="mt-3.5"
            minHeight={90}
            placeholder="처리 사유를 남기면 관리자 처리 이력에 기록됩니다."
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
          <Button variant="primary" fullWidth className="mt-3.5" onClick={handleApply}>
            상태 변경 적용
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildDetailContent(
  entity: AdminEntityKey,
  id: string,
  store: ReturnType<typeof useAppData>,
  convertReportToDispute: () => void,
): DetailContent | null {
  const { adminMembers, equipment, reports, disputes } = store;

  if (entity === "users") {
    const member = adminMembers.find((candidate) => candidate.id === id);
    if (!member) return null;
    // 대여 내역은 이제 실 API(lib/api/rentals.ts)에서만 조회 가능 — 관리자 화면이 실 API로
    // 전환되기 전까지는(admin-integration 단계) 회원별 최근 거래 미리보기를 비워둔다.
    const related: RelatedItem[] = [];
    return {
      title: member.name,
      subtitle: member.email,
      badge: memberStatusBadge(member.status),
      basicInfo: [
        ["이메일", member.email],
        ["휴대폰", member.phoneMasked],
        ["가입일", formatDisplayDate(member.joinedAt)],
        ["최근 접속", formatDisplayDate(member.lastActiveAt)],
        ["누적 신고", `${member.reportCount}건`],
        ["거래 건수", `대여 ${member.borrowedCount} / 대여해줌 ${member.lentCount}`],
        ["등록 장비", `${member.registeredEquipmentCount}건`],
        ["연체 이력", `${member.overdueCount}건`],
      ],
      evidencePhotoUrls: [],
      relatedItems: related,
      quickActions: [],
    };
  }

  if (entity === "equipment") {
    const item = equipment.find((candidate) => candidate.id === id);
    if (!item) return null;
    // 대여 내역은 실 API 전환 전까지 비워둔다 (위 users 분기와 동일한 이유).
    const related: RelatedItem[] = [];
    return {
      title: item.name,
      subtitle: item.category,
      badge: equipmentStatusBadge(item.status),
      basicInfo: [
        ["카테고리", item.category],
        ["등록자", item.ownerName],
        ["일 대여료", formatCurrency(item.pricePerDay)],
        ["장비 상태", item.condition],
        ["등록일", formatDisplayDate(item.createdAt)],
        ["신고 접수", `${item.reportCount}건`],
        ["평균 평점", item.ratingAverage.toFixed(1)],
      ],
      evidencePhotoUrls: [],
      relatedItems: related,
      quickActions: [],
    };
  }

  if (entity === "reports") {
    const report = reports.find((candidate) => candidate.id === id);
    if (!report) return null;
    const related: RelatedItem[] = [];
    reports
      .filter((other) => other.rentalId === report.rentalId && other.id !== report.id)
      .forEach((other) => related.push({ title: other.reason, meta: "동일 거래 신고", badge: other.status }));

    return {
      title: report.reason,
      subtitle: report.equipmentName,
      badge: reportStatusBadge(report.status),
      basicInfo: [
        ["신고번호", report.id],
        ["신고자", report.reporterName],
        ["피신고자", report.reportedUserName],
        ["접수일", formatDisplayDate(report.createdAt)],
        ["대상 거래", report.rentalId],
        ["대상 장비", report.equipmentName],
        ["증빙", `${report.photoUrls.length}장`],
        ["분쟁 전환 가능", report.disputeEligible ? "가능" : "불가"],
      ],
      evidencePhotoUrls: report.photoUrls,
      relatedItems: related,
      quickActions: [
        ...(report.disputeEligible
          ? [{ label: "분쟁으로 전환", onClick: convertReportToDispute }]
          : []),
        { label: "신고자에게 답변" },
      ],
    };
  }

  const dispute = disputes.find((candidate) => candidate.id === id);
  if (!dispute) return null;
  const report = reports.find((candidate) => candidate.id === dispute.reportId);
  const related: RelatedItem[] = [];
  if (report) related.push({ title: report.reason, meta: "연관 신고", badge: report.status });

  return {
    title: dispute.reason,
    subtitle: dispute.equipmentName,
    badge: disputeStatusBadge(dispute.status),
    basicInfo: [
      ["분쟁번호", dispute.id],
      ["당사자", dispute.partyNames.join(" · ")],
      ["연관 신고", dispute.reportId],
      ["개시일", formatDisplayDate(dispute.createdAt)],
      ["청구 금액", formatCurrency(dispute.claimAmount)],
      ["대상 장비", dispute.equipmentName],
      ["증빙 제출", `${dispute.evidencePhotoUrls.length}장`],
      ["조정 기한", formatDisplayDate(dispute.adjustmentDueDate)],
    ],
    evidencePhotoUrls: dispute.evidencePhotoUrls,
    relatedItems: related,
    quickActions: [{ label: "조정안 발송" }, { label: "환불 처리", danger: true }],
  };
}
