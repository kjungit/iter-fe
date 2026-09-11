import { ReportDetailView } from "@/components/reports/ReportDetailView";

export default async function ReportDetailPage(props: PageProps<"/reports/[id]">) {
  const { id } = await props.params;
  return <ReportDetailView reportId={id} />;
}
