import Link from "next/link";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-ink-strong">
        <div className="mx-auto flex h-full max-w-[1180px] items-center px-6">
          <Link href="/admin" className="text-[16px] font-extrabold tracking-[-0.02em] text-white">
            ITer 관리자
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
