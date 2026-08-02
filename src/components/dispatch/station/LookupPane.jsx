import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, User, Car, AlertTriangle } from "lucide-react";
import { Btn, StatusPill, Field } from "@/components/mdt/ui/primitives";
import { useToast } from "@/components/ui/use-toast";

const input = "h-7 px-2 bg-mdt-bg border border-mdt-line-2 text-[12px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";

/** Dispatcher lookups — civilian & vehicle queries against CAD records. */
export default function LookupPane() {
  const { toast } = useToast();
  const [mode, setMode] = useState("person");
  const [q, setQ] = useState({ firstName: "", lastName: "", plate: "" });
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const call = async (payload) => {
    const res = await base44.functions.invoke("searchCADRecords", payload);
    return res.data || res;
  };

  const runSearch = async () => {
    setBusy(true); setDetail(null);
    try {
      const data = mode === "person"
        ? await call({ searchType: "person", firstName: q.firstName, lastName: q.lastName })
        : await call({ searchType: "vehicle", plate: q.plate });
      setRows(data.results || []);
    } catch (e) { toast({ title: "Lookup failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  const openRow = async (row) => {
    setBusy(true);
    try {
      const data = mode === "person"
        ? await call({ searchType: "person", personId: row.id, personName: `${row.first_name} ${row.last_name}` })
        : await call({ searchType: "vehicle", vehicleId: row.id, vehiclePlate: row.plate });
      setDetail({ row, ...data });
    } catch (e) { toast({ title: "Lookup failed", description: e.message, variant: "destructive" }); }
    setBusy(false);
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="w-[340px] flex-shrink-0 border-r border-mdt-line flex flex-col min-h-0">
        <div className="flex items-center gap-1.5 h-8 px-2 border-b border-mdt-line bg-mdt-surface-2">
          <Btn variant={mode === "person" ? "primary" : "ghost"} icon={User} onClick={() => { setMode("person"); setRows([]); setDetail(null); }}>Person</Btn>
          <Btn variant={mode === "vehicle" ? "primary" : "ghost"} icon={Car} onClick={() => { setMode("vehicle"); setRows([]); setDetail(null); }}>Vehicle</Btn>
        </div>
        <div className="flex items-center gap-1.5 p-2 border-b border-mdt-line">
          {mode === "person" ? (
            <>
              <input className={`${input} w-full`} placeholder="First name" value={q.firstName} onChange={(e) => setQ({ ...q, firstName: e.target.value })} />
              <input className={`${input} w-full`} placeholder="Last name" value={q.lastName} onChange={(e) => setQ({ ...q, lastName: e.target.value })} />
            </>
          ) : (
            <input className={`${input} w-full font-mono uppercase`} placeholder="Plate" value={q.plate} onChange={(e) => setQ({ ...q, plate: e.target.value })} />
          )}
          <Btn variant="primary" icon={Search} disabled={busy} onClick={runSearch}>Run</Btn>
        </div>
        <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
          {rows.length === 0 && <p className="p-2 text-[11.5px] text-mdt-dim">No results — run a query.</p>}
          {rows.map((r) => (
            <button key={r.id} onClick={() => openRow(r)}
              className={`w-full text-left px-2 h-7 flex items-center gap-2 border-b border-mdt-line/60 ${detail?.row?.id === r.id ? "bg-mdt-accent/15" : "hover:bg-mdt-surface-3/60"}`}>
              {mode === "person" ? (
                <>
                  <span className="text-[12px] truncate">{r.first_name} {r.last_name}</span>
                  <span className="ml-auto text-[11px] font-mono text-mdt-dim">{r.dob || "—"}</span>
                </>
              ) : (
                <>
                  <span className="text-[12px] font-mono truncate">{r.plate}</span>
                  <span className="ml-auto text-[11px] text-mdt-dim truncate">{r.make} {r.model}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-auto mdt-scroll p-2.5">
        {!detail ? (
          <p className="text-[12px] text-mdt-dim">Select a record to view details.</p>
        ) : mode === "person" ? (
          <PersonDetail d={detail} />
        ) : (
          <VehicleDetail d={detail} />
        )}
      </div>
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="border border-mdt-line bg-mdt-surface mb-2.5">
      <header className="h-7 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">{title}</h3>
        {count !== undefined && <span className="ml-auto text-[10px] font-mono text-mdt-dim">{count}</span>}
      </header>
      <div className="p-2.5">{children}</div>
    </section>
  );
}

function List({ items, empty, render }) {
  if (!items?.length) return <p className="text-[11.5px] text-mdt-dim">{empty}</p>;
  return <div className="space-y-1">{items.map((i) => <div key={i.id} className="text-[12px] text-mdt-text truncate">{render(i)}</div>)}</div>;
}

function PersonDetail({ d }) {
  const p = d.row;
  return (
    <>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[14px] font-semibold">{p.first_name} {p.last_name}</span>
        {d.warrants?.length > 0 && <StatusPill tone="crit"><AlertTriangle className="w-3 h-3" /> {d.warrants.length} Warrant{d.warrants.length > 1 ? "s" : ""}</StatusPill>}
      </div>
      <Section title="Identity">
        <div className="grid grid-cols-4 gap-2.5">
          <Field label="DOB" value={p.dob} />
          <Field label="Gender" value={p.gender} />
          <Field label="Phone" value={p.phone} />
          <Field label="Address" value={p.address} />
          <Field label="Driver" value={p.drivers_license_status} />
          <Field label="Weapons" value={p.weapon_license_status} />
          <Field label="Pilot" value={p.pilot_license_status} />
          <Field label="Hunting" value={p.hunting_license_status} />
        </div>
      </Section>
      <Section title="Warrants" count={d.warrants?.length || 0}>
        <List items={d.warrants} empty="No active warrants." render={(w) => `${w.reason}${w.bail_amount ? ` · $${w.bail_amount}` : ""}`} />
      </Section>
      <Section title="Registered Vehicles" count={d.vehicles?.length || 0}>
        <List items={d.vehicles} empty="No vehicles on file." render={(v) => `${v.plate} — ${v.make} ${v.model} (${v.color || "—"})`} />
      </Section>
      <Section title="BOLOs" count={d.bolos?.length || 0}>
        <List items={d.bolos} empty="No BOLOs." render={(b) => b.description || b.person_name} />
      </Section>
      <Section title="Reports" count={d.reports?.length || 0}>
        <List items={d.reports} empty="No linked reports." render={(r) => `${r.report_type} — ${r.title}`} />
      </Section>
    </>
  );
}

function VehicleDetail({ d }) {
  const v = d.row;
  return (
    <>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[14px] font-semibold font-mono">{v.plate}</span>
        {v.is_stolen && <StatusPill tone="crit"><AlertTriangle className="w-3 h-3" /> Stolen</StatusPill>}
      </div>
      <Section title="Registration">
        <div className="grid grid-cols-4 gap-2.5">
          <Field label="Make" value={v.make} />
          <Field label="Model" value={v.model} />
          <Field label="Color" value={v.color} />
          <Field label="Year" value={v.year} />
          <Field label="Owner" value={v.owner_name} />
          <Field label="Type" value={v.type} />
          <Field label="Registration" value={v.registration_status} />
          <Field label="Insurance" value={v.insurance_status} />
        </div>
      </Section>
      <Section title="BOLOs" count={d.bolos?.length || 0}>
        <List items={d.bolos} empty="No BOLOs." render={(b) => b.description || b.vehicle_plate} />
      </Section>
      <Section title="Reports" count={d.reports?.length || 0}>
        <List items={d.reports} empty="No linked reports." render={(r) => `${r.report_type} — ${r.title}`} />
      </Section>
    </>
  );
}