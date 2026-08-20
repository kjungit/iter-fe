"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CategoryChips } from "@/components/equipment/CategoryChips";
import { EquipmentGrid } from "@/components/equipment/EquipmentGrid";
import { fetchEquipmentList, type EquipmentCategory } from "@/lib/api/equipment";
import { useAppData } from "@/lib/store/app-data-context";

const ALL = "전체";

export function HomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rentals } = useAppData();

  const category = (searchParams.get("category") as EquipmentCategory | null) ?? ALL;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["equipment", "list", category],
    queryFn: () => fetchEquipmentList(category === ALL ? {} : { category }),
  });

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

      <CategoryChips value={category} onChange={handleCategoryChange} />

      {isLoading && (
        <p className="py-16 text-center text-[12.5px] text-text-secondary">불러오는 중...</p>
      )}
      {isError && (
        <p className="py-16 text-center text-[12.5px] text-badge-danger-fg">
          장비 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}
      {data && <EquipmentGrid equipment={data.content} rentals={rentals} />}
    </div>
  );
}
