import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger-outline" | "kakao";
type Size = "lg" | "md" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ink-strong text-white border border-ink-strong",
  secondary: "bg-white text-text-body-3 border border-border-input",
  "danger-outline": "bg-white text-[#C0392B] border border-[#F0D0CD]",
  kakao: "bg-kakao text-kakao-fg border border-kakao",
};

const SIZE_CLASSES: Record<Size, string> = {
  lg: "px-4 py-4 text-[15px] font-bold rounded-md",
  md: "px-4 py-[13px] text-[14px] font-bold rounded-sm",
  sm: "px-4 py-[10px] text-[12.5px] font-bold rounded-sm",
};

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

/** Same visual presets as Button, for when the action navigates instead of submitting. */
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center transition-colors",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Shows a spinner and disables the button — for when a real, async API replaces the mock store. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
