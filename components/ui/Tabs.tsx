import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit gap-1.5 rounded-md bg-surface-track p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-sm px-5 py-[9px] text-[13.5px] font-bold transition-colors",
              active ? "bg-white text-ink-strong" : "bg-transparent text-text-secondary",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
