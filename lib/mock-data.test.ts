import { describe, expect, it } from "vitest";
import { getBookedDates, isEquipmentRented } from "@/lib/mock-data";
import type { Rental } from "@/lib/types";

function rental(overrides: Partial<Rental>): Rental {
  return {
    id: "r-test",
    equipmentId: "eq-test",
    ownerId: "owner",
    ownerName: "Owner",
    borrowerId: "borrower",
    borrowerName: "Borrower",
    status: "PENDING",
    startDate: "2026-08-15",
    endDate: "2026-08-18",
    totalPrice: 1000,
    message: "",
    shippingAddress: {
      recipientName: "",
      phone: "",
      zipcode: "",
      address: "",
      detailAddress: "",
    },
    shipping: null,
    receiptEvidence: null,
    returnEvidence: null,
    createdAt: "2026-08-10",
    ...overrides,
  };
}

describe("getBookedDates", () => {
  it("includes every day in the range, inclusive of both endpoints", () => {
    const dates = getBookedDates("eq-test", [rental({ status: "SHIPPING" })]);
    expect([...dates].sort()).toEqual(["2026-08-15", "2026-08-16", "2026-08-17", "2026-08-18"]);
  });

  it("ignores rentals for other equipment", () => {
    const dates = getBookedDates("eq-test", [rental({ equipmentId: "other" })]);
    expect(dates.size).toBe(0);
  });

  it("ignores terminal rentals (COMPLETED/REJECTED)", () => {
    const dates = getBookedDates("eq-test", [
      rental({ status: "COMPLETED" }),
      rental({ status: "REJECTED" }),
    ]);
    expect(dates.size).toBe(0);
  });
});

describe("isEquipmentRented", () => {
  it("is false while a request is only PENDING", () => {
    expect(isEquipmentRented("eq-test", [rental({ status: "PENDING" })])).toBe(false);
  });

  it("is true once approved/paid or later, before completion", () => {
    expect(isEquipmentRented("eq-test", [rental({ status: "PAID" })])).toBe(true);
    expect(isEquipmentRented("eq-test", [rental({ status: "RENTING" })])).toBe(true);
  });

  it("is false again once completed or rejected", () => {
    expect(isEquipmentRented("eq-test", [rental({ status: "COMPLETED" })])).toBe(false);
    expect(isEquipmentRented("eq-test", [rental({ status: "REJECTED" })])).toBe(false);
  });
});
