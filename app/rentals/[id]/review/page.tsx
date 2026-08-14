import { ReviewForm } from "@/components/rentals/ReviewForm";

export default async function ReviewPage(props: PageProps<"/rentals/[id]/review">) {
  const { id } = await props.params;
  return <ReviewForm rentalId={id} />;
}
