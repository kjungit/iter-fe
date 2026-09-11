"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/store/app-data-context";

export default function AdminDashboardLayout({ children }: LayoutProps<"/admin">) {
  const router = useRouter();
  const { isAdminAuthenticated, isAuthLoading, currentAdmin, logout } = useAppData();

  useEffect(() => {
    if (!isAuthLoading && !isAdminAuthenticated) router.replace("/admin/login");
  }, [isAuthLoading, isAdminAuthenticated, router]);

  if (isAuthLoading || !isAdminAuthenticated) return null;

  const handleLogout = () => {
    void logout();
    router.push("/admin/login");
  };

  return (
    <div>
      <div className="border-b border-border bg-surface-alt">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-6 py-2.5">
          <span className="text-[12.5px] font-semibold text-text-secondary">
            {currentAdmin?.name} 관리자로 로그인됨
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[12.5px] font-semibold text-text-tertiary"
          >
            로그아웃
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
