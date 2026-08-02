import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/** Dense sortable table for the CAD console (cad-* theme tokens). */
export default function ConsoleTable({ columns, rows, rowKey = (r) => r.id, onRowClick, selectedKey, rowTone, emptyMessage = "No records" }) {
  const [sort, setSort] = useState(null);

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

  const toggle = (key) => setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  if (rows.length === 0) return <div className="py-10 text-center text-[12.5px] text-cad-dim">{emptyMessage}</div>;

  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead className="sticky top-0 z-10">
        <tr className="bg-cad-surface-2/90 backdrop-blur">
          {columns.map((c) => (
            <th
              key={c.key}
              onClick={c.sortable === false ? undefined : () => toggle(c.key)}
              style={c.width ? { width: c.width } : undefined}
              className={`h-8 px-2.5 border-b border-cad-border/60 text-[10px] font-semibold uppercase tracking-[0.1em] text-cad-dim whitespace-nowrap ${c.align === "right" ? "text-right" : "text-left"} ${c.sortable === false ? "" : "cursor-pointer select-none hover:text-cad-text"}`}
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
              className={`border-b border-cad-border/40 ${onRowClick ? "cursor-pointer" : ""} ${selected ? "bg-cad-accent/12" : "hover:bg-cad-surface-2/60"}`}
            >
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  className={`h-8 px-2.5 text-cad-text truncate max-w-[1px] ${c.align === "right" ? "text-right" : "text-left"} ${c.mono ? "font-mono text-[11.5px]" : ""}`}
                  style={i === 0 && tone ? { boxShadow: `inset 3px 0 0 ${tone}` } : undefined}
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