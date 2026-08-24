"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/store/app-data-context";
import type { User } from "@/lib/types";

/**
 * 로그인이 필요한 화면에서 최상단에 호출. 로딩 중이거나 미인증이면 null을 반환하므로
 * 호출부는 `const currentUser = useRequireAuth(); if (!currentUser) return null;` 패턴으로 사용.
 */
export function useRequireAuth(): User | null {
  const router = useRouter();
  const { currentUser, isAuthLoading } = useAppData();

  useEffect(() => {
    if (!isAuthLoading && !currentUser) router.replace("/login");
  }, [isAuthLoading, currentUser, router]);

  return isAuthLoading ? null : currentUser;
}
