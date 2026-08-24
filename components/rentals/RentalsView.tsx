"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RentalListItem } from "@/components/rentals/RentalListItem";
import { Chip } from "@/components/ui/Chip";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Pager } from "@/components/ui/Pager";
import { Tabs } from "@/components/ui/Tabs";
import {
  RENTAL_STATUSES,
  fetchBorrowedOverdueRentals,
  fetchBorrowedRentals,
  fetchLentOverdueRentals,
  fetchLentRentals,
  fetchReturnTargets,
  type RentalStatus,
} from "@/lib/api/rentals";
import { rentalStatusBadge } from "@/lib/status";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

type RentalTab = "borrowed" | "lent";
const PAGE_SIZE = 10;

export function RentalsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useRequireAuth();

  const tab: RentalTab = searchParams.get("tab") === "lent" ? "lent" : "borrowed";
  const overdueOnly = searchParams.get("overdue") === "1";
  const status = (searchParams.get("status") as RentalStatus | null) ?? undefined;
  const equipmentName = searchParams.get("equipmentName") ?? undefined;
  const page = Number(searchParams.get("page") ?? "0");

  const { data: list, isLoading } = useQuery({
    queryKey: ["rentals", tab, { overdueOnly, status, equipmentName, page }],
    queryFn: () => {
      if (overdueOnly) {
        const fn = tab === "borrowed" ? fetchBorrowedOverdueRentals : fetchLentOverdueRentals;
        return fn({ page, size: PAGE_SIZE });
      }
      const fn = tab === "borrowed" ? fetchBorrowedRentals : fetchLentRentals;
      return fn({ status, equipmentName, page, size: PAGE_SIZE });
    },
    enabled: !!currentUser,
  });
  const { data: overdueCount } = useQuery({
    queryKey: ["rentals", tab, "overdue-count"],
    queryFn: () =>
      (tab === "borrowed" ? fetchBorrowedOverdueRentals : fetchLentOverdueRentals)({ page: 0, size: 1 }),
    enabled: !!currentUser,
  });
  const { data: returnTargets } = useQuery({
    queryKey: ["rentals", "returns", "count"],
    queryFn: () => fetchReturnTargets({ page: 0, size: 1 }),
    enabled: !!currentUser && tab === "lent",
  });

  if (!currentUser) return null;

  const updateParams = (next: Record<string, string | null>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.delete("page");
    const query = params.toString();
    router.push(query ? `/rentals?${query}` : "/rentals");
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 pt-7 pb-24">
      <h1 className="mb-5 text-[20px] font-extrabold text-ink">대여 내역</h1>

      <Tabs
        className="mb-5"
        value={tab}
        onChange={(value) => updateParams({ tab: value === "borrowed" ? null : value })}
        items={[
          { value: "borrowed", label: "빌린 장비" },
          { value: "lent", label: "빌려준 장비" },
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Chip size="sm" selected={!overdueOnly} onClick={() => updateParams({ overdue: null })}>
            전체
          </Chip>
          <Chip size="sm" selected={overdueOnly} onClick={() => updateParams({ overdue: "1" })}>
            연체 {overdueCount?.totalElements ?? 0}건
          </Chip>
        </div>
        {tab === "lent" && (returnTargets?.totalElements ?? 0) > 0 && (
          <Link href="/rentals/returns" className="text-[12.5px] font-bold text-ink-strong">
            반납 확인 대상 {returnTargets?.totalElements}건 →
          </Link>
        )}
      </div>

      {!overdueOnly && (
        <div className="mb-4 flex gap-2.5">
          <Input
            className="flex-1"
            placeholder="장비명 검색"
            defaultValue={equipmentName ?? ""}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                updateParams({ equipmentName: (event.target as HTMLInputElement).value.trim() || null });
              }
            }}
          />
          <FilterSelect
            className="w-[160px] shrink-0"
            value={status ?? ""}
            options={[
              { value: "", label: "전체 상태" },
              ...RENTAL_STATUSES.map((option) => ({ value: option, label: rentalStatusBadge(option).label })),
            ]}
            onChange={(next) => updateParams({ status: next || null })}
          />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {isLoading && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
        )}
        {!isLoading && list?.content.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">대여 내역이 없습니다.</p>
        )}
        {list?.content.map((item) => (
          <RentalListItem key={item.rentalId} item={item} perspective={tab} />
        ))}
      </div>

      {list && (
        <Pager
          page={page}
          totalPages={list.totalPages}
          onChange={(nextPage) => updateParams({ page: String(nextPage) }, false)}
        />
      )}
    </div>
  );
}
