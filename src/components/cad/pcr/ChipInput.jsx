import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

export default function ChipInput({ values = [], onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} className="bg-slate-800 border-slate-700 text-white h-9" placeholder={placeholder} />
        <button type="button" onClick={add} className="px-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"><Plus className="w-4 h-4" /></button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v, i) => (
            <span key={i} className="flex items-center gap-1 bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded-full border border-slate-700">{v}<button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button></span>
          ))}
        </div>
      )}
    </div>
  );
}