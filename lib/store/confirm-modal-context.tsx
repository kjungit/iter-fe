"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

type PendingConfirm = (ConfirmOptions & { resolve: (result: boolean) => void }) | null;

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmModalContext = createContext<ConfirmFn | null>(null);

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <ConfirmModalContext.Provider value={confirm}>
      {children}
      {pending && (
        <ConfirmModal
          message={pending.message}
          confirmLabel={pending.confirmLabel ?? "확인"}
          cancelLabel={pending.cancelLabel ?? "취소"}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmModalContext.Provider>
  );
}

/** Promise-based confirm — resolves true/false, never rejects. Guards every destructive action. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmModalContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmModalProvider");
  return ctx;
}
