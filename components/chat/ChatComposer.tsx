"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface ChatComposerProps {
  disabled: boolean;
  disabledReason?: string;
  /** 소켓이 연결되지 않아 실제로 전송하지 못했으면 false를 반환한다. */
  onSend: (content: string) => boolean;
}

/** Enter로 전송, Shift+Enter는 줄바꿈 — 컴포넌트 밖으로 빼서 DOM 없이 단위 테스트한다. */
export function isSendKeyPress(event: { key: string; shiftKey: boolean }): boolean {
  return event.key === "Enter" && !event.shiftKey;
}

/** 비활성 상태이거나 공백만 입력했으면 전송하지 않는다. */
export function canSendChatMessage(value: string, disabled: boolean): boolean {
  return !disabled && value.trim().length > 0;
}

export function ChatComposer({ disabled, disabledReason, onSend }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [sendFailed, setSendFailed] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const submit = () => {
    if (!canSendChatMessage(value, disabled)) return;
    const sent = onSend(value.trim());
    if (sent) {
      setValue("");
      setSendFailed(false);
    } else {
      setSendFailed(true);
    }
  };

  return (
    <div className="border-t border-border pt-3">
      {disabled && disabledReason && (
        <p className="mb-2 text-[12px] text-badge-danger-fg">{disabledReason}</p>
      )}
      {!disabled && sendFailed && (
        <p className="mb-2 text-[12px] text-badge-danger-fg">
          연결이 끊어져 메시지를 보내지 못했어요. 잠시 후 다시 시도해주세요.
        </p>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          disabled={disabled}
          minHeight={44}
          className="flex-1"
          placeholder={disabled ? "" : "메시지를 입력하세요"}
          onChange={(event) => {
            setValue(event.target.value);
            if (sendFailed) setSendFailed(false);
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(event) => {
            // 한글 등 조합 입력 중 Enter는 IME가 글자를 확정하는 키다 — 전송으로 처리하면
            // 조합 중이던 마지막 글자가 두 번 들어간다(Safari는 compositionend가 이
            // keydown보다 먼저 발생해 nativeEvent.isComposing이 이미 false일 수 있어서
            // 우리가 직접 추적하는 isComposing 상태도 같이 확인해야 한다).
            if (isComposing || event.nativeEvent.isComposing) return;
            if (isSendKeyPress(event)) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={disabled || !value.trim()}
          onClick={submit}
        >
          전송
        </Button>
      </div>
    </div>
  );
}
