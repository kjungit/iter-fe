import { describe, expect, it } from "vitest";
import {
  rentalRole,
  rentalTimelineStage,
  timelineConnectorState,
  timelineDotState,
} from "@/lib/status";

describe("rentalTimelineStage", () => {
  it("maps each status to the correct reached stage", () => {
    expect(rentalTimelineStage("PENDING")).toBe(0);
    expect(rentalTimelineStage("REQUESTED")).toBe(1);
    expect(rentalTimelineStage("APPROVED")).toBe(2);
    expect(rentalTimelineStage("SHIPPING")).toBe(3);
    expect(rentalTimelineStage("RENTING")).toBe(4);
    expect(rentalTimelineStage("RETURN_REQUESTED")).toBe(5);
    expect(rentalTimelineStage("RETURNING")).toBe(5);
    expect(rentalTimelineStage("RETURNED")).toBe(6);
    expect(rentalTimelineStage("COMPLETED")).toBe(7);
    expect(rentalTimelineStage("REJECTED")).toBe(-1);
    expect(rentalTimelineStage("CANCELED")).toBe(-1);
    expect(rentalTimelineStage("DISPUTED")).toBe(-1);
  });
});

describe("timelineDotState / timelineConnectorState", () => {
  it("marks steps up to the current stage as reached", () => {
    expect(timelineDotState("SHIPPING", 0)).toBe("reached");
    expect(timelineDotState("SHIPPING", 3)).toBe("reached");
    expect(timelineDotState("SHIPPING", 4)).toBe("unreached");
  });

  it("marks every step unreached for REJECTED", () => {
    for (let i = 0; i < 8; i++) {
      expect(timelineDotState("REJECTED", i)).toBe("unreached");
    }
  });

  it("makes the first connector transparent regardless of status", () => {
    expect(timelineConnectorState("PENDING", 0)).toBe("transparent");
    expect(timelineConnectorState("REJECTED", 0)).toBe("transparent");
  });
});

describe("rentalRole", () => {
  const rental = { owner: { id: "u1" }, renter: { id: "u2" } };

  it("returns owner when the user id matches the owner", () => {
    expect(rentalRole(rental, "u1")).toBe("owner");
  });

  it("returns borrower when the user id matches the renter", () => {
    expect(rentalRole(rental, "u2")).toBe("borrower");
  });

  it("returns null when the user is neither party", () => {
    expect(rentalRole(rental, "u3")).toBeNull();
  });
});
