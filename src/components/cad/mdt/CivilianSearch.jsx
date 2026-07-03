import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X, User } from "lucide-react";

export default function CivilianSearch({ onSelected, selected }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const parts = query.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");
      const res = await base44.functions.invoke('searchCADRecords', {
        searchType: "person", firstName, lastName, exact: false,
      });
      setResults(res.data.results || []);
    } catch (e) { /* */ }
    setSearching(false);
  };

  const select = (civilian) => {
    onSelected(civilian);
    setResults([]);
    setQuery("");
  };

  if (selected) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-white font-medium">{selected.first_name} {selected.last_name}</span>
          <span className="text-xs text-slate-400">DOB: {selected.dob || "N/A"}</span>
        </div>
        <button onClick={() => onSelected(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div>
      <Label className="text-slate-300">Search Civilian to Import</Label>
      <div className="flex gap-2 mt-1">
        <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); search(); } }} className="bg-slate-800 border-slate-700 text-white" placeholder="Search by name..." />
        <Button onClick={search} disabled={searching} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"><Search className="w-3.5 h-3.5" /> {searching ? "..." : "Search"}</Button>
      </div>
      {results.length > 0 && (
        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
          {results.map(c => (
            <button key={c.id} onClick={() => select(c)} className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-2 hover:border-blue-500/50 text-left">
              <div>
                <p className="text-sm text-white">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-slate-500">DOB: {c.dob || "N/A"} · {c.gender || "N/A"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}