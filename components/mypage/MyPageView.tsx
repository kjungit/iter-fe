"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MyEquipmentCard } from "@/components/mypage/MyEquipmentCard";
import { UserRatingBadge } from "@/components/reviews/UserRatingBadge";
import { fetchMyEquipment } from "@/lib/api/equipment";
import { fetchMyReports } from "@/lib/api/reports";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { useAppData } from "@/lib/store/app-data-context";

const PREVIEW_SIZE = 4;

export function MyPageView() {
  const router = useRouter();
  const currentUser = useRequireAuth();
  const { logout } = useAppData();
  const { data: myEquipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ["equipment", "mine", { page: 0, size: PREVIEW_SIZE }],
    queryFn: () => fetchMyEquipment({ page: 0, size: PREVIEW_SIZE }),
    enabled: !!currentUser,
  });
  const { data: myReports } = useQuery({
    queryKey: ["reports", "mine", "count"],
    queryFn: () => fetchMyReports({ page: 0, size: 1 }),
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  const myReportCount = myReports?.totalElements ?? 0;

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
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-extrabold text-ink">{currentUser.name}</span>
            <UserRatingBadge userId={currentUser.id} />
          </div>
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
        {!isLoadingEquipment && myEquipment?.content.length === 0 && (
          <p className="col-span-2 py-6 text-center text-[12.5px] text-text-secondary">
            등록한 장비가 없습니다.
          </p>
        )}
        {myEquipment?.content.map((item) => <MyEquipmentCard key={item.id} item={item} />)}
      </div>
      {!!myEquipment && myEquipment.totalElements > PREVIEW_SIZE && (
        <Link
          href="/mypage/equipment"
          className="mt-2.5 block text-center text-[12.5px] font-semibold text-text-secondary"
        >
          전체 {myEquipment.totalElements}개 보기 →
        </Link>
      )}

      <Link
        href="/reports"
        className="mt-7 flex items-center justify-between rounded-md border border-border p-4"
      >
        <span className="text-[13.5px] font-bold text-ink">내 신고 내역</span>
        <span className="text-[12.5px] text-text-secondary">{myReportCount}건 →</span>
      </Link>

      <Link
        href="/mypage/reviews"
        className="mt-2.5 flex items-center justify-between rounded-md border border-border p-4"
      >
        <span className="text-[13.5px] font-bold text-ink">내가 쓴 리뷰</span>
        <span className="text-[12.5px] text-text-secondary">→</span>
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
