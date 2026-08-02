import React from "react";

/* ── Panel: the fundamental container. Flat, 1px border, no shadow. ── */
export function Panel({ title, actions, children, className = "", bodyClassName = "", scroll = true }) {
  return (
    <section className={`flex flex-col min-h-0 bg-mdt-surface border border-mdt-line ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 h-8 px-2.5 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
          <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim truncate">{title}</h2>
          <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>
        </header>
      )}
      <div className={`flex-1 min-h-0 ${scroll ? "overflow-auto mdt-scroll" : ""} ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/* ── Toolbar: horizontal strip of controls above a workspace ── */
export function Toolbar({ children, className = "" }) {
  return (
    <div className={`flex items-center gap-2 h-9 px-2.5 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0 ${className}`}>
      {children}
    </div>
  );
}

/* ── StatusPill: compact state indicator, square-ish, no glow ── */
const TONE = {
  neutral: "bg-mdt-surface-3 text-mdt-muted border-mdt-line-2",
  info: "bg-blue-500/10 text-blue-300 border-blue-500/25",
  ok: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  warn: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  crit: "bg-red-500/12 text-red-300 border-red-500/30",
};
export function StatusPill({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 h-[18px] rounded-sm border text-[10.5px] font-semibold uppercase tracking-wide whitespace-nowrap ${TONE[tone] || TONE.neutral} ${className}`}>
      {children}
    </span>
  );
}

/* ── Field: label + value, used in detail views ── */
export function Field({ label, value, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">{label}</div>
      <div className="text-[12.5px] text-mdt-text truncate">{value || "—"}</div>
    </div>
  );
}

/* ── Btn: flat enterprise button ── */
const VARIANT = {
  default: "bg-mdt-surface-3 text-mdt-text border-mdt-line-2 hover:bg-mdt-surface-4",
  primary: "bg-mdt-accent text-white border-mdt-accent hover:brightness-110",
  ghost: "bg-transparent text-mdt-muted border-transparent hover:bg-mdt-surface-3 hover:text-mdt-text",
  danger: "bg-red-600 text-white border-red-600 hover:brightness-110",
};
export function Btn({ variant = "default", icon: Icon, children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 h-7 px-2 rounded-sm border text-[11.5px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${VARIANT[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

/* ── EmptyState: quiet, never decorative ── */
export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
      {Icon && <Icon className="w-6 h-6 text-mdt-dim mb-2" />}
      <p className="text-[12.5px] text-mdt-muted">{title}</p>
      {hint && <p className="text-[11px] text-mdt-dim mt-0.5">{hint}</p>}
    </div>
  );
}