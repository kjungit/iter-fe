"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/client";
import {
  exchangeKakaoLogin,
  linkKakao,
  signUpKakao,
  type OAuthAction,
} from "@/lib/api/oauth";
import { useAppData } from "@/lib/store/app-data-context";

type ViewState =
  | { step: "loading" }
  | { step: "error"; message: string }
  | { step: OAuthAction; oauthToken: string; email: string; nickname: string };

export function OAuthCallbackView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login } = useAppData();
  const [state, setState] = useState<ViewState>({ step: "loading" });
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    (async () => {
      try {
        const result = await exchangeKakaoLogin();
        if (result.status === "authenticated") {
          await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
          router.replace("/");
          return;
        }
        setState({
          step: result.action,
          oauthToken: result.oauthToken,
          email: result.email,
          nickname: result.nickname,
        });
      } catch (err) {
        setState({
          step: "error",
          message: err instanceof ApiError ? err.message : "카카오 로그인에 실패했습니다.",
        });
      }
    })();
  }, [queryClient, router]);

  if (state.step === "loading") {
    return (
      <div className="mx-auto mt-[100px] w-full max-w-[400px] px-6 text-center text-[13.5px] text-text-secondary">
        카카오 로그인 처리 중입니다...
      </div>
    );
  }

  if (state.step === "error") {
    return (
      <div className="mx-auto mt-[100px] w-full max-w-[400px] px-6 text-center">
        <p className="text-[13.5px] text-badge-danger-fg">{state.message}</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.replace("/login")}>
          로그인으로 돌아가기
        </Button>
      </div>
    );
  }

  if (state.step === "SIGNUP_REQUIRED") {
    return (
      <KakaoSignUpStep
        oauthToken={state.oauthToken}
        email={state.email}
        nickname={state.nickname}
        onDone={async () => {
          await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
          router.replace("/");
        }}
      />
    );
  }

  return (
    <KakaoLinkStep
      oauthToken={state.oauthToken}
      email={state.email}
      onLogin={login}
      onDone={() => router.replace("/")}
    />
  );
}

function KakaoSignUpStep({
  oauthToken,
  email,
  nickname,
  onDone,
}: {
  oauthToken: string;
  email: string;
  nickname: string;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signUpKakao({ oauthToken, email, nickname, name, phone });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-[60px] w-full max-w-[400px] px-6">
      <h1 className="mb-2 text-center text-[20px] font-extrabold text-ink">추가 정보 입력</h1>
      <p className="mb-6 text-center text-[12.5px] text-text-secondary">
        카카오 계정({email})으로 처음 로그인하셨네요. 이름과 연락처를 입력해주세요.
      </p>
      <div className="flex flex-col gap-2.5">
        <Input placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} />
        <Input
          placeholder="휴대폰 번호 (010-1234-5678)"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
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
        가입 완료
      </Button>
    </div>
  );
}

function KakaoLinkStep({
  oauthToken,
  email,
  onLogin,
  onDone,
}: {
  oauthToken: string;
  email: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(email, password);
      await linkKakao(oauthToken);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "계정 연결에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-[60px] w-full max-w-[400px] px-6">
      <h1 className="mb-2 text-center text-[20px] font-extrabold text-ink">기존 계정과 연결</h1>
      <p className="mb-6 text-center text-[12.5px] text-text-secondary">
        {email} 계정이 이미 존재합니다. 비밀번호를 입력하면 카카오 계정과 연결됩니다.
      </p>
      <div className="flex flex-col gap-2.5">
        <Input value={email} disabled />
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
        연결하기
      </Button>
    </div>
  );
}
