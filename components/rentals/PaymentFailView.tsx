import Link from "next/link";

export function PaymentFailView({ rentalId }: { rentalId: string }) {
  return (
    <div className="mx-auto max-w-[480px] px-6 py-24 text-center">
      <h1 className="text-[16px] font-bold text-ink">결제가 취소되었거나 실패했습니다</h1>
      <p className="mt-2 text-[12.5px] text-text-secondary">
        결제 대기 상태로 남은 요청은 30분 후 자동으로 취소됩니다. 다시 시도할 수 있습니다.
      </p>
      <Link href={`/rentals/${rentalId}`} className="mt-5 inline-block text-[13px] font-semibold text-ink-strong">
        대여 상세로 이동
      </Link>
    </div>
  );
}
