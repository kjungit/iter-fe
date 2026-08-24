export interface DaumPostcodeResult {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeResult) => void }) => {
        open: () => void;
      };
    };
  }
}

const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

let loadPromise: Promise<void> | null = null;

function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.daum?.Postcode) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

/** 다음 우편번호 검색 팝업을 열고 사용자가 주소를 선택하면 resolve한다. */
export async function openDaumPostcodeSearch(): Promise<DaumPostcodeResult> {
  await loadDaumPostcodeScript();
  return new Promise((resolve) => {
    new window.daum!.Postcode({
      oncomplete: (data) => resolve(data),
    }).open();
  });
}
