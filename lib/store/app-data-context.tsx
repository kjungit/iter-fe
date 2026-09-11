"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  signUp as apiSignUp,
  type SignUpInput,
} from "@/lib/api/auth";
import type { User } from "@/lib/types";

interface AppDataContextValue {
  currentUser: User | null;
  isAuthLoading: boolean;
  /** currentUser와 동일한 값의 별칭 — role이 ADMIN일 때만 존재. 관리자 화면 diff를 줄이기 위한 편의 필드. */
  currentAdmin: User | null;
  isAdminAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: SignUpInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
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
      currentUser,
      isAuthLoading: meQuery.isLoading,
      currentAdmin: isAdminAuthenticated ? currentUser : null,
      isAdminAuthenticated,
      login: (email, password) => loginMutation.mutateAsync({ email, password }),
      signup: (input) => signupMutation.mutateAsync(input),
      logout: () => logoutMutation.mutateAsync(),
    };
  }, [currentUser, meQuery.isLoading, loginMutation, signupMutation, logoutMutation]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
