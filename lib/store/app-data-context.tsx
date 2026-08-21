"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toISODate } from "@/lib/date";
import {
  fetchCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  signUp as apiSignUp,
  type SignUpInput,
} from "@/lib/api/auth";
import {
  ADMIN_HISTORY,
  ADMIN_MEMBERS,
  DISPUTES,
  EQUIPMENT,
  REPORTS,
} from "@/lib/mock-data";
import type {
  AdminHistoryEntry,
  AdminMember,
  Dispute,
  DisputeStatus,
  Equipment,
  EquipmentStatus,
  MemberStatus,
  Report,
  ReportStatus,
  User,
} from "@/lib/types";

export interface Review {
  id: string;
  rentalId: string;
  rating: number;
  text: string;
  createdAt: string;
}

export type AdminEntity = "member" | "equipment" | "report" | "dispute";

type NewReport = Omit<Report, "id" | "createdAt" | "status" | "progress">;
type NewReview = Omit<Review, "id" | "createdAt">;

interface AppDataState {
  equipment: Equipment[];
  reports: Report[];
  disputes: Dispute[];
  adminMembers: AdminMember[];
  adminHistory: AdminHistoryEntry[];
  reviews: Review[];
  /** Monotonic counter backing generated ids — avoids impure Date.now()/crypto calls in render paths. */
  sequence: number;
}

const initialState: AppDataState = {
  equipment: EQUIPMENT,
  reports: REPORTS,
  disputes: DISPUTES,
  adminMembers: ADMIN_MEMBERS,
  adminHistory: ADMIN_HISTORY,
  reviews: [],
  sequence: 1,
};

type Action =
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
  | { type: "submitReview"; input: NewReview };

function todayIso(): string {
  return toISODate(new Date());
}

function adminEntityLabel(state: AppDataState, entity: AdminEntity, id: string): string {
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

function reducer(state: AppDataState, action: Action): AppDataState {
  switch (action.type) {
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

    default:
      return state;
  }
}

interface AppDataContextValue extends AppDataState {
  currentUser: User | null;
  isAuthLoading: boolean;
  /** currentUser와 동일한 값의 별칭 — role이 ADMIN일 때만 존재. 관리자 화면 diff를 줄이기 위한 편의 필드. */
  currentAdmin: User | null;
  isAdminAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: SignUpInput) => Promise<void>;
  logout: () => Promise<void>;
  submitReport: (input: NewReport) => void;
  fileDispute: (reportId: string) => void;
  updateAdminStatus: (entity: AdminEntity, id: string, status: string, memo: string) => void;
  submitReview: (input: NewReview) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });
  const currentUser = meQuery.data ?? null;

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiLogin(email, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  const signupMutation = useMutation({
    mutationFn: async (input: SignUpInput) => {
      await apiSignUp(input);
      await apiLogin(input.email, input.password);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  const logoutMutation = useMutation({
    mutationFn: apiLogout,
    onSuccess: () => queryClient.setQueryData(["auth", "me"], null),
  });

  const value = useMemo<AppDataContextValue>(() => {
    const isAdminAuthenticated = currentUser?.role === "ADMIN";
    return {
      ...state,
      currentUser,
      isAuthLoading: meQuery.isLoading,
      currentAdmin: isAdminAuthenticated ? currentUser : null,
      isAdminAuthenticated,
      login: (email, password) => loginMutation.mutateAsync({ email, password }),
      signup: (input) => signupMutation.mutateAsync(input),
      logout: () => logoutMutation.mutateAsync(),
      submitReport: (input) => dispatch({ type: "submitReport", input }),
      fileDispute: (reportId) => dispatch({ type: "fileDispute", reportId }),
      updateAdminStatus: (entity, id, status, memo) =>
        dispatch({
          type: "updateAdminStatus",
          entity,
          id,
          status,
          memo,
          adminName: isAdminAuthenticated ? (currentUser?.name ?? "관리자") : "관리자",
        }),
      submitReview: (input) => dispatch({ type: "submitReview", input }),
    };
  }, [
    state,
    currentUser,
    meQuery.isLoading,
    loginMutation,
    signupMutation,
    logoutMutation,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
