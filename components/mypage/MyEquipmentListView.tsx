"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Pager } from "@/components/ui/Pager";
import { MyEquipmentCard } from "@/components/mypage/MyEquipmentCard";
import { EQUIPMENT_STATUSES, fetchMyEquipment, type EquipmentStatus } from "@/lib/api/equipment";
import { equipmentStatusBadge } from "@/lib/status";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

const PAGE_SIZE = 20;

const SORT_OPTIONS: { value: "LATEST" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC"; label: string }[] = [
  { value: "LATEST", label: "최신순" },
  { value: "PRICE_ASC", label: "가격 낮은순" },
  { value: "PRICE_DESC", label: "가격 높은순" },
  { value: "RATING_DESC", label: "평점순" },
];

export function MyEquipmentListView() {
  const currentUser = useRequireAuth();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<EquipmentStatus | "">("");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("LATEST");

  const { data, isLoading } = useQuery({
    queryKey: ["equipment", "mine", { page, size: PAGE_SIZE, status, sort }],
    queryFn: () => fetchMyEquipment({ status: status || undefined, sort, page, size: PAGE_SIZE }),
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pt-7 pb-24">
      <Link href="/mypage" className="text-[13px] font-semibold text-text-secondary">
        ← 마이페이지
      </Link>
      <div className="mt-2 mb-5 flex items-center justify-between">
        <h1 className="text-[20px] font-extrabold text-ink">내가 등록한 장비</h1>
        <Link href="/equipment/new" className="text-[12px] font-semibold text-text-secondary">
          + 새 장비 등록
        </Link>
      </div>

      <div className="mb-4 flex gap-2.5">
        <FilterSelect
          className="w-[140px] shrink-0"
          value={status}
          options={[
            { value: "", label: "전체 상태" },
            ...EQUIPMENT_STATUSES.map((option) => ({ value: option, label: equipmentStatusBadge(option).label })),
          ]}
          onChange={(next) => {
            setPage(0);
            setStatus(next);
          }}
        />
        <FilterSelect
          className="w-[140px] shrink-0"
          value={sort}
          options={SORT_OPTIONS}
          onChange={(next) => {
            setPage(0);
            setSort(next);
          }}
        />
      </div>

      {isLoading && (
        <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
      )}
      {!isLoading && data?.content.length === 0 && (
        <p className="py-16 text-center text-[12.5px] text-text-secondary">
          등록한 장비가 없습니다.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {data?.content.map((item) => <MyEquipmentCard key={item.id} item={item} />)}
      </div>

      {data && <Pager page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
