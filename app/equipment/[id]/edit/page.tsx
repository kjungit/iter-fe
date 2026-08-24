import { EquipmentEditForm } from "@/components/equipment/EquipmentEditForm";

export default async function EquipmentEditPage(props: PageProps<"/equipment/[id]/edit">) {
  const { id } = await props.params;
  return <EquipmentEditForm equipmentId={id} />;
}
