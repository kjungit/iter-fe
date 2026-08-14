"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { toISODate } from "@/lib/date";
import {
  ADMIN_HISTORY,
  ADMIN_MEMBERS,
  CURRENT_USER_ID,
  DISPUTES,
  EQUIPMENT,
  RENTALS,
  REPORTS,
  USERS,
} from "@/lib/mock-data";
import type {
  AdminHistoryEntry,
  AdminMember,
  Dispute,
  DisputeStatus,
  Equipment,
  EquipmentCondition,
  EquipmentStatus,
  MemberStatus,
  Rental,
  Report,
  ReportStatus,
  ShippingInfo,
  User,
} from "@/lib/types";

export interface Review {
  id: string;
  rentalId: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface Evidence {
  photoUrls: string[];
  condition: EquipmentCondition;
  memo: string;
}

export type AdminEntity = "member" | "equipment" | "report" | "dispute";

type NewRentalRequest = Omit<Rental, "id" | "status" | "createdAt">;
type NewReport = Omit<Report, "id" | "createdAt" | "status" | "progress">;
type NewReview = Omit<Review, "id" | "createdAt">;
type NewEquipment = Omit<Equipment, "id" | "createdAt" | "status" | "ratingAverage" | "reportCount">;
type NewUser = Omit<User, "id">;

interface MockDataState {
  equipment: Equipment[];
  rentals: Rental[];
  reports: Report[];
  disputes: Dispute[];
  adminMembers: AdminMember[];
  adminHistory: AdminHistoryEntry[];
  users: User[];
  reviews: Review[];
  currentUserId: string;
  /** Monotonic counter backing generated ids — avoids impure Date.now()/crypto calls in render paths. */
  sequence: number;
}

const initialState: MockDataState = {
  equipment: EQUIPMENT,
  rentals: RENTALS,
  reports: REPORTS,
  disputes: DISPUTES,
  adminMembers: ADMIN_MEMBERS,
  adminHistory: ADMIN_HISTORY,
  users: USERS,
  reviews: [],
  currentUserId: CURRENT_USER_ID,
  sequence: 1,
};

type Action =
  | { type: "approveRental"; rentalId: string }
  | { type: "rejectRental"; rentalId: string }
  | { type: "registerShipping"; rentalId: string; shipping: ShippingInfo }
  | { type: "confirmReceipt"; rentalId: string; evidence: Evidence }
  | { type: "requestReturn"; rentalId: string }
  | { type: "submitReturnEvidence"; rentalId: string; evidence: Evidence }
  | { type: "finalizeReturn"; rentalId: string }
  | { type: "createRentalRequest"; input: NewRentalRequest }
  | { type: "submitReport"; input: NewReport }
  | { type: "fileDispute"; reportId: string }
  | {
      type: "updateAdminStatus";
      entity: AdminEntity;
      id: string;
      status: string;
      memo: string;
      adminName: string;
    }
  | { type: "submitReview"; input: NewReview }
  | { type: "registerEquipment"; input: NewEquipment }
  | { type: "login"; email: string }
  | { type: "signup"; input: NewUser }
  | { type: "logout" };

function todayIso(): string {
  return toISODate(new Date());
}

function updateRental(
  state: MockDataState,
  rentalId: string,
  updater: (rental: Rental) => Rental,
): MockDataState {
  return {
    ...state,
    rentals: state.rentals.map((rental) => (rental.id === rentalId ? updater(rental) : rental)),
  };
}

function adminEntityLabel(state: MockDataState, entity: AdminEntity, id: string): string {
  switch (entity) {
    case "member":
      return state.adminMembers.find((member) => member.id === id)?.name ?? id;
    case "equipment":
      return state.equipment.find((item) => item.id === id)?.name ?? id;
    case "report":
      return state.reports.find((report) => report.id === id)?.equipmentName ?? id;
    case "dispute":
      return state.disputes.find((dispute) => dispute.id === id)?.equipmentName ?? id;
  }
}

function reducer(state: MockDataState, action: Action): MockDataState {
  switch (action.type) {
    case "approveRental":
      return updateRental(state, action.rentalId, (rental) => ({ ...rental, status: "PAID" }));

    case "rejectRental":
      return updateRental(state, action.rentalId, (rental) => ({ ...rental, status: "REJECTED" }));

    case "registerShipping":
      return updateRental(state, action.rentalId, (rental) => ({
        ...rental,
        status: "SHIPPING",
        shipping: action.shipping,
      }));

    case "confirmReceipt":
      return updateRental(state, action.rentalId, (rental) => ({
        ...rental,
        status: "RENTING",
        receiptEvidence: { ...action.evidence, recordedAt: todayIso() },
      }));

    case "requestReturn":
      return updateRental(state, action.rentalId, (rental) => ({
        ...rental,
        status: "RETURN_UPLOAD",
      }));

    case "submitReturnEvidence":
      return updateRental(state, action.rentalId, (rental) => ({
        ...rental,
        status: "RETURN_REQUESTED",
        returnEvidence: { ...action.evidence, recordedAt: todayIso() },
      }));

    case "finalizeReturn":
      return updateRental(state, action.rentalId, (rental) => ({
        ...rental,
        status: "COMPLETED",
      }));

    case "createRentalRequest": {
      const rental: Rental = {
        ...action.input,
        id: `r-${state.sequence}`,
        status: "PENDING",
        createdAt: todayIso(),
      };
      return { ...state, rentals: [rental, ...state.rentals], sequence: state.sequence + 1 };
    }

    case "submitReport": {
      const today = todayIso();
      const report: Report = {
        ...action.input,
        id: `rep-${state.sequence}`,
        createdAt: today,
        status: "접수",
        progress: [
          { label: "접수 완료", reachedAt: today },
          { label: "관리자 검토", reachedAt: null },
          { label: "처리 완료", reachedAt: null },
        ],
      };
      return { ...state, reports: [report, ...state.reports], sequence: state.sequence + 1 };
    }

    case "fileDispute": {
      const report = state.reports.find((item) => item.id === action.reportId);
      if (!report) return state;
      const dispute: Dispute = {
        id: `d-${state.sequence}`,
        reportId: report.id,
        reason: report.detail,
        partyNames: [report.reporterName, report.reportedUserName],
        claimAmount: 0,
        equipmentName: report.equipmentName,
        createdAt: todayIso(),
        adjustmentDueDate: todayIso(),
        evidencePhotoUrls: report.photoUrls,
        status: "접수",
      };
      return { ...state, disputes: [dispute, ...state.disputes], sequence: state.sequence + 1 };
    }

    case "updateAdminStatus": {
      const history: AdminHistoryEntry = {
        id: `h-${state.sequence}`,
        occurredAt: `${todayIso()} ${new Date().toTimeString().slice(0, 5)}`,
        adminName: action.adminName,
        action: `상태를 '${action.status}'(으)로 변경${action.memo ? ` — ${action.memo}` : ""}`,
        targetLabel: adminEntityLabel(state, action.entity, action.id),
        targetType: action.entity,
        targetId: action.id,
      };
      return {
        ...state,
        adminMembers:
          action.entity === "member"
            ? state.adminMembers.map((member) =>
                member.id === action.id ? { ...member, status: action.status as MemberStatus } : member,
              )
            : state.adminMembers,
        equipment:
          action.entity === "equipment"
            ? state.equipment.map((item) =>
                item.id === action.id ? { ...item, status: action.status as EquipmentStatus } : item,
              )
            : state.equipment,
        reports:
          action.entity === "report"
            ? state.reports.map((report) =>
                report.id === action.id ? { ...report, status: action.status as ReportStatus } : report,
              )
            : state.reports,
        disputes:
          action.entity === "dispute"
            ? state.disputes.map((dispute) =>
                dispute.id === action.id ? { ...dispute, status: action.status as DisputeStatus } : dispute,
              )
            : state.disputes,
        adminHistory: [history, ...state.adminHistory],
        sequence: state.sequence + 1,
      };
    }

    case "submitReview": {
      const review: Review = { ...action.input, id: `rv-${state.sequence}`, createdAt: todayIso() };
      return { ...state, reviews: [review, ...state.reviews], sequence: state.sequence + 1 };
    }

    case "registerEquipment": {
      const equipment: Equipment = {
        ...action.input,
        id: `eq-${state.sequence}`,
        status: "공개",
        createdAt: todayIso(),
        ratingAverage: 0,
        reportCount: 0,
      };
      return { ...state, equipment: [equipment, ...state.equipment], sequence: state.sequence + 1 };
    }

    case "login": {
      const match = state.users.find(
        (user) => user.email.toLowerCase() === action.email.toLowerCase(),
      );
      return { ...state, currentUserId: match?.id ?? CURRENT_USER_ID };
    }

    case "signup": {
      const user: User = { ...action.input, id: `u-${state.sequence}` };
      return {
        ...state,
        users: [...state.users, user],
        currentUserId: user.id,
        sequence: state.sequence + 1,
      };
    }

    case "logout":
      return { ...state, currentUserId: CURRENT_USER_ID };

    default:
      return state;
  }
}

interface MockDataContextValue extends MockDataState {
  currentUser: User;
  approveRental: (rentalId: string) => void;
  rejectRental: (rentalId: string) => void;
  registerShipping: (rentalId: string, shipping: ShippingInfo) => void;
  confirmReceipt: (rentalId: string, evidence: Evidence) => void;
  requestReturn: (rentalId: string) => void;
  submitReturnEvidence: (rentalId: string, evidence: Evidence) => void;
  finalizeReturn: (rentalId: string) => void;
  createRentalRequest: (input: NewRentalRequest) => void;
  submitReport: (input: NewReport) => void;
  fileDispute: (reportId: string) => void;
  updateAdminStatus: (entity: AdminEntity, id: string, status: string, memo: string) => void;
  submitReview: (input: NewReview) => void;
  registerEquipment: (input: NewEquipment) => void;
  login: (email: string) => void;
  signup: (input: NewUser) => void;
  logout: () => void;
}

const MockDataContext = createContext<MockDataContextValue | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<MockDataContextValue>(() => {
    const currentUser =
      state.users.find((user) => user.id === state.currentUserId) ?? state.users[0];

    return {
      ...state,
      currentUser,
      approveRental: (rentalId) => dispatch({ type: "approveRental", rentalId }),
      rejectRental: (rentalId) => dispatch({ type: "rejectRental", rentalId }),
      registerShipping: (rentalId, shipping) =>
        dispatch({ type: "registerShipping", rentalId, shipping }),
      confirmReceipt: (rentalId, evidence) =>
        dispatch({ type: "confirmReceipt", rentalId, evidence }),
      requestReturn: (rentalId) => dispatch({ type: "requestReturn", rentalId }),
      submitReturnEvidence: (rentalId, evidence) =>
        dispatch({ type: "submitReturnEvidence", rentalId, evidence }),
      finalizeReturn: (rentalId) => dispatch({ type: "finalizeReturn", rentalId }),
      createRentalRequest: (input) => dispatch({ type: "createRentalRequest", input }),
      submitReport: (input) => dispatch({ type: "submitReport", input }),
      fileDispute: (reportId) => dispatch({ type: "fileDispute", reportId }),
      updateAdminStatus: (entity, id, status, memo) =>
        dispatch({ type: "updateAdminStatus", entity, id, status, memo, adminName: "관리자" }),
      submitReview: (input) => dispatch({ type: "submitReview", input }),
      registerEquipment: (input) => dispatch({ type: "registerEquipment", input }),
      login: (email) => dispatch({ type: "login", email }),
      signup: (input) => dispatch({ type: "signup", input }),
      logout: () => dispatch({ type: "logout" }),
    };
  }, [state]);

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockData(): MockDataContextValue {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error("useMockData must be used within MockDataProvider");
  return ctx;
}
