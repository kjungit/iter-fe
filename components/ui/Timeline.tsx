import { cn } from "@/lib/cn";

export interface TimelineStep {
  label: string;
  state: "reached" | "unreached";
  /** Vertical orientation only: timestamp text or a waiting label like "대기 중". */
  caption?: string;
  /** Horizontal orientation only: connector line leading into this step. */
  connector?: "transparent" | "reached" | "unreached";
}

interface TimelineProps {
  steps: TimelineStep[];
  orientation?: "horizontal" | "vertical";
  dotSize?: "sm" | "md";
}

const CONNECTOR_CLASSES: Record<NonNullable<TimelineStep["connector"]>, string> = {
  transparent: "bg-transparent",
  reached: "bg-ink-strong",
  unreached: "bg-[#E5E5E5]",
};

export function Timeline({ steps, orientation = "horizontal", dotSize = "md" }: TimelineProps) {
  if (orientation === "vertical") {
    return (
      <div className="flex flex-col gap-3.5">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3">
            <span
              className={cn(
                "mt-1 shrink-0 rounded-full",
                dotSize === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
                step.state === "reached" ? "bg-ink-strong" : "bg-border-input",
              )}
            />
            <div>
              <div className="text-[13px] font-bold text-ink">{step.label}</div>
              {step.caption && (
                <div className="mt-0.5 text-[12px] text-[#9A9A9A]">{step.caption}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex px-1">
      {steps.map((step, index) => (
        <div key={index} className="relative flex flex-1 flex-col items-center">
          <span
            className={cn(
              "absolute top-[7px] left-[-50%] z-0 h-0.5 w-full",
              CONNECTOR_CLASSES[step.connector ?? "unreached"],
            )}
          />
          <span
            className={cn(
              "relative z-10 h-4 w-4 rounded-full border-2 border-white",
              step.state === "reached" ? "bg-ink-strong" : "bg-border-input",
            )}
          />
          <span
            className={cn(
              "mt-2 text-center text-[11px] font-bold",
              step.state === "reached" ? "text-ink-strong" : "text-text-tertiary",
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
