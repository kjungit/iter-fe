"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatDailyPrice } from "@/lib/format";
import { fetchMyEquipment } from "@/lib/api/equipment";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { useAppData } from "@/lib/store/app-data-context";

const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "공개중",
  INACTIVE: "숨김",
  MAINTENANCE: "점검중",
  SUSPENDED: "이용중지",
  DELETED: "삭제됨",
};

export function MyPageView() {
  const router = useRouter();
  const currentUser = useRequireAuth();
  const { reports, logout } = useAppData();
  const { data: myEquipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ["equipment", "mine"],
    queryFn: fetchMyEquipment,
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  const myReportCount = reports.filter((report) => report.reporterId === currentUser.id).length;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 pt-7 pb-24">
      <h1 className="mb-5 text-[20px] font-extrabold text-ink">마이페이지</h1>

      <div className="flex items-center gap-4 rounded-lg border border-border p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-strong text-[16px] font-bold text-white">
          {currentUser.avatarInitials.slice(0, 2)}
        </div>
        <div>
          <div className="text-[15px] font-extrabold text-ink">{currentUser.name}</div>
          <div className="mt-0.5 text-[12.5px] text-text-secondary">{currentUser.email}</div>
        </div>
      </div>

      <h2 className="mt-7 mb-2.5 text-[13.5px] font-bold text-ink">기본 배송지</h2>
      <div className="rounded-md border border-border p-4 text-[13px] leading-[1.6] text-text-body-1">
        {currentUser.defaultAddress ? (
          <>
            {currentUser.defaultAddress.recipientName} · {currentUser.defaultAddress.phone}
            <br />({currentUser.defaultAddress.zipcode}) {currentUser.defaultAddress.address}{" "}
            {currentUser.defaultAddress.detailAddress}
          </>
        ) : (
          <span className="text-text-secondary">등록된 배송지가 없습니다.</span>
        )}
      </div>

      <div className="mt-7 mb-2.5 flex items-center justify-between">
        <h2 className="text-[13.5px] font-bold text-ink">내가 등록한 장비</h2>
        <Link href="/equipment/new" className="text-[12px] font-semibold text-text-secondary">
          + 새 장비 등록
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {isLoadingEquipment && (
          <p className="col-span-2 py-6 text-center text-[12.5px] text-text-secondary">
            불러오는 중...
          </p>
        )}
        {!isLoadingEquipment && myEquipment?.length === 0 && (
          <p className="col-span-2 py-6 text-center text-[12.5px] text-text-secondary">
            등록한 장비가 없습니다.
          </p>
        )}
        {myEquipment?.map((item) => (
          <Link
            key={item.id}
            href={`/equipment/${item.id}`}
            className="flex items-center gap-2.5 rounded-md border border-border p-3"
          >
            <div className="h-11 w-11 shrink-0">
              <ImagePlaceholder rounded="rounded-sm" src={item.thumbnailUrl} alt={item.name} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-ink">{item.name}</div>
              <div className="mt-0.5 text-[12px] text-text-secondary">
                {formatDailyPrice(item.dailyPrice)}
              </div>
            </div>
            <Badge
              label={EQUIPMENT_STATUS_LABELS[item.status] ?? item.status}
              palette={item.status === "ACTIVE" ? "success" : "neutral"}
            />
          </Link>
        ))}
      </div>

      <Link
        href="/reports"
        className="mt-7 flex items-center justify-between rounded-md border border-border p-4"
      >
        <span className="text-[13.5px] font-bold text-ink">내 신고 내역</span>
        <span className="text-[12.5px] text-text-secondary">{myReportCount}건 →</span>
      </Link>

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={handleLogout}
          className="text-[12.5px] font-semibold text-text-tertiary"
        >
          로그아웃
        </button>
        <button type="button" className="text-[12.5px] font-semibold text-text-tertiary">
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
