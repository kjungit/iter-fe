import { Timeline } from "@/components/ui/Timeline";
import { RENTAL_TIMELINE_LABELS, timelineConnectorState, timelineDotState } from "@/lib/status";
import type { RentalStatus } from "@/lib/api/rentals";

export function RentalTimeline({ status }: { status: RentalStatus }) {
  const steps = RENTAL_TIMELINE_LABELS.map((label, index) => ({
    label,
    state: timelineDotState(status, index),
    connector: timelineConnectorState(status, index),
  }));

  return <Timeline steps={steps} orientation="horizontal" />;
}
