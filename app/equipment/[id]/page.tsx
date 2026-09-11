import { EquipmentDetailView } from "@/components/equipment/EquipmentDetailView";

export default async function EquipmentDetailPage(props: PageProps<"/equipment/[id]">) {
  const { id } = await props.params;
  return <EquipmentDetailView equipmentId={id} />;
}
