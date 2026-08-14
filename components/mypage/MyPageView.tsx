"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatDailyPrice } from "@/lib/format";
import { useMockData } from "@/lib/store/mock-data-context";

export function MyPageView() {
  const router = useRouter();
  const { currentUser, equipment, reports, logout } = useMockData();

  const myEquipment = equipment.filter((item) => item.ownerId === currentUser.id);
  const myReportCount = reports.filter((report) => report.reporterId === currentUser.id).length;

  const handleLogout = () => {
    logout();
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
        {currentUser.defaultAddress.recipientName} · {currentUser.defaultAddress.phone}
        <br />({currentUser.defaultAddress.zipcode}) {currentUser.defaultAddress.address}{" "}
        {currentUser.defaultAddress.detailAddress}
      </div>

      <h2 className="mt-7 mb-2.5 text-[13.5px] font-bold text-ink">내가 등록한 장비</h2>
      <div className="grid grid-cols-2 gap-3">
        {myEquipment.length === 0 && (
          <p className="col-span-2 py-6 text-center text-[12.5px] text-text-secondary">
            등록한 장비가 없습니다.
          </p>
        )}
        {myEquipment.map((item) => (
          <Link
            key={item.id}
            href={`/equipment/${item.id}`}
            className="flex items-center gap-2.5 rounded-md border border-border p-3"
          >
            <div className="h-11 w-11 shrink-0">
              <ImagePlaceholder rounded="rounded-sm" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-ink">{item.name}</div>
              <div className="mt-0.5 text-[12px] text-text-secondary">
                {formatDailyPrice(item.pricePerDay)}
              </div>
            </div>
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
