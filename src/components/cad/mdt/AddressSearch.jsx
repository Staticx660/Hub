import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, MapPin } from "lucide-react";

let addressCache = null;

export default function AddressSearch({ value, onChange, placeholder, className }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ensureCache = async () => {
    if (addressCache !== null) return addressCache;
    try {
      addressCache = await base44.entities.Address.list('-created_date', 5000);
    } catch (e) { addressCache = []; }
    return addressCache;
  };

  const search = (q) => {
    setQuery(q);
    onChange?.(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const all = await ensureCache();
      const filtered = all.filter(a => a.street_name?.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
      setResults(filtered);
      setShowResults(true);
      setLoading(false);
    }, 300);
  };

  const select = (street) => {
    setQuery(street);
    onChange?.(street);
    setShowResults(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
          placeholder={placeholder || "Search address..."}
          className={className || "w-full bg-slate-800 border border-slate-700 text-white text-sm h-9 rounded-md pl-8 pr-2 focus-visible:ring-1 focus-visible:ring-slate-600 placeholder:text-slate-600"}
        />
      </div>
      {showResults && (loading || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-xl max-h-48 overflow-y-auto">
          {loading && <div className="px-3 py-2 text-xs text-slate-500">Searching...</div>}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => select(r.street_name)}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
            >
              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
              {r.street_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}