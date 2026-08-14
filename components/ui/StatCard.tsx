interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-md border border-border p-4">
      <div className="text-[12px] font-semibold text-text-secondary">{label}</div>
      <div className="mt-1.5 text-[22px] font-extrabold text-ink">{value}</div>
    </div>
  );
}
