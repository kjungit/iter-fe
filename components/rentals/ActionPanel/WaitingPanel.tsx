import { PanelShell } from "@/components/rentals/ActionPanel/PanelShell";

/** 내가 취할 액션은 없고 상대방/시스템의 다음 처리를 기다리는 상태에서 공용으로 쓰는 안내 패널. */
export function WaitingPanel({ title, description }: { title: string; description: string }) {
  return (
    <PanelShell>
      <h2 className="text-[14px] font-bold text-ink">{title}</h2>
      <p className="mt-2 text-[12.5px] text-text-secondary">{description}</p>
    </PanelShell>
  );
}
