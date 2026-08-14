import { RequestForm } from "@/components/rentals/RequestForm";

export default async function RentalRequestPage(props: PageProps<"/equipment/[id]/request">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const start = typeof searchParams.start === "string" ? searchParams.start : null;
  const end = typeof searchParams.end === "string" ? searchParams.end : null;

  return <RequestForm equipmentId={id} start={start} end={end} />;
}
