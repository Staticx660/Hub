import React, { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Type-in + dropdown picker. Users can free-type any value OR pick from the list.
 * options: array of strings, or { value, label, data }.
 * onChange(text) fires on typing and on pick. onSelect(option) fires only on pick.
 */
export default function ComboBox({ value, onChange, onSelect, options = [], placeholder = "", className = "" }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const normalized = useMemo(
    () => options.map((o) => (typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value, data: o.data ?? o })),
    [options]
  );

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const matches = useMemo(() => {
    const q = (value || "").toLowerCase().trim();
    return normalized.filter((o) => !q || o.label.toLowerCase().includes(q)).slice(0, 80);
  }, [value, normalized]);

  const pick = (o) => {
    onChange?.(o.label);
    onSelect?.(o);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="flex">
        <input
          value={value || ""}
          onChange={(e) => { onChange?.(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 min-w-0 h-7 px-2 bg-mdt-surface border border-mdt-line-2 rounded-none text-[12.5px] text-mdt-text placeholder:text-mdt-dim outline-none focus:border-mdt-accent"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="h-7 w-7 flex-shrink-0 flex items-center justify-center border border-l-0 border-mdt-line-2 bg-mdt-surface text-mdt-dim hover:text-mdt-text"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 max-h-52 overflow-auto mdt-scroll border border-mdt-line-2 bg-mdt-surface shadow-lg">
          {matches.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => pick(o)}
              className="w-full text-left px-2 h-7 text-[12.5px] text-mdt-text hover:bg-mdt-surface-3 truncate"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}