"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMockData } from "@/lib/store/mock-data-context";

export function LoginForm() {
  const router = useRouter();
  const { login } = useMockData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    login(email);
    router.push("/");
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
      <Button
        variant="primary"
        fullWidth
        className="mt-5 rounded-sm py-[15px] text-[14.5px]"
        onClick={handleSubmit}
      >
        로그인
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
