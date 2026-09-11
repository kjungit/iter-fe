import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-sm border border-border-input px-3.5 py-3 text-[13.5px] text-ink outline-none focus:border-ink-strong",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
