import { RentalDetailView } from "@/components/rentals/RentalDetailView";

export default async function RentalDetailPage(props: PageProps<"/rentals/[id]">) {
  const { id } = await props.params;
  return <RentalDetailView rentalId={id} />;
}
