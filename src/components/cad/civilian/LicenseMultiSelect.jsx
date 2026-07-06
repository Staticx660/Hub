import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export default function LicenseMultiSelect({ label, icon: Icon, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-medium text-slate-300">
        <span className="flex items-center gap-2">{Icon && <Icon className="w-4 h-4" />}{label} ({selected.length})</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer hover:text-white">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])} className="rounded border-slate-600" />
              {opt}
            </label>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
              {tag}
              <button onClick={() => onChange(selected.filter(s => s !== tag))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}