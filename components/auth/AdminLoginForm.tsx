"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchCurrentUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAppData } from "@/lib/store/app-data-context";

export function AdminLoginForm() {
  const router = useRouter();
  const { login, logout, isAdminAuthenticated } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated) router.push("/admin");
  }, [isAdminAuthenticated, router]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const me = await fetchCurrentUser();
      if (me?.role !== "ADMIN") {
        await logout();
        setError("관리자 권한이 없는 계정입니다.");
        setSubmitting(false);
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-[60px] w-full max-w-[400px] px-6">
      <h1 className="mb-6 text-center text-[22px] font-extrabold text-ink">관리자 로그인</h1>
      <div className="flex flex-col gap-2.5">
        <Input
          type="email"
          placeholder="관리자 이메일"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}
      <Button
        variant="primary"
        fullWidth
        className="mt-5 rounded-sm py-[15px] text-[14.5px]"
        onClick={handleSubmit}
        loading={submitting}
      >
        로그인
      </Button>
    </div>
  );
}
