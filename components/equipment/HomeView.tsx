"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CategoryChips } from "@/components/equipment/CategoryChips";
import { EquipmentGrid } from "@/components/equipment/EquipmentGrid";
import { useAppData } from "@/lib/store/app-data-context";
import type { EquipmentCategory } from "@/lib/types";

const ALL = "전체";

export function HomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { equipment, rentals } = useAppData();

  const category = (searchParams.get("category") as EquipmentCategory | null) ?? ALL;

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

  const filteredEquipment =
    category === ALL ? equipment : equipment.filter((item) => item.category === category);

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

      <EquipmentGrid equipment={filteredEquipment} rentals={rentals} />
    </div>
  );
}
