"use client";

import { BorrowerRentingPanel } from "@/components/rentals/ActionPanel/BorrowerRentingPanel";
import { BorrowerReturnUploadPanel } from "@/components/rentals/ActionPanel/BorrowerReturnUploadPanel";
import { BorrowerShippingPanel } from "@/components/rentals/ActionPanel/BorrowerShippingPanel";
import { CompletedPanel } from "@/components/rentals/ActionPanel/CompletedPanel";
import { OwnerPaidPanel } from "@/components/rentals/ActionPanel/OwnerPaidPanel";
import { OwnerPendingPanel } from "@/components/rentals/ActionPanel/OwnerPendingPanel";
import { OwnerReturnRequestedPanel } from "@/components/rentals/ActionPanel/OwnerReturnRequestedPanel";
import { rentalRole } from "@/lib/status";
import { useMockData } from "@/lib/store/mock-data-context";
import type { Rental } from "@/lib/types";

/** Exactly one panel is shown at a time — driven by (role, status), per the handoff's action-panel table. */
export function ActionPanel({ rental }: { rental: Rental }) {
  const { currentUser } = useMockData();
  const role = rentalRole(rental, currentUser.id);

  if (rental.status === "COMPLETED") return <CompletedPanel rental={rental} />;
  if (role === "owner" && rental.status === "PENDING") return <OwnerPendingPanel rental={rental} />;
  if (role === "owner" && rental.status === "PAID") return <OwnerPaidPanel rental={rental} />;
  if (role === "borrower" && rental.status === "SHIPPING")
    return <BorrowerShippingPanel rental={rental} />;
  if (role === "borrower" && rental.status === "RENTING")
    return <BorrowerRentingPanel rental={rental} />;
  if (role === "borrower" && rental.status === "RETURN_UPLOAD")
    return <BorrowerReturnUploadPanel rental={rental} />;
  if (role === "owner" && rental.status === "RETURN_REQUESTED")
    return <OwnerReturnRequestedPanel rental={rental} />;

  return null;
}
