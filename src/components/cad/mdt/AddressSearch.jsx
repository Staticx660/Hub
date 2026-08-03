import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, MapPin, ChevronDown } from "lucide-react";

let addressCache = null;

/** Type-in + dropdown location picker. Free text is always allowed; the dropdown
 *  lists saved addresses so users can auto-fill instead of typing. */
export default function AddressSearch({ value, onChange, placeholder, className }) {
  const [query, setQuery] = useState(value || "");
  const [all, setAll] = useState(addressCache || []);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ensureCache = async () => {
    if (addressCache !== null) { setAll(addressCache); return addressCache; }
    setLoading(true);
    try {
      addressCache = await base44.entities.Address.list('-created_date', 5000);
    } catch (e) { addressCache = []; }
    setAll(addressCache);
    setLoading(false);
    return addressCache;
  };

  const filter = (list, q) => {
    const term = (q || "").toLowerCase().trim();
    return list.filter((a) => !term || a.street_name?.toLowerCase().includes(term)).slice(0, 50);
  };

  const search = async (q) => {
    setQuery(q);
    onChange?.(q);
    setShowResults(true);
    const list = await ensureCache();
    setResults(filter(list, q));
  };

  const openList = async () => {
    setShowResults(true);
    const list = await ensureCache();
    setResults(filter(list, query));
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
          onFocus={openList}
          placeholder={placeholder || "Type or pick a location..."}
          className={className || "w-full bg-slate-800 border border-slate-700 text-white text-sm h-9 rounded-md pl-8 pr-8 focus-visible:ring-1 focus-visible:ring-slate-600 placeholder:text-slate-600"}
        />
        <button
          type="button"
          onClick={() => (showResults ? setShowResults(false) : openList())}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
      {showResults && (loading || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-xl max-h-48 overflow-y-auto">
          {loading && <div className="px-3 py-2 text-xs text-slate-500">Loading locations...</div>}
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => select(r.street_name)}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
            >
              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
              {r.street_name}
            </button>
          ))}
        </div>
      )}
      {showResults && !loading && results.length === 0 && all.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-xl px-3 py-2 text-xs text-slate-500">
          No saved match — your typed location will be used.
        </div>
      )}
    </div>
  );
}