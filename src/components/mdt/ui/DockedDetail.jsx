import React from "react";

/** Bottom-docked detail pane: title line + inset box of label/value rows. */
export default function DockedDetail({ title, rows = [], footer }) {
  return (
    <div className="flex flex-col flex-shrink-0 max-h-[45%] border-t border-mdt-line bg-mdt-bg">
      <div className="px-3 py-2.5 text-[14px] text-mdt-text">{title}</div>
      <div className="mx-3 mb-3 border border-mdt-line bg-mdt-surface overflow-auto mdt-scroll">
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} className={`flex gap-3 px-3 py-1.5 ${i === 0 ? "border-b border-mdt-line" : ""}`}>
            <div className="w-[150px] flex-shrink-0 text-[12.5px] text-mdt-muted">{r.label}:</div>
            <div className="text-[12.5px] text-mdt-text whitespace-pre-wrap">{r.value || "—"}</div>
          </div>
        ))}
        {footer && <div className="px-3 py-2 border-t border-mdt-line">{footer}</div>}
      </div>
    </div>
  );
}