"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useMockData } from "@/lib/store/mock-data-context";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/rentals", label: "대여내역" },
  { href: "/equipment/new", label: "장비 등록" },
];

export function Header() {
  const pathname = usePathname();
  const { currentUser } = useMockData();

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-white">
      <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between px-6">
        <div className="flex items-center gap-9">
          <Link href="/" className="text-[21px] font-extrabold tracking-[-0.03em] text-ink-strong">
            ITer
          </Link>
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-[14px] font-semibold",
                    active ? "text-ink-strong" : "text-text-secondary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-[18px]">
          <Link href="/admin" className="text-[13px] font-semibold text-text-secondary">
            관리자
          </Link>
          <Link href="/login" className="text-[13px] font-semibold text-text-secondary">
            로그인
          </Link>
          <Link
            href="/mypage"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-strong text-[12px] font-bold text-white"
          >
            {currentUser.avatarInitials.slice(0, 2)}
          </Link>
        </div>
      </div>
    </header>
  );
}
