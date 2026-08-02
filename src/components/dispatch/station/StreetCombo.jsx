import React, { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/** Type-in + dropdown street picker. Suggestions render directly below the field. */
export default function StreetCombo({ value, onChange, streets = [], placeholder = "", className = "" }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const matches = useMemo(() => {
    const q = (value || "").toLowerCase();
    return streets.filter((s) => !q || s.toLowerCase().includes(q)).slice(0, 60);
  }, [value, streets]);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="flex">
        <input
          value={value || ""}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 h-7 px-2 bg-mdt-surface-3 border border-mdt-line-2 rounded-none text-[12px] text-mdt-text outline-none focus:border-mdt-accent"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="h-7 w-7 flex items-center justify-center border border-l-0 border-mdt-line-2 bg-mdt-surface-3 text-mdt-dim hover:text-mdt-text"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 max-h-52 overflow-auto mdt-scroll border border-mdt-line-2 bg-mdt-surface shadow-lg">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-2 h-7 text-[12px] text-mdt-text hover:bg-mdt-surface-3 truncate"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}