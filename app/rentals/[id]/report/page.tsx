import { ReportForm } from "@/components/reports/ReportForm";

export default async function RentalReportPage(props: PageProps<"/rentals/[id]/report">) {
  const { id } = await props.params;
  return <ReportForm rentalId={id} />;
}
