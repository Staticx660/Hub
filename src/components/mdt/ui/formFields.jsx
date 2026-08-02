import React, { useState } from "react";
import { Plus, X } from "lucide-react";

const BASE = "bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";

/* Label + control wrapper */
export function MField({ label, children, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      {label && <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">{label}</div>}
      {children}
    </div>
  );
}

export function MInput({ className = "", ...props }) {
  return <input {...props} className={`h-7 px-2 w-full ${BASE} ${className}`} />;
}

export function MTextarea({ className = "", rows = 3, ...props }) {
  return <textarea {...props} rows={rows} className={`p-2 w-full resize-none ${BASE} ${className}`} />;
}

export function MSelect({ options = [], className = "", ...props }) {
  return (
    <select {...props} className={`h-7 px-1.5 w-full ${BASE} ${className}`}>
      {options.map((o) => <option key={o} value={o} className="bg-mdt-surface">{o || "—"}</option>)}
    </select>
  );
}

/* Segmented button group */
export function MToggleGroup({ options = [], value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`h-7 px-2.5 border text-[12.5px] ${value === o ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-accent" : "bg-mdt-surface border-mdt-line text-mdt-text hover:bg-mdt-surface-3"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* Titled form section */
export function MSection({ title, actions, children, className = "" }) {
  return (
    <section className={`border border-mdt-line bg-mdt-surface ${className}`}>
      <header className="flex items-center justify-between gap-2 h-7 px-2.5 border-b border-mdt-line bg-mdt-surface-2">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">{title}</h3>
        {actions}
      </header>
      <div className="p-2.5">{children}</div>
    </section>
  );
}

/* Chip / tag list input */
export function MChips({ values = [], onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };
  return (
    <div>
      <div className="flex gap-1.5">
        <MInput value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} />
        <button type="button" onClick={add} className="h-7 px-2 border border-mdt-line-2 bg-mdt-surface-3 text-mdt-text hover:bg-mdt-surface-4"><Plus className="w-3.5 h-3.5" /></button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {values.map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 h-[20px] px-1.5 border border-mdt-line-2 bg-mdt-surface-3 text-[11.5px] text-mdt-text">
              {v}
              <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="text-mdt-dim hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}