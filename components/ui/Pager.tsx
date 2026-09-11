import { Button } from "@/components/ui/Button";

interface PagerProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pager({ page, totalPages, onChange }: PagerProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <Button variant="secondary" size="sm" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        이전
      </Button>
      <span className="text-[12.5px] text-text-secondary">
        {page + 1} / {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        다음
      </Button>
    </div>
  );
}
