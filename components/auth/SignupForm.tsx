"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/client";
import { useAppData } from "@/lib/store/app-data-context";

/** 모든 회원가입 필드가 필수라 라벨에 항상 * 표시를 붙인다. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-text-body-2">
        {label} <span className="text-badge-danger-fg">*</span>
      </label>
      {children}
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signup({ email, password, name, nickname, phone });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-[60px] w-full max-w-[420px] px-6">
      <h1 className="mb-6 text-center text-[22px] font-extrabold text-ink">회원가입</h1>
      <div className="flex flex-col gap-2.5">
        <Field label="이메일">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="비밀번호">
          <Input
            type="password"
            placeholder="8~32자"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="비밀번호 확인">
          <Input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
        </Field>
        <Field label="이름">
          <Input placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="닉네임">
          <Input
            placeholder="닉네임"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </Field>
        <Field label="휴대폰 번호">
          <Input
            placeholder="- 없이 숫자만 입력 (예: 01012345678)"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
      </div>
      {error && <p className="mt-2.5 text-[12.5px] text-badge-danger-fg">{error}</p>}
      <Button
        variant="primary"
        fullWidth
        className="mt-5 rounded-sm py-[15px] text-[14.5px]"
        onClick={handleSubmit}
        loading={submitting}
      >
        가입하기
      </Button>
      <p className="mt-4 text-center text-[13px] text-text-secondary">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-ink-strong">
          로그인
        </Link>
      </p>
    </div>
  );
}
