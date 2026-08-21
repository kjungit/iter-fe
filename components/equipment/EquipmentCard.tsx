import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatDailyPrice } from "@/lib/format";
import { EQUIPMENT_CATEGORY_LABELS, type EquipmentSummary } from "@/lib/api/equipment";

interface EquipmentCardProps {
  equipment: EquipmentSummary;
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  return (
    <Link href={`/equipment/${equipment.id}`} className="block">
      <ImagePlaceholder rounded="rounded-lg" src={equipment.thumbnailUrl} alt={equipment.name} />
      <div className="mt-2.5 text-[12px] font-medium text-text-secondary">
        {EQUIPMENT_CATEGORY_LABELS[equipment.category]}
      </div>
      <div className="mt-0.5 text-[14px] leading-[1.3] font-bold text-ink">{equipment.name}</div>
      <div className="mt-1.5 text-[14px] font-extrabold text-ink">
        {formatDailyPrice(equipment.dailyPrice)}
      </div>
    </Link>
  );
}
