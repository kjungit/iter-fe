"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RentalListItem } from "@/components/rentals/RentalListItem";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { fetchBorrowedRentals, fetchLentRentals, fetchReturnTargets } from "@/lib/api/rentals";
import { useRequireAuth } from "@/lib/auth/use-require-auth";

type RentalTab = "borrowed" | "lent";

export function RentalsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useRequireAuth();

  const tab: RentalTab = searchParams.get("tab") === "lent" ? "lent" : "borrowed";
  const overdueOnly = searchParams.get("overdue") === "1";

  const { data: all } = useQuery({
    queryKey: ["rentals", tab, "all"],
    queryFn: () => (tab === "borrowed" ? fetchBorrowedRentals() : fetchLentRentals()),
    enabled: !!currentUser,
  });
  const { data: overdue } = useQuery({
    queryKey: ["rentals", tab, "overdue"],
    queryFn: () => (tab === "borrowed" ? fetchBorrowedRentals(true) : fetchLentRentals(true)),
    enabled: !!currentUser,
  });
  const { data: returnTargets } = useQuery({
    queryKey: ["rentals", "returns"],
    queryFn: fetchReturnTargets,
    enabled: !!currentUser && tab === "lent",
  });

  if (!currentUser) return null;

  const updateParams = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `/rentals?${query}` : "/rentals");
  };

  const visible = overdueOnly ? (overdue ?? []) : (all ?? []);
  const isLoading = overdueOnly ? overdue === undefined : all === undefined;

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
            연체 {overdue?.length ?? 0}건
          </Chip>
        </div>
        {tab === "lent" && (returnTargets?.length ?? 0) > 0 && (
          <Link href="/rentals/returns" className="text-[12.5px] font-bold text-ink-strong">
            반납 확인 대상 {returnTargets?.length}건 →
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {isLoading && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
        )}
        {!isLoading && visible.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-text-secondary">대여 내역이 없습니다.</p>
        )}
        {visible.map((item) => (
          <RentalListItem key={item.rentalId} item={item} perspective={tab} />
        ))}
      </div>
    </div>
  );
}
