import React from "react";

/**
 * CAD Console design language — used by the Dispatch console, Civilian portal and CAD Home.
 * Distinct from the MDT shell: uses the theme-aware cad-* tokens, soft panels, generous headers.
 */

export function ConsolePanel({ title, subtitle, actions, children, className = "", bodyClassName = "", scroll = true }) {
  return (
    <section className={`flex flex-col min-h-0 cad-glass border border-cad-border/60 rounded-[var(--cad-radius)] overflow-hidden ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-3 py-2 border-b border-cad-border/60 bg-cad-surface-2/50 flex-shrink-0">
          <div className="min-w-0">
            {title && <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cad-muted truncate">{title}</h2>}
            {subtitle && <p className="text-[11px] text-cad-dim truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">{actions}</div>
        </header>
      )}
      <div className={`flex-1 min-h-0 ${scroll ? "overflow-auto cad-scroll" : ""} ${bodyClassName}`}>{children}</div>
    </section>
  );
}

const BTN = {
  default: "bg-cad-surface-2 text-cad-text border-cad-border hover:bg-cad-surface-3",
  primary: "text-white border-transparent hover:brightness-110 bg-cad-accent",
  ghost: "bg-transparent text-cad-muted border-transparent hover:bg-cad-surface-2 hover:text-cad-text",
  danger: "bg-red-600 text-white border-red-600 hover:brightness-110",
  active: "bg-cad-accent/15 text-cad-accent border-cad-accent/40",
};
export function ConsoleBtn({ variant = "default", icon: Icon, children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[calc(var(--cad-radius)*0.6)] border text-[12px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${BTN[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

const TAG = {
  neutral: "bg-cad-surface-3 text-cad-muted border-cad-border-light",
  info: "bg-blue-500/12 text-blue-300 border-blue-500/30",
  ok: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
  warn: "bg-amber-500/12 text-amber-300 border-amber-500/30",
  crit: "bg-red-500/14 text-red-300 border-red-500/35",
};
export function Tag({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 h-[19px] rounded-full border text-[10.5px] font-semibold uppercase tracking-wide whitespace-nowrap ${TAG[tone] || TAG.neutral} ${className}`}>
      {children}
    </span>
  );
}

export function ConsoleField({ label, value, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-cad-dim">{label}</div>
      <div className="text-[13px] text-cad-text break-words">{value || "—"}</div>
    </div>
  );
}

export function ConsoleSelect({ className = "", options = [], placeholder, children, ...props }) {
  return (
    <select
      {...props}
      className={`h-8 px-2 w-full bg-cad-surface-2 border border-cad-border rounded-[calc(var(--cad-radius)*0.6)] text-[12.5px] text-cad-text focus:outline-none focus:border-cad-accent ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      {children}
    </select>
  );
}

export function ConsoleInput({ className = "", ...props }) {
  return <input {...props} className={`h-8 px-2 w-full bg-cad-surface-2 border border-cad-border rounded-[calc(var(--cad-radius)*0.6)] text-[12.5px] text-cad-text placeholder:text-cad-dim focus:outline-none focus:border-cad-accent ${className}`} />;
}

export function ConsoleTextarea({ className = "", ...props }) {
  return <textarea {...props} className={`px-2 py-1.5 w-full bg-cad-surface-2 border border-cad-border rounded-[calc(var(--cad-radius)*0.6)] text-[12.5px] text-cad-text placeholder:text-cad-dim focus:outline-none focus:border-cad-accent resize-y ${className}`} />;
}

export function ConsoleLabel({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-cad-dim mb-1">{label}</span>
      {children}
    </label>
  );
}

export function ConsoleEmpty({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
      {Icon && <Icon className="w-8 h-8 text-cad-dim mb-2 opacity-60" />}
      <p className="text-[13px] text-cad-muted">{title}</p>
      {hint && <p className="text-[11.5px] text-cad-dim mt-0.5">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}