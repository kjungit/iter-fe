import { ReportForm } from "@/components/reports/ReportForm";

export default async function EquipmentReportPage(props: PageProps<"/equipment/[id]/report">) {
  const { id } = await props.params;
  return <ReportForm target={{ type: "EQUIPMENT", equipmentId: id }} />;
}
