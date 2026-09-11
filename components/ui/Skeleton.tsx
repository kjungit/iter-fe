import { cn } from "@/lib/cn";

/**
 * Loading placeholder for list/detail content. The mock store resolves synchronously today,
 * so nothing renders this yet — kept ready for when screens are wired to a real, async API.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-surface-track", className)} />;
}
