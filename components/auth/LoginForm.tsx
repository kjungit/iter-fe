"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/client";
import { startKakaoLogin } from "@/lib/api/oauth";
import { useAppData } from "@/lib/store/app-data-context";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-[60px] w-full max-w-[400px] px-6">
      <h1 className="mb-6 text-center text-[22px] font-extrabold text-ink">로그인</h1>
      <div className="flex flex-col gap-2.5">
        <Input
          type="email"
          placeholder="이메일"
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

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[12px] text-text-tertiary">또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="kakao"
        fullWidth
        className="mt-4 rounded-sm py-[15px] text-[14.5px]"
        onClick={startKakaoLogin}
      >
        카카오로 로그인
      </Button>

      <p className="mt-4 text-center text-[13px] text-text-secondary">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-bold text-ink-strong">
          회원가입
        </Link>
      </p>
    </div>
  );
}
