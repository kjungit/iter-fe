import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  gridTemplateColumns: string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({ columns, rows, rowKey, gridTemplateColumns, onRowClick }: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid bg-surface-alt" style={{ gridTemplateColumns }}>
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 py-3 text-[12px] font-bold text-text-table-header"
          >
            {column.header}
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={rowKey(row)}
          className={cn(
            "grid items-center border-t border-border-row",
            onRowClick && "cursor-pointer",
          )}
          style={{ gridTemplateColumns }}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((column, columnIndex) => (
            <div
              key={column.key}
              className={cn(
                "px-4 py-3.5 text-[13px]",
                columnIndex === 0 ? "font-semibold text-ink" : "text-text-body-2",
              )}
            >
              {column.render(row)}
            </div>
          ))}
        </div>
      ))}
      {rows.length === 0 && (
        <div className="px-4 py-10 text-center text-[12.5px] text-text-secondary">
          표시할 항목이 없습니다.
        </div>
      )}
    </div>
  );
}
