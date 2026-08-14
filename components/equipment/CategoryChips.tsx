"use client";

import { Chip } from "@/components/ui/Chip";
import { EQUIPMENT_CATEGORIES } from "@/lib/mock-data";
import type { EquipmentCategory } from "@/lib/types";

const ALL = "전체";

interface CategoryChipsProps {
  value: EquipmentCategory | typeof ALL;
  onChange: (value: EquipmentCategory | typeof ALL) => void;
}

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <div className="mb-7 flex gap-2.5 overflow-x-auto">
      <Chip selected={value === ALL} onClick={() => onChange(ALL)}>
        {ALL}
      </Chip>
      {EQUIPMENT_CATEGORIES.map((category) => (
        <Chip key={category} selected={value === category} onClick={() => onChange(category)}>
          {category}
        </Chip>
      ))}
    </div>
  );
}
