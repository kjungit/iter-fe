import { Button } from "@/components/ui/Button";

interface CursorPagerProps {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** 전체 건수를 세지 않는 커서 기반 목록용 — 임의 페이지 이동 없이 이전/다음만 지원한다. */
export function CursorPager({ hasPrev, hasNext, onPrev, onNext }: CursorPagerProps) {
  if (!hasPrev && !hasNext) return null;
  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <Button variant="secondary" size="sm" disabled={!hasPrev} onClick={onPrev}>
        이전
      </Button>
      <Button variant="secondary" size="sm" disabled={!hasNext} onClick={onNext}>
        다음
      </Button>
    </div>
  );
}
