/**
 * 토스페이먼츠 결제창 SDK 로더. iter-be의 검증된 통합 방식(src/main/resources/static/
 * notification-test/pay.html)을 그대로 따른다 — v1 SDK, TossPayments(clientKey).requestPayment().
 */

interface TossPaymentsInstance {
  requestPayment: (
    method: "카드",
    params: {
      amount: number;
      orderId: string;
      orderName: string;
      customerName: string;
      successUrl: string;
      failUrl: string;
    },
  ) => Promise<void>;
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

const SDK_SRC = "https://js.tosspayments.com/v1/payment";

let loadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    if (window.TossPayments) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function openTossCheckout(params: {
  clientKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  successUrl: string;
  failUrl: string;
}): Promise<void> {
  await loadScript();
  if (!window.TossPayments) throw new Error("토스페이먼츠 SDK를 불러오지 못했습니다.");
  const tossPayments = window.TossPayments(params.clientKey);
  await tossPayments.requestPayment("카드", params);
}
