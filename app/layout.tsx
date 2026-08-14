import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { MockDataProvider } from "@/lib/store/mock-data-context";
import { ConfirmModalProvider } from "@/lib/store/confirm-modal-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITer — P2P 장비 대여 플랫폼",
  description: "카메라, 노트북, VR기기, 프로젝터, 게임기, 렌즈를 이웃과 대여·대여해주는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <MockDataProvider>
          <ConfirmModalProvider>
            <Header />
            {children}
          </ConfirmModalProvider>
        </MockDataProvider>
      </body>
    </html>
  );
}
