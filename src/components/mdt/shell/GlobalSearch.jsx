import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, User, Car, Gavel, Eye, Radio, FileText, Loader2 } from "lucide-react";

const KIND = {
  person: { icon: User, label: "Person" },
  vehicle: { icon: Car, label: "Vehicle" },
  call: { icon: Radio, label: "Call" },
  warrant: { icon: Gavel, label: "Warrant" },
  bolo: { icon: Eye, label: "BOLO" },
  report: { icon: FileText, label: "Report" },
};

/** Global search across every record type. ⌘K / Ctrl+K from anywhere. */
export default function GlobalSearch({ open, onOpenChange, onPick }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => { if (open) { setQ(""); setResults([]); } }, [open]);

  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) { setResults([]); return; }
    let live = true;
    setBusy(true);
    const t = setTimeout(async () => {
      const [people, vehicles, calls, warrants, bolos, reports] = await Promise.all([
        base44.entities.Civilian.list("-updated_date", 200),
        base44.entities.CivilianVehicle.list("-updated_date", 200),
        base44.entities.ActiveCall.list("-created_date", 100),
        base44.entities.Warrant.list("-created_date", 100),
        base44.entities.BOLO.list("-created_date", 100),
        base44.entities.CADReport.list("-created_date", 100),
      ]);
      if (!live) return;
      const hit = (s) => String(s || "").toLowerCase().includes(term);
      const out = [
        ...people.filter((p) => hit(`${p.first_name} ${p.last_name}`) || hit(p.drivers_license_number) || hit(p.phone))
          .map((p) => ({ id: p.id, kind: "person", title: `${p.first_name} ${p.last_name}`, sub: `DOB ${p.dob || "—"} · ${p.address || "no address"}`, record: p })),
        ...vehicles.filter((v) => hit(v.plate) || hit(v.make) || hit(v.model) || hit(v.owner_name))
          .map((v) => ({ id: v.id, kind: "vehicle", title: v.plate, sub: `${v.color || ""} ${v.make || ""} ${v.model || ""} · ${v.owner_name || "unknown owner"}`, record: v })),
        ...calls.filter((c) => hit(c.call_type) || hit(c.location) || hit(c.run_number) || hit(c.caller_name))
          .map((c) => ({ id: c.id, kind: "call", title: `${c.run_number || "CALL"} — ${c.call_type}`, sub: `${c.location || "unknown"} · ${c.status}`, record: c })),
        ...warrants.filter((w) => hit(w.person_name) || hit(w.reason))
          .map((w) => ({ id: w.id, kind: "warrant", title: w.person_name, sub: `${w.reason} · ${w.status}`, record: w })),
        ...bolos.filter((b) => hit(b.title) || hit(b.description) || hit(b.person_name) || hit(b.plate))
          .map((b) => ({ id: b.id, kind: "bolo", title: b.title || b.person_name || "BOLO", sub: b.description || "", record: b })),
        ...reports.filter((r) => hit(r.title) || hit(r.run_number) || hit(r.linked_civilian_name))
          .map((r) => ({ id: r.id, kind: "report", title: r.title, sub: `${r.report_type} · ${r.status}`, record: r })),
      ].slice(0, 40);
      setResults(out);
      setBusy(false);
    }, 180);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] bg-black/60" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-2xl bg-mdt-surface border border-mdt-line-2 flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 h-10 px-3 border-b border-mdt-line">
          {busy ? <Loader2 className="w-4 h-4 text-mdt-dim animate-spin" /> : <Search className="w-4 h-4 text-mdt-dim" />}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, vehicles, calls, warrants, BOLOs, reports…"
            className="flex-1 bg-transparent text-[13px] text-mdt-text placeholder:text-mdt-dim outline-none"
          />
          <kbd className="font-mono text-[10px] text-mdt-dim">ESC</kbd>
        </div>
        <div className="flex-1 overflow-auto mdt-scroll">
          {q.trim().length < 2 ? (
            <p className="p-3 text-[12px] text-mdt-dim">Type at least two characters. Search covers every record in the system.</p>
          ) : results.length === 0 && !busy ? (
            <p className="p-3 text-[12px] text-mdt-dim">No matches.</p>
          ) : (
            results.map((r) => {
              const K = KIND[r.kind];
              return (
                <button
                  key={`${r.kind}-${r.id}`}
                  onClick={() => { onPick?.(r); onOpenChange(false); }}
                  className="w-full flex items-center gap-2.5 px-3 h-9 border-b border-mdt-line/60 text-left hover:bg-mdt-surface-3"
                >
                  <K.icon className="w-3.5 h-3.5 text-mdt-dim flex-shrink-0" />
                  <span className="text-[12.5px] text-mdt-text truncate">{r.title}</span>
                  <span className="text-[11.5px] text-mdt-dim truncate flex-1">{r.sub}</span>
                  <span className="text-[9.5px] uppercase tracking-wider text-mdt-dim flex-shrink-0">{K.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}