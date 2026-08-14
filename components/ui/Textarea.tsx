import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
}

export function Textarea({ className, minHeight = 80, style, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-sm border border-border-input px-3.5 py-3 text-[13.5px] text-ink outline-none placeholder:text-text-tertiary focus:border-ink-strong",
        className,
      )}
      style={{ minHeight, ...style }}
      {...props}
    />
  );
}
