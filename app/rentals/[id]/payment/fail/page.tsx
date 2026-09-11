import { PaymentFailView } from "@/components/rentals/PaymentFailView";

export default async function RentalPaymentFailPage(props: PageProps<"/rentals/[id]/payment/fail">) {
  const { id } = await props.params;
  return <PaymentFailView rentalId={id} />;
}
