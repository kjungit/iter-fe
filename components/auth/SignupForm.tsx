"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMockData } from "@/lib/store/mock-data-context";

export function SignupForm() {
  const router = useRouter();
  const { signup } = useMockData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = () => {
    signup({
      name,
      nickname,
      email,
      phone,
      avatarInitials: name.slice(0, 2) || "IT",
      defaultAddress: {
        recipientName: name,
        phone,
        zipcode: "",
        address: "",
        detailAddress: "",
      },
    });
    router.push("/");
  };

  return (
    <div className="mx-auto mt-[60px] w-full max-w-[420px] px-6">
      <h1 className="mb-6 text-center text-[22px] font-extrabold text-ink">회원가입</h1>
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
        <Input
          type="password"
          placeholder="비밀번호 확인"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
        />
        <Input placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} />
        <Input
          placeholder="닉네임"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
        <Input
          placeholder="휴대폰 번호"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      <Button
        variant="primary"
        fullWidth
        className="mt-5 rounded-sm py-[15px] text-[14.5px]"
        onClick={handleSubmit}
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
