import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search, History, User, Car, Crosshair, X, Ban, ShieldCheck, FileText } from "lucide-react";

const searchTypes = [
  { value: "person", label: "Person Name", icon: User },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "firearm", label: "Firearm", icon: Crosshair },
];

export default function LookupPanel({ department, session }) {
  const [searchType, setSearchType] = useState("person");
  const [exact, setExact] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", dob: "", plate: "", serial: "" });
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [warrants, setWarrants] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem("cad_search_history") || "[]"));
  }, []);

  const saveHistory = (type, label) => {
    const entry = { type, label, timestamp: new Date().toISOString() };
    const updated = [entry, ...history].slice(0, 15);
    setHistory(updated);
    localStorage.setItem("cad_search_history", JSON.stringify(updated));
  };

  const match = (field, query) => {
    if (!query) return true;
    return exact ? field === query : field?.toLowerCase().includes(query.toLowerCase());
  };

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);
    try {
      let found = [];
      if (searchType === "person") {
        const all = await base44.entities.Civilian.list();
        found = all.filter((c) => match(c.first_name, form.firstName) && match(c.last_name, form.lastName) && (!form.dob || c.dob === form.dob));
        if (found.length > 0) saveHistory("person", `${found[0].first_name} ${found[0].last_name}`);
      } else if (searchType === "vehicle") {
        const all = await base44.entities.CivilianVehicle.list();
        found = all.filter((v) => match(v.plate, form.plate));
        if (found.length > 0) saveHistory("vehicle", found[0].plate);
      } else if (searchType === "firearm") {
        const all = await base44.entities.Firearm.list();
        found = all.filter((f) => match(f.serial_number, form.serial));
        if (found.length > 0) saveHistory("firearm", found[0].serial_number);
      }
      setResults(found);
      setSelected(null);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSearching(false);
  };

  const selectPerson = async (person) => {
    setSelected({ type: "person", data: person });
    const [w, v] = await Promise.all([
      base44.entities.Warrant.filter({ person_id: person.id, status: "Active" }),
      base44.entities.CivilianVehicle.filter({ owner_id: person.id }),
    ]);
    setWarrants(w);
    setVehicles(v);
  };

  const toggleLicense = async (field) => {
    const current = selected.data[field];
    const newStatus = current === "Valid" ? "Suspended" : "Valid";
    await base44.entities.Civilian.update(selected.data.id, { [field]: newStatus });
    setSelected({ ...selected, data: { ...selected.data, [field]: newStatus } });
    toast({ title: `${field.replace(/_/g, " ")} ${newStatus === "Suspended" ? "Suspended" : "Restored"}` });
  };

  const licenseBadge = (status) => {
    const colors = { Valid: "text-green-400 bg-green-500/10", Suspended: "text-red-400 bg-red-500/10", Revoked: "text-red-500 bg-red-500/10", None: "text-slate-500 bg-slate-700" };
    return colors[status] || colors.None;
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Search Form */}
      <div className="w-72 border-r border-slate-800 bg-slate-900/50 p-4 overflow-y-auto flex-shrink-0">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Search Types</h3>
        <div className="space-y-1 mb-4">
          {searchTypes.map((t) => (
            <button key={t.value} onClick={() => { setSearchType(t.value); setResults([]); setSelected(null); setSearched(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${searchType === t.value ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:bg-slate-800"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-4">
          {searchType === "person" && (
            <>
              <div><Label className="text-slate-400 text-xs">First Name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-8" /></div>
              <div><Label className="text-slate-400 text-xs">Last Name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-8" /></div>
              <div><Label className="text-slate-400 text-xs">Date of Birth</Label><Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-8" /></div>
            </>
          )}
          {searchType === "vehicle" && <div><Label className="text-slate-400 text-xs">Plate Number</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-8 uppercase" placeholder="ABC123" /></div>}
          {searchType === "firearm" && <div><Label className="text-slate-400 text-xs">Serial Number</Label><Input value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-8" /></div>}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setExact(false)} className={`flex-1 text-xs py-1.5 rounded-md ${!exact ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"}`}>Partial</button>
          <button onClick={() => setExact(true)} className={`flex-1 text-xs py-1.5 rounded-md ${exact ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"}`}>Exact</button>
        </div>

        <Button onClick={handleSearch} disabled={searching} className="w-full bg-blue-600 hover:bg-blue-700 gap-2 mb-4"><Search className="w-4 h-4" /> {searching ? "Searching..." : "Search"}</Button>

        <div className="border-t border-slate-800 pt-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><History className="w-3 h-3" /> Search History</h4>
          {history.length === 0 ? <p className="text-xs text-slate-600">No recent searches</p> : (
            <div className="space-y-1">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400 px-2 py-1 rounded hover:bg-slate-800">
                  {searchTypes.find((t) => t.value === h.type)?.icon && (() => { const Icon = searchTypes.find((t) => t.value === h.type).icon; return <Icon className="w-3 h-3" />; })()}
                  <span className="truncate">{h.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area - Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!searched ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Search className="w-16 h-16 mb-3 opacity-30" />
            <p>Enter search criteria and click Search</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600"><p>No results found</p></div>
        ) : !selected ? (
          <div className="space-y-2">
            <h3 className="text-sm text-slate-400 mb-3">{results.length} result{results.length !== 1 ? "s" : ""} found</h3>
            {results.map((r) => {
              const label = searchType === "person" ? `${r.first_name} ${r.last_name}` : searchType === "vehicle" ? `${r.plate} — ${r.model || "Unknown"}` : r.serial_number;
              const sub = searchType === "person" ? `DOB: ${r.dob || "Unknown"}` : searchType === "vehicle" ? `Owner: ${r.owner_name || "Unknown"}` : `Model: ${r.model || "Unknown"}`;
              return (
                <button key={r.id} onClick={() => (searchType === "person" ? selectPerson(r) : setSelected({ type: searchType, data: r }))} className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors text-left">
                  <div><p className="text-white font-medium">{label}</p><p className="text-xs text-slate-500">{sub}</p></div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4"><X className="w-4 h-4" /> Back to results</button>
            {selected.type === "person" && <PersonDetail person={selected.data} warrants={warrants} vehicles={vehicles} onToggleLicense={toggleLicense} licenseBadge={licenseBadge} />}
            {selected.type === "vehicle" && <VehicleDetail vehicle={selected.data} />}
            {selected.type === "firearm" && <FirearmDetail firearm={selected.data} />}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronRight({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>; }

function PersonDetail({ person, warrants, vehicles, onToggleLicense, licenseBadge }) {
  const licenses = [
    { field: "drivers_license_status", label: "Driver's License" },
    { field: "weapon_license_status", label: "Weapon License" },
    { field: "pilot_license_status", label: "Pilot License" },
    { field: "hunting_license_status", label: "Hunting License" },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-start gap-4">
          {person.photo_url ? <img src={person.photo_url} className="w-20 h-20 rounded-lg object-cover" alt="" /> : <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center"><User className="w-8 h-8 text-slate-600" /></div>}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{person.first_name} {person.last_name}</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
              <span className="text-slate-500">DOB: <span className="text-slate-300">{person.dob || "Unknown"}</span></span>
              <span className="text-slate-500">Gender: <span className="text-slate-300">{person.gender || "Unknown"}</span></span>
              <span className="text-slate-500">Phone: <span className="text-slate-300">{person.phone || "None"}</span></span>
              <span className="text-slate-500">Address: <span className="text-slate-300">{person.address || "Unknown"}</span></span>
            </div>
          </div>
        </div>
        {person.description && <p className="text-sm text-slate-400 mt-3">{person.description}</p>}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Licenses</h3>
        <div className="grid grid-cols-2 gap-3">
          {licenses.map((l) => (
            <div key={l.field} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${licenseBadge(person[l.field])}`}>{person[l.field]}</span>
                <span className="text-sm text-slate-300">{l.label}</span>
              </div>
              {person[l.field] !== "None" && <button onClick={() => onToggleLicense(l.field)} className={`p-1.5 rounded ${person[l.field] === "Suspended" ? "text-green-400 hover:bg-green-500/10" : "text-red-400 hover:bg-red-500/10"}`} title={person[l.field] === "Suspended" ? "Restore" : "Suspend"}>{person[l.field] === "Suspended" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}</button>}
            </div>
          ))}
        </div>
      </div>

      {warrants.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Ban className="w-4 h-4" /> Active Warrants ({warrants.length})</h3>
          <div className="space-y-2">{warrants.map((w) => <div key={w.id} className="bg-slate-800/50 rounded-lg p-3"><p className="text-sm text-white font-medium">{w.reason}</p>{w.charges?.length > 0 && <p className="text-xs text-slate-400 mt-1">Charges: {w.charges.join(", ")}</p>}{w.bail_amount && <p className="text-xs text-yellow-400 mt-1">Bail: ${w.bail_amount}</p>}</div>)}</div>
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Car className="w-4 h-4" /> Registered Vehicles ({vehicles.length})</h3>
          <div className="space-y-2">{vehicles.map((v) => <div key={v.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3"><div><span className="font-mono text-white font-semibold">{v.plate}</span><span className="text-sm text-slate-400 ml-2">{v.model}</span></div><div className="flex gap-2"><span className={`text-xs px-2 py-0.5 rounded-full ${v.is_stolen ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-slate-700"}`}>{v.is_stolen ? "STOLEN" : v.registration_status}</span></div></div>)}</div>
        </div>
      )}

      {person.notes && <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Notes</h3><p className="text-sm text-slate-300">{person.notes}</p></div>}
    </div>
  );
}

function VehicleDetail({ vehicle }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-4 mb-4"><div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center"><Car className="w-8 h-8 text-slate-600" /></div><div><h2 className="text-xl font-bold text-white font-mono">{vehicle.plate}</h2><p className="text-sm text-slate-400">{vehicle.model} · {vehicle.color}</p></div></div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-slate-500">Owner: </span><span className="text-slate-300">{vehicle.owner_name || "Unknown"}</span></div>
        <div><span className="text-slate-500">Registration: </span><span className={`px-2 py-0.5 rounded-full text-xs ${vehicle.registration_status === "Valid" ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{vehicle.registration_status}</span></div>
        <div><span className="text-slate-500">Insurance: </span><span className={`px-2 py-0.5 rounded-full text-xs ${vehicle.insurance_status === "Valid" ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{vehicle.insurance_status}</span></div>
        <div><span className="text-slate-500">Stolen: </span><span className={`px-2 py-0.5 rounded-full text-xs ${vehicle.is_stolen ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-slate-700"}`}>{vehicle.is_stolen ? "YES" : "No"}</span></div>
      </div>
      {vehicle.notes && <p className="text-sm text-slate-400 mt-4">{vehicle.notes}</p>}
    </div>
  );
}

function FirearmDetail({ firearm }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-4 mb-4"><div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center"><Crosshair className="w-8 h-8 text-slate-600" /></div><div><h2 className="text-xl font-bold text-white font-mono">{firearm.serial_number}</h2><p className="text-sm text-slate-400">{firearm.model} · {firearm.caliber}</p></div></div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-slate-500">Manufacturer: </span><span className="text-slate-300">{firearm.manufacturer || "Unknown"}</span></div>
        <div><span className="text-slate-500">Owner: </span><span className="text-slate-300">{firearm.owner_name || "Unknown"}</span></div>
        <div><span className="text-slate-500">Registered: </span><span className={`px-2 py-0.5 rounded-full text-xs ${firearm.is_registered ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{firearm.is_registered ? "Yes" : "No"}</span></div>
        <div><span className="text-slate-500">Stolen: </span><span className={`px-2 py-0.5 rounded-full text-xs ${firearm.is_stolen ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-slate-700"}`}>{firearm.is_stolen ? "YES" : "No"}</span></div>
      </div>
      {firearm.notes && <p className="text-sm text-slate-400 mt-4">{firearm.notes}</p>}
    </div>
  );
}