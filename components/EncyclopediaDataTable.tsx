import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EncyclopediaTableColumn<Row> {
  key: string;
  header: ReactNode;
  cellClassName?: string;
  headerClassName?: string;
  render: (row: Row) => ReactNode;
}

interface EncyclopediaDataTableProps<Row> {
  columns: EncyclopediaTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  emptyMessage?: string;
  className?: string;
}

export function EncyclopediaDataTable<Row>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No entries found.",
  className
}: EncyclopediaDataTableProps<Row>) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-black/20 bg-white/70", className)}>
      <table className="min-w-full text-left text-sm text-black/80">
        <thead className="border-b border-black/15 bg-white/90">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn("px-3 py-2", column.headerClassName)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => {
              const currentRowKey = rowKey(row, index);
              return (
                <tr key={currentRowKey} className="border-t border-black/10">
                  {columns.map((column) => (
                    <td
                      key={`${column.key}-${currentRowKey}`}
                      className={cn("px-3 py-2", column.cellClassName)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={Math.max(columns.length, 1)}
                className="px-3 py-3 text-sm text-black/60"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
