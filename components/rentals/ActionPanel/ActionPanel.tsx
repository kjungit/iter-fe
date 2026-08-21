"use client";

import { BorrowerPendingPanel } from "@/components/rentals/ActionPanel/BorrowerPendingPanel";
import { BorrowerRentingPanel } from "@/components/rentals/ActionPanel/BorrowerRentingPanel";
import { BorrowerRequestedPanel } from "@/components/rentals/ActionPanel/BorrowerRequestedPanel";
import { BorrowerReturnUploadPanel } from "@/components/rentals/ActionPanel/BorrowerReturnUploadPanel";
import { BorrowerShippingPanel } from "@/components/rentals/ActionPanel/BorrowerShippingPanel";
import { CompletedPanel } from "@/components/rentals/ActionPanel/CompletedPanel";
import { OwnerApprovedPanel } from "@/components/rentals/ActionPanel/OwnerApprovedPanel";
import { OwnerPendingPanel } from "@/components/rentals/ActionPanel/OwnerPendingPanel";
import { OwnerReturnConfirmPanel } from "@/components/rentals/ActionPanel/OwnerReturnConfirmPanel";
import { WaitingPanel } from "@/components/rentals/ActionPanel/WaitingPanel";
import { rentalRole } from "@/lib/status";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import type { RentalDetail } from "@/lib/api/rentals";

/** Exactly one panel is shown at a time — driven by (role, status). */
export function ActionPanel({ rental }: { rental: RentalDetail }) {
  const currentUser = useRequireAuth();
  if (!currentUser) return null;
  const role = rentalRole(rental, currentUser.id);

  if (rental.status === "COMPLETED") return <CompletedPanel rental={rental} />;

  if (rental.status === "DISPUTED") {
    return (
      <WaitingPanel
        title="분쟁 처리 중"
        description="반납 과정에서 이상이 발견되어 분쟁으로 접수되었습니다. 운영팀이 검토 후 안내드립니다."
      />
    );
  }

  if (role === "borrower") {
    switch (rental.status) {
      case "PENDING":
        return <BorrowerPendingPanel rental={rental} />;
      case "REQUESTED":
        return <BorrowerRequestedPanel rental={rental} />;
      case "APPROVED":
        return (
          <WaitingPanel
            title="승인 완료"
            description="등록자가 요청을 승인했습니다. 배송을 준비 중이니 잠시만 기다려 주세요."
          />
        );
      case "SHIPPING":
        return <BorrowerShippingPanel rental={rental} />;
      case "RENTING":
        return <BorrowerRentingPanel rental={rental} />;
      case "RETURN_REQUESTED":
      case "RETURNING":
        return <BorrowerReturnUploadPanel rental={rental} />;
      case "RETURNED":
        return (
          <WaitingPanel
            title="반납 확인 대기 중"
            description="등록자가 반납 상태를 확인하고 있습니다. 최종 확인이 완료되면 거래가 종료돼요."
          />
        );
      default:
        return null;
    }
  }

  if (role === "owner") {
    switch (rental.status) {
      case "REQUESTED":
        return <OwnerPendingPanel rental={rental} />;
      case "APPROVED":
        return <OwnerApprovedPanel rental={rental} />;
      case "SHIPPING":
        return (
          <WaitingPanel
            title="배송 중"
            description="대여자의 수령 확인을 기다리는 중입니다."
          />
        );
      case "RENTING":
        return (
          <WaitingPanel title="대여 중" description="대여자가 장비를 사용 중입니다." />
        );
      case "RETURN_REQUESTED":
      case "RETURNING":
        return (
          <WaitingPanel
            title="반납 신청됨"
            description="대여자가 반납 증빙을 제출하면 최종 확인할 수 있습니다."
          />
        );
      case "RETURNED":
        return <OwnerReturnConfirmPanel rental={rental} />;
      default:
        return null;
    }
  }

  return null;
}
