"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface ChatComposerProps {
  disabled: boolean;
  disabledReason?: string;
  onSend: (content: string) => void;
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

  const submit = () => {
    if (!canSendChatMessage(value, disabled)) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="border-t border-border pt-3">
      {disabled && disabledReason && (
        <p className="mb-2 text-[12px] text-badge-danger-fg">{disabledReason}</p>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          disabled={disabled}
          minHeight={44}
          className="flex-1"
          placeholder={disabled ? "" : "메시지를 입력하세요"}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
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
