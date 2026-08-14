import { Suspense } from "react";
import { RentalsView } from "@/components/rentals/RentalsView";

export default function RentalsPage() {
  return (
    <Suspense>
      <RentalsView />
    </Suspense>
  );
}
