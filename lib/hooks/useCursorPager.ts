import { useState } from "react";

interface CursorPage {
  nextCursor: string | null;
  hasNext: boolean;
}

/**
 * 커서 기반 목록의 "이전/다음" 탐색 상태를 관리한다. 방문한 커서를 스택으로 쌓아두고
 * 인덱스로 되짚어가므로 "이전"도 별도 API 호출 없이 가능하다. 검색어/필터가 바뀌면
 * 커서가 무효해지므로 반드시 reset()을 호출해야 한다.
 */
export function useCursorPager() {
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const [index, setIndex] = useState(0);

  function goNext(page: CursorPage | undefined) {
    if (!page?.hasNext || !page.nextCursor) return;
    const nextCursor = page.nextCursor;
    setCursorStack((prev) => [...prev.slice(0, index + 1), nextCursor]);
    setIndex((prev) => prev + 1);
  }

  function goPrev() {
    setIndex((prev) => Math.max(0, prev - 1));
  }

  function reset() {
    setCursorStack([undefined]);
    setIndex(0);
  }

  return { cursor: cursorStack[index], hasPrev: index > 0, goNext, goPrev, reset };
}
