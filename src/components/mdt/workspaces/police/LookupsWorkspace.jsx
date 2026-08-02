import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import DataTable from "@/components/mdt/ui/DataTable";
import LookupDetail from "@/components/mdt/workspaces/police/LookupDetail";
import { Btn, EmptyState, StatusPill } from "@/components/mdt/ui/primitives";
import { Search, User, Car, Crosshair, History, X, Loader2 } from "lucide-react";

const TYPES = [
  { value: "person", label: "Person", icon: User },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "firearm", label: "Firearm", icon: Crosshair },
];
const LICENSE_FIELDS = ["drivers_license_status", "weapon_license_status", "pilot_license_status", "hunting_license_status"];
const INPUT = "h-7 px-2 bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";

/** NCIC-style lookup workspace: query strip, result table, full detail pane. */
export default function LookupsWorkspace({ session }) {
  const { toast } = useToast();
  const [searchType, setSearchType] = useState("person");
  const [exact, setExact] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", dob: "", plate: "", serial: "" });
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [firearms, setFirearms] = useState([]);
  const [reports, setReports] = useState([]);
  const [vehiclePriors, setVehiclePriors] = useState({ reports: [], bolos: [] });
  const [history, setHistory] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => { setHistory(JSON.parse(localStorage.getItem("cad_search_history") || "[]")); }, []);

  const saveHistory = (type, label, query) => {
    const updated = [{ type, label, query, timestamp: new Date().toISOString() }, ...history.filter((h) => h.label !== label)].slice(0, 15);
    setHistory(updated);
    localStorage.setItem("cad_search_history", JSON.stringify(updated));
  };

  const runSearch = async (type, query, exactVal) => {
    setSearching(true); setSearched(true); setSelected(null);
    try {
      const res = await base44.functions.invoke("searchCADRecords", {
        searchType: type,
        firstName: query.firstName, lastName: query.lastName, dob: query.dob,
        plate: query.plate, serial: query.serial, exact: exactVal !== undefined ? exactVal : exact,
      });
      const found = res.data.results || [];
      if (found.length > 0) {
        const label = type === "person" ? `${found[0].first_name} ${found[0].last_name}` : type === "vehicle" ? found[0].plate : found[0].serial_number;
        saveHistory(type, label, query);
      }
      setResults(found);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSearching(false);
  };

  const selectPerson = async (person) => {
    setSelected({ type: "person", data: person });
    try {
      const res = await base44.functions.invoke("searchCADRecords", { searchType: "person", personId: person.id, personName: `${person.first_name} ${person.last_name}` });
      setWarrants(res.data?.warrants || []); setVehicles(res.data?.vehicles || []);
      setFirearms(res.data?.firearms || []); setReports(res.data?.reports || []); setBolos(res.data?.bolos || []);
    } catch (e) { setWarrants([]); setVehicles([]); setFirearms([]); setReports([]); setBolos([]); }
  };

  const selectVehicle = async (vehicle) => {
    setSelected({ type: "vehicle", data: vehicle });
    setVehiclePriors({ reports: [], bolos: [] });
    try {
      const res = await base44.functions.invoke("searchCADRecords", { searchType: "vehicle", vehicleId: vehicle.id, vehiclePlate: vehicle.plate });
      setVehiclePriors({ reports: res.data?.reports || [], bolos: res.data?.bolos || [] });
    } catch (e) { /* no priors */ }
  };

  const openRow = (r) => {
    if (searchType === "person") selectPerson(r);
    else if (searchType === "vehicle") selectVehicle(r);
    else setSelected({ type: "firearm", data: r });
  };

  const lookupOwner = (ownerName) => {
    if (!ownerName) return;
    const parts = ownerName.trim().split(" ");
    const query = { firstName: parts[0] || "", lastName: parts.slice(1).join(" "), dob: "", plate: "", serial: "" };
    setSearchType("person"); setForm(query); runSearch("person", query, false);
  };

  const setLicenseStatus = async (field, status) => {
    await base44.entities.Civilian.update(selected.data.id, { [field]: status });
    setSelected({ ...selected, data: { ...selected.data, [field]: status } });
    toast({ title: `${field.replace(/_/g, " ")} set to ${status}` });
  };

  const suspendAllLicenses = async () => {
    const updates = {};
    LICENSE_FIELDS.forEach((f) => { if (selected.data[f] === "Valid") updates[f] = "Suspended"; });
    if (Object.keys(updates).length === 0) { toast({ title: "No valid licenses to suspend" }); return; }
    await base44.entities.Civilian.update(selected.data.id, updates);
    setSelected({ ...selected, data: { ...selected.data, ...updates } });
    toast({ title: "All licenses suspended" });
  };

  const columns = searchType === "person" ? [
    { key: "last_name", label: "Last Name", width: 150 },
    { key: "first_name", label: "First Name", width: 150 },
    { key: "dob", label: "DOB", width: 110 },
    { key: "gender", label: "Sex", width: 70 },
    { key: "address", label: "Address", width: 220 },
    { key: "drivers_license_status", label: "DL", width: 100, render: (r) => <StatusPill tone={r.drivers_license_status === "Valid" ? "ok" : r.drivers_license_status === "None" ? "neutral" : "crit"}>{r.drivers_license_status || "None"}</StatusPill> },
  ] : searchType === "vehicle" ? [
    { key: "plate", label: "Plate", width: 110, mono: true },
    { key: "make", label: "Make", width: 120 },
    { key: "model", label: "Model", width: 140 },
    { key: "color", label: "Color", width: 100 },
    { key: "owner_name", label: "Registered Owner", width: 180 },
    { key: "registration_status", label: "Reg", width: 90, render: (r) => <StatusPill tone={r.registration_status === "Valid" ? "ok" : "crit"}>{r.registration_status}</StatusPill> },
    { key: "is_stolen", label: "Flags", width: 90, render: (r) => (r.is_stolen ? <StatusPill tone="crit">Stolen</StatusPill> : "—") },
  ] : [
    { key: "serial_number", label: "Serial", width: 150, mono: true },
    { key: "model", label: "Model", width: 150 },
    { key: "caliber", label: "Caliber", width: 110 },
    { key: "owner_name", label: "Owner", width: 180 },
    { key: "is_registered", label: "Status", width: 120, render: (r) => <StatusPill tone={r.is_registered ? "ok" : "crit"}>{r.is_registered ? "Registered" : "Unregistered"}</StatusPill> },
  ];

  return (
    <>
      <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => { setSearchType(t.value); setResults([]); setSelected(null); setSearched(false); }}
            className={`flex items-center gap-1.5 h-6 px-2.5 border text-[12.5px] ${searchType === t.value ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-accent" : "bg-mdt-surface border-mdt-line text-mdt-text hover:bg-mdt-surface-3"}`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
        <div className="w-px h-5 bg-mdt-line" />
        {searchType === "person" && (
          <>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" className={`${INPUT} w-32`} onKeyDown={(e) => e.key === "Enter" && runSearch(searchType, form)} />
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" className={`${INPUT} w-32`} onKeyDown={(e) => e.key === "Enter" && runSearch(searchType, form)} />
            <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className={`${INPUT} w-36`} />
          </>
        )}
        {searchType === "vehicle" && (
          <input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="Plate" className={`${INPUT} w-36 uppercase font-mono`} onKeyDown={(e) => e.key === "Enter" && runSearch(searchType, form)} />
        )}
        {searchType === "firearm" && (
          <input value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} placeholder="Serial number" className={`${INPUT} w-44 font-mono`} onKeyDown={(e) => e.key === "Enter" && runSearch(searchType, form)} />
        )}
        <button onClick={() => setExact(!exact)} className={`h-6 px-2.5 border text-[12.5px] ${exact ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-accent" : "bg-mdt-surface border-mdt-line text-mdt-muted hover:bg-mdt-surface-3"}`}>
          {exact ? "Exact" : "Partial"}
        </button>
        <Btn variant="primary" icon={Search} onClick={() => runSearch(searchType, form)} disabled={searching}>{searching ? "Searching" : "Run Query"}</Btn>
        <div className="flex-1" />
        {selected && <Btn icon={X} onClick={() => setSelected(null)}>Close Record</Btn>}
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 flex flex-col border-r border-mdt-line">
          <div className="flex items-center gap-2 h-7 px-3 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">Results</span>
            <span className="text-[11px] text-mdt-muted">{searched ? `${results.length} record${results.length === 1 ? "" : "s"}` : "no query run"}</span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
            {searching ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-mdt-dim animate-spin" /></div>
            ) : !searched ? (
              <EmptyState icon={Search} title="Enter query criteria and run a search" hint="Person, vehicle, and firearm records" />
            ) : (
              <DataTable columns={columns} rows={results} selectedKey={selected?.data?.id} onRowClick={openRow} emptyMessage="No matching records" />
            )}
          </div>
          <div className="flex items-center gap-2 h-8 px-3 border-t border-mdt-line bg-mdt-surface-2 flex-shrink-0 overflow-x-auto mdt-scroll">
            <History className="w-3.5 h-3.5 text-mdt-dim flex-shrink-0" />
            {history.length === 0 ? <span className="text-[11px] text-mdt-dim">No recent queries</span> :
              history.map((h, i) => (
                <button key={i} onClick={() => { setSearchType(h.type); setForm(h.query); runSearch(h.type, h.query, false); }} className="h-5 px-2 border border-mdt-line bg-mdt-surface text-[11px] text-mdt-muted hover:text-mdt-text whitespace-nowrap">
                  {h.label}
                </button>
              ))}
          </div>
        </div>

        {selected && (
          <div className="w-[46%] min-w-[380px] flex flex-col bg-mdt-bg">
            <LookupDetail
              selected={selected}
              warrants={warrants}
              bolos={bolos}
              vehicles={vehicles}
              firearms={firearms}
              reports={reports}
              vehiclePriors={vehiclePriors}
              onSetLicense={setLicenseStatus}
              onSuspendAll={suspendAllLicenses}
              onLookupOwner={lookupOwner}
            />
          </div>
        )}
      </div>
    </>
  );
}