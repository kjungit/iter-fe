import { PaymentSuccessView } from "@/components/rentals/PaymentSuccessView";

export default async function RentalPaymentSuccessPage(
  props: PageProps<"/rentals/[id]/payment/success">,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const paymentKey = typeof searchParams.paymentKey === "string" ? searchParams.paymentKey : null;
  const orderId = typeof searchParams.orderId === "string" ? searchParams.orderId : null;
  const amount = typeof searchParams.amount === "string" ? searchParams.amount : null;

  return (
    <PaymentSuccessView rentalId={id} paymentKey={paymentKey} orderId={orderId} amount={amount} />
  );
}
