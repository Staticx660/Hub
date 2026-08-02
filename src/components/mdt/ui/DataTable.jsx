import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * Dense enterprise table — sticky header, click-to-sort, row selection.
 * columns: [{ key, label, width, align, render, sortable, mono }]
 */
export default function DataTable({ columns, rows, rowKey = (r) => r.id, onRowClick, onRowDoubleClick, selectedKey, sort: initialSort, rowTone, emptyMessage = "No records" }) {
  const [sort, setSort] = useState(initialSort || null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const get = (r) => (col?.sortValue ? col.sortValue(r) : r[sort.key]) ?? "";
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      const res = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? res : -res;
    });
  }, [rows, sort, columns]);

  const toggle = (key) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  if (rows.length === 0) {
    return <div className="py-8 text-center text-[12px] text-mdt-dim">{emptyMessage}</div>;
  }

  return (
    <table className="w-full border-collapse text-[12px]">
      <thead className="sticky top-0 z-10">
        <tr className="bg-mdt-surface-2">
          {columns.map((c) => (
            <th
              key={c.key}
              onClick={c.sortable === false ? undefined : () => toggle(c.key)}
              style={c.width ? { width: c.width } : undefined}
              className={`h-7 px-2 border-b border-mdt-line text-[10px] font-semibold uppercase tracking-[0.08em] text-mdt-dim whitespace-nowrap ${c.align === "right" ? "text-right" : "text-left"} ${c.sortable === false ? "" : "cursor-pointer select-none hover:text-mdt-text"}`}
            >
              <span className="inline-flex items-center gap-1">
                {c.label}
                {sort?.key === c.key && (sort.dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => {
          const k = rowKey(r);
          const selected = selectedKey === k;
          const tone = rowTone?.(r);
          return (
            <tr
              key={k}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(r) : undefined}
              className={`border-b border-mdt-line/60 ${onRowClick ? "cursor-pointer" : ""} ${selected ? "bg-mdt-accent/15" : "hover:bg-mdt-surface-3/60"}`}
            >
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  className={`h-7 px-2 text-mdt-text truncate max-w-[1px] ${c.align === "right" ? "text-right" : "text-left"} ${c.mono ? "font-mono text-[11.5px]" : ""}`}
                  style={i === 0 && tone ? { boxShadow: `inset 2px 0 0 ${tone}` } : undefined}
                >
                  {c.render ? c.render(r) : r[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}