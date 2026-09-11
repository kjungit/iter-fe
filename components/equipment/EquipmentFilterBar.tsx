"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { EquipmentSearchParams } from "@/lib/api/equipment";

type SortOption = NonNullable<EquipmentSearchParams["sort"]>;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "LATEST", label: "최신순" },
  { value: "PRICE_ASC", label: "가격 낮은순" },
  { value: "PRICE_DESC", label: "가격 높은순" },
  { value: "RATING_DESC", label: "평점순" },
];

export function EquipmentFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [panelOpen, setPanelOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") ?? "");

  const sort = (searchParams.get("sort") as SortOption | null) ?? "LATEST";
  const dateRangeIncomplete = (!!startDate && !endDate) || (!startDate && !!endDate);
  const activeFilterCount = [
    searchParams.get("minPrice"),
    searchParams.get("maxPrice"),
    searchParams.get("startDate") && searchParams.get("endDate") ? "date" : null,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!panelOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setPanelOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  const updateParams = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  const applyKeyword = () => updateParams({ keyword: keyword.trim() || null });

  const applyPanel = () => {
    if (dateRangeIncomplete) return;
    updateParams({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    setPanelOpen(false);
  };

  const resetPanel = () => {
    setMinPrice("");
    setMaxPrice("");
    setStartDate("");
    setEndDate("");
    updateParams({ minPrice: null, maxPrice: null, startDate: null, endDate: null });
    setPanelOpen(false);
  };

  return (
    <div className="mb-6 flex items-center gap-2">
      <div className="relative flex-1">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-tertiary"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <Input
          style={{ paddingLeft: "2.25rem" }}
          placeholder="장비명으로 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && applyKeyword()}
        />
      </div>

      <div className="relative" ref={panelRef}>
        <button
          type="button"
          onClick={() => setPanelOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-1 rounded-pill border px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
            activeFilterCount > 0
              ? "border-ink-strong bg-ink-strong text-white"
              : "border-border-input bg-white text-text-body-3",
          )}
        >
          필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
        </button>

        {panelOpen && (
          <div className="shadow-popover absolute top-[calc(100%+8px)] right-0 z-20 w-[300px] rounded-lg border border-border bg-white p-4">
            <div className="text-[12px] font-bold text-text-secondary">가격</div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="number"
                placeholder="최소"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
              <span className="text-[12px] text-text-tertiary">~</span>
              <Input
                type="number"
                placeholder="최대"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>

            <div className="mt-4 text-[12px] font-bold text-text-secondary">대여 가능 기간</div>
            <div className="mt-2 flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <span className="text-[12px] text-text-tertiary">~</span>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            {dateRangeIncomplete && (
              <p className="mt-1.5 text-[11px] text-badge-danger-fg">
                시작일과 종료일을 모두 선택해야 적용됩니다.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={resetPanel}>
                초기화
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={applyPanel}>
                적용
              </Button>
            </div>
          </div>
        )}
      </div>

      <FilterSelect
        className="w-[130px] shrink-0"
        value={sort}
        options={SORT_OPTIONS}
        onChange={(next) => updateParams({ sort: next === "LATEST" ? null : next })}
      />
    </div>
  );
}
