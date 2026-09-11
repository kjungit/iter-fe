"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CategoryChips } from "@/components/equipment/CategoryChips";
import { EquipmentFilterBar } from "@/components/equipment/EquipmentFilterBar";
import { EquipmentGrid } from "@/components/equipment/EquipmentGrid";
import { fetchEquipmentList, type EquipmentCategory, type EquipmentSearchParams } from "@/lib/api/equipment";

const ALL = "전체";
const PAGE_SIZE = 20;

export function HomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = (searchParams.get("category") as EquipmentCategory | null) ?? ALL;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const filters: Omit<EquipmentSearchParams, "page" | "size"> = {
    category: category === ALL ? undefined : category,
    keyword: searchParams.get("keyword") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    // 시작/종료일은 둘 다 있을 때만 보낸다 — 하나만 있으면 BE 검증(둘 다 필수)에서 400이 난다.
    startDate: startDate && endDate ? startDate : undefined,
    endDate: startDate && endDate ? endDate : undefined,
    sort: (searchParams.get("sort") as EquipmentSearchParams["sort"] | null) ?? undefined,
  };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["equipment", "list", filters],
    queryFn: ({ pageParam }) => fetchEquipmentList({ ...filters, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCategoryChange = (next: EquipmentCategory | typeof ALL) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === ALL) {
      params.delete("category");
    } else {
      params.set("category", next);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  const items = data?.pages.flatMap((page) => page.content) ?? [];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 pt-8 pb-20">
      <section className="mb-8 rounded-2xl bg-ink-strong p-10 text-white">
        <div className="text-[13px] font-semibold text-[#B8B8B8]">P2P 장비 대여 플랫폼</div>
        <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.02em]">
          필요한 장비를 이웃에게 빌려보세요
        </h1>
        <p className="mt-2 text-[14px] text-[#C6C6C6]">
          카메라, 노트북, VR기기, 프로젝터, 게임기, 렌즈까지 — 필요한 순간에만 합리적으로.
        </p>
      </section>

      <EquipmentFilterBar />
      <CategoryChips value={category} onChange={handleCategoryChange} />

      {isLoading && (
        <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
      )}
      {isError && (
        <p className="py-16 text-center text-[12.5px] text-badge-danger-fg">
          장비 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}
      {data && <EquipmentGrid equipment={items} />}

      <div ref={sentinelRef} aria-hidden className="h-1" />
      {isFetchingNextPage && (
        <p className="py-6 text-center text-[12px] text-text-secondary">더 불러오는 중...</p>
      )}
      {data && !hasNextPage && items.length > 0 && (
        <p className="py-6 text-center text-[12px] text-text-tertiary">모든 장비를 확인했어요.</p>
      )}
    </div>
  );
}
