import { EquipmentCard } from "@/components/equipment/EquipmentCard";
import type { EquipmentSummary } from "@/lib/api/equipment";
import { isEquipmentRented } from "@/lib/mock-data";
import type { Rental } from "@/lib/types";

interface EquipmentGridProps {
  equipment: EquipmentSummary[];
  rentals: Rental[];
}

export function EquipmentGrid({ equipment, rentals }: EquipmentGridProps) {
  if (equipment.length === 0) {
    return (
      <p className="py-16 text-center text-[12.5px] text-text-secondary">
        조건에 맞는 장비가 없습니다.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-x-4 gap-y-5">
      {equipment.map((item) => (
        <EquipmentCard key={item.id} equipment={item} rented={isEquipmentRented(item.id, rentals)} />
      ))}
    </div>
  );
}
