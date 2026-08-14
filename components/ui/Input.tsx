import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-sm border border-border-input px-3.5 py-3 text-[13.5px] text-ink outline-none placeholder:text-text-tertiary focus:border-ink-strong",
        className,
      )}
      {...props}
    />
  );
}
