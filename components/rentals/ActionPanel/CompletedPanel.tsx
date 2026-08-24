import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";
import type { RentalDetail } from "@/lib/api/rentals";

/** rental은 ActionPanel의 상태별 패널 스위치 시그니처를 맞추기 위해 받지만 이 패널은 쓰지 않는다. */
export function CompletedPanel(_props: { rental: RentalDetail }) {
  return (
    <PanelShell>
      <div className="text-center">
        <h2 className="text-[14px] font-bold text-ink">거래가 완료되었습니다</h2>
        <p className="mt-2 text-[12.5px] text-text-secondary">
          수령·반납 시점 기록은 언제든 이 화면에서 다시 확인할 수 있어요.
        </p>
      </div>
    </PanelShell>
  );
}
