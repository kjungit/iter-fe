import type { ReactNode } from "react";

export function PanelShell({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-border p-5">{children}</div>;
}
