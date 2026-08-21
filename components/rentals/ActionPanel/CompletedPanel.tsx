import { LinkButton } from "@/components/ui/Button";
import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import type { RentalDetail } from "@/lib/api/rentals";

export function CompletedPanel({ rental }: { rental: RentalDetail }) {
  return (
    <PanelShell>
      <div className="text-center">
        <h2 className="text-[14px] font-bold text-ink">거래가 완료되었습니다</h2>
        <p className="mt-2 text-[12.5px] text-text-secondary">
          경험은 어떠셨나요? 리뷰를 남겨 다른 사용자에게 도움을 주세요.
        </p>
        <LinkButton
          href={`/rentals/${rental.rentalId}/review`}
          variant="primary"
          size="sm"
          className="mt-4"
        >
          리뷰 작성하기
        </LinkButton>
      </div>
    </PanelShell>
  );
}
