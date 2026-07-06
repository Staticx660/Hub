import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search, History, User, Car, Crosshair, X, Ban, FileText, Eye, Gavel, ArrowRight } from "lucide-react";

const searchTypes = [
  { value: "person", label: "Person Name", icon: User },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "firearm", label: "Firearm", icon: Crosshair },
];

const licenseStatuses = ["Valid", "Suspended", "Revoked", "None"];
const licenseFields = [
  { field: "drivers_license_status", label: "Driver's License" },
  { field: "weapon_license_status", label: "Weapon License" },
  { field: "pilot_license_status", label: "Pilot License" },
  { field: "hunting_license_status", label: "DCNR / Fish & Game" },
];

export default function LookupPanel({ department, session }) {
  const [searchType, setSearchType] = useState("person");
  const [exact, setExact] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", dob: "", plate: "", serial: "" });
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [warrants, setWarrants] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [firearms, setFirearms] = useState([]);
  const [personReports, setPersonReports] = useState([]);
  const [personBolos, setPersonBolos] = useState([]);
  const [vehiclePriors, setVehiclePriors] = useState({ reports: [], bolos: [] });
  const [history, setHistory] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem("cad_search_history") || "[]"));
  }, []);

  const saveHistory = (type, label, queryData) => {
    const entry = { type, label, query: queryData, timestamp: new Date().toISOString() };
    const updated = [entry, ...history.filter(h => h.label !== label)].slice(0, 15);
    setHistory(updated);
    localStorage.setItem("cad_search_history", JSON.stringify(updated));
  };

  const runSearch = async (type, query, exactVal) => {
    const useExact = exactVal !== undefined ? exactVal : exact;
    setSearching(true);
    setSearched(true);
    setSelected(null);
    try {
      const res = await base44.functions.invoke('searchCADRecords', {
        searchType: type,
        firstName: query.firstName, lastName: query.lastName, dob: query.dob,
        plate: query.plate, serial: query.serial, exact: useExact,
      });
      const found = res.data.results || [];
      if (found.length > 0) {
        const label = type === "person" ? `${found[0].first_name} ${found[0].last_name}` : type === "vehicle" ? found[0].plate : found[0].serial_number;
        saveHistory(type, label, query);
      }
      setResults(found);
      setSelected(null);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSearching(false);
  };

  const handleSearch = () => runSearch(searchType, form, exact);

  const handleHistoryClick = (entry) => {
    if (!entry?.query) { toast({ title: "Invalid history entry" }); return; }
    setSearchType(entry.type);
    setForm(entry.query);
    runSearch(entry.type, entry.query, false);
  };

  const selectPerson = async (person) => {
    setSelected({ type: "person", data: person });
    try {
      const res = await base44.functions.invoke('searchCADRecords', {
        searchType: "person", personId: person.id, personName: `${person.first_name} ${person.last_name}`,
      });
      setWarrants(res.data?.warrants || []);
      setVehicles(res.data?.vehicles || []);
      setFirearms(res.data?.firearms || []);
      setPersonReports(res.data?.reports || []);
      setPersonBolos(res.data?.bolos || []);
    } catch (e) {
      setWarrants([]); setVehicles([]); setFirearms([]); setPersonReports([]); setPersonBolos([]);
    }
  };

  const selectVehicle = async (vehicle) => {
    setSelected({ type: "vehicle", data: vehicle });
    setVehiclePriors({ reports: [], bolos: [] });
    try {
      const res = await base44.functions.invoke('searchCADRecords', {
        searchType: "vehicle", vehicleId: vehicle.id, vehiclePlate: vehicle.plate,
      });
      setVehiclePriors({ reports: res.data?.reports || [], bolos: res.data?.bolos || [] });
    } catch (e) { /* */ }
  };

  const lookupOwner = async (ownerName) => {
    if (!ownerName) return;
    const parts = ownerName.trim().split(" ");
    const query = { firstName: parts[0] || "", lastName: parts.slice(1).join(" "), dob: "", plate: "", serial: "" };
    setSearchType("person");
    setForm(query);
    runSearch("person", query);
  };

  const setLicenseStatus = async (field, status) => {
    await base44.entities.Civilian.update(selected.data.id, { [field]: status });
    setSelected({ ...selected, data: { ...selected.data, [field]: status } });
    toast({ title: `${field.replace(/_/g, " ")} set to ${status}` });
  };

  const suspendAllLicenses = async () => {
    const updates = {};
    for (const l of licenseFields) {
      if (selected.data[l.field] === "Valid") updates[l.field] = "Suspended";
    }
    if (Object.keys(updates).length === 0) { toast({ title: "No valid licenses to suspend" }); return; }
    await base44.entities.Civilian.update(selected.data.id, updates);
    setSelected({ ...selected, data: { ...selected.data, ...updates } });
    toast({ title: "All licenses suspended" });
  };

  const licenseBadge = (status) => {
    const colors = { Valid: "text-green-400 bg-green-500/10", Suspended: "text-red-400 bg-red-500/10", Revoked: "text-red-500 bg-red-500/10", None: "text-slate-500 bg-slate-700" };
    return colors[status] || colors.None;
  };

  return (
    <div className="flex h-full">
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
              {history.map((h, i) => {
                const Icon = searchTypes.find((t) => t.value === h.type)?.icon || Search;
                return (
                  <button key={i} onClick={() => handleHistoryClick(h)} className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-slate-800 transition-colors">
                    <Icon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate flex-1 text-left">{h.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!searched ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Search className="w-16 h-16 mb-3 opacity-30" />
            <p>Enter search criteria and click Search</p>
          </div>
        ) : searching ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600"><p>No results found</p></div>
        ) : !selected ? (
          <div className="space-y-2">
            <h3 className="text-sm text-slate-400 mb-3">{results.length} result{results.length !== 1 ? "s" : ""} found</h3>
            {results.map((r) => {
              const label = searchType === "person" ? `${r.first_name} ${r.last_name}` : searchType === "vehicle" ? `${r.plate} — ${r.model || "Unknown"}` : r.serial_number;
              const sub = searchType === "person" ? `DOB: ${r.dob || "Unknown"}` : searchType === "vehicle" ? `Owner: ${r.owner_name || "Unknown"}` : `Model: ${r.model || "Unknown"}`;
              return (
                <button key={r.id} onClick={() => (searchType === "person" ? selectPerson(r) : searchType === "vehicle" ? selectVehicle(r) : setSelected({ type: searchType, data: r }))} className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors text-left">
                  <div><p className="text-white font-medium">{label}</p><p className="text-xs text-slate-500">{sub}</p></div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4"><X className="w-4 h-4" /> Back to results</button>
            {selected.type === "person" && (
              <PersonDetail person={selected.data} warrants={warrants} vehicles={vehicles} firearms={firearms} reports={personReports} bolos={personBolos} onSetLicense={setLicenseStatus} onSuspendAll={suspendAllLicenses} licenseBadge={licenseBadge} />
            )}
            {selected.type === "vehicle" && (
              <VehicleDetail vehicle={selected.data} priors={vehiclePriors} onLookupOwner={lookupOwner} />
            )}
            {selected.type === "firearm" && <FirearmDetail firearm={selected.data} />}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronRight({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>; }

function PersonDetail({ person, warrants, vehicles, firearms, reports, bolos, onSetLicense, onSuspendAll, licenseBadge }) {
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
              <span className="text-slate-500">Race: <span className="text-slate-300">{person.race || "Unknown"}</span></span>
              <span className="text-slate-500">Address: <span className="text-slate-300">{person.address || "Unknown"}{person.zip_code ? `, ${person.zip_code}` : ""}</span></span>
              <span className="text-slate-500">Occupation: <span className="text-slate-300">{person.occupation || "Unknown"}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Licenses</h3>
          <button onClick={onSuspendAll} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Suspend All</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {licenseFields.map((l) => (
            <div key={l.field} className="bg-slate-800/50 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-300">{l.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${licenseBadge(person[l.field])}`}>{person[l.field] || "None"}</span>
              </div>
              {person[l.field] === "Valid" ? (
                <button onClick={() => onSetLicense(l.field, "Suspended")} className="w-full text-xs py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Suspend</button>
              ) : (
                <div className="text-xs text-slate-500 text-center py-1">View only</div>
              )}
            </div>
          ))}
        </div>

        {(person.drivers_license_types?.length > 0 || person.pilot_license_endorsements?.length > 0 || person.weapon_license_types?.length > 0 || person.hunting_license_types?.length > 0 || person.hunting_license_stamps?.length > 0) && (
          <div className="mt-3 space-y-2">
            {person.drivers_license_types?.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-slate-500 min-w-[120px]">DL Types:</span>
                <div className="flex flex-wrap gap-1">{person.drivers_license_types.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{t}</span>)}</div>
              </div>
            )}
            {person.pilot_license_endorsements?.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-slate-500 min-w-[120px]">Pilot Endorsements:</span>
                <div className="flex flex-wrap gap-1">{person.pilot_license_endorsements.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{t}</span>)}</div>
              </div>
            )}
            {person.weapon_license_types?.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-slate-500 min-w-[120px]">Weapon Types:</span>
                <div className="flex flex-wrap gap-1">{person.weapon_license_types.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{t}</span>)}</div>
              </div>
            )}
            {person.hunting_license_types?.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-slate-500 min-w-[120px]">DCNR Types:</span>
                <div className="flex flex-wrap gap-1">{person.hunting_license_types.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">{t}</span>)}</div>
              </div>
            )}
            {person.hunting_license_stamps?.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-slate-500 min-w-[120px]">DCNR Stamps:</span>
                <div className="flex flex-wrap gap-1">{person.hunting_license_stamps.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">{t}</span>)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {warrants.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Gavel className="w-4 h-4" /> Active Warrants ({warrants.length})</h3>
          <div className="space-y-2">{warrants.map((w) => <div key={w.id} className="bg-slate-800/50 rounded-lg p-3"><p className="text-sm text-white font-medium">{w.reason}</p>{w.charges?.length > 0 && <p className="text-xs text-slate-400 mt-1">Charges: {w.charges.join(", ")}</p>}{w.bail_amount && <p className="text-xs text-yellow-400 mt-1">Bail: ${w.bail_amount}</p>}</div>)}</div>
        </div>
      )}

      {bolos.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> BOLOs ({bolos.length})</h3>
          <div className="space-y-2">{bolos.map((b) => <div key={b.id} className="bg-slate-800/50 rounded-lg p-3"><p className="text-sm text-white font-medium">{b.title}</p><p className="text-xs text-slate-400 mt-1">{b.description}</p>{b.last_seen_location && <p className="text-xs text-slate-500 mt-1">Last seen: {b.last_seen_location}</p>}</div>)}</div>
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Car className="w-4 h-4" /> Registered Vehicles ({vehicles.length})</h3>
          <div className="space-y-2">{vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
              <div><span className="font-mono text-white font-semibold">{v.plate}</span><span className="text-sm text-slate-400 ml-2">{v.model} · {v.color}</span></div>
              <div className="flex gap-2">
                {v.is_stolen && <span className="text-xs px-2 py-0.5 rounded-full text-red-400 bg-red-500/10">STOLEN</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${v.registration_status === "Valid" ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>Reg: {v.registration_status}</span>
              </div>
            </div>
          ))}</div>
        </div>
      )}

      {firearms.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Crosshair className="w-4 h-4" /> Registered Firearms ({firearms.length})</h3>
          <div className="space-y-2">{firearms.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
              <div><span className="font-mono text-white font-semibold">{f.serial_number}</span><span className="text-sm text-slate-400 ml-2">{f.model} · {f.caliber}</span></div>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${f.is_registered ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{f.is_registered ? "Registered" : "Unregistered"}</span>
                {f.is_stolen && <span className="text-xs px-2 py-0.5 rounded-full text-red-400 bg-red-500/10">STOLEN</span>}
              </div>
            </div>
          ))}</div>
        </div>
      )}

      {reports.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Report History ({reports.length})</h3>
          <div className="space-y-2">{reports.map((r) => (
            <div key={r.id} className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{r.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "Filed" ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>{r.status}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{r.report_type} · {r.run_number || "No run #"}</p>
              {r.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>}
            </div>
          ))}</div>
        </div>
      )}

      {(person.allergies?.length > 0 || person.medications?.length > 0 || person.medical_history?.length > 0) && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Medical Information</h3>
          <div className="space-y-1.5 text-sm">
            {person.allergies?.length > 0 && <p><span className="text-slate-500">Allergies: </span><span className="text-slate-300">{person.allergies.join(", ")}</span></p>}
            {person.medications?.length > 0 && <p><span className="text-slate-500">Medications: </span><span className="text-slate-300">{person.medications.join(", ")}</span></p>}
            {person.medical_history?.length > 0 && <p><span className="text-slate-500">History: </span><span className="text-slate-300">{person.medical_history.join(", ")}</span></p>}
          </div>
        </div>
      )}

      {person.notes && <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Notes</h3><p className="text-sm text-slate-300">{person.notes}</p></div>}
    </div>
  );
}

function VehicleDetail({ vehicle, priors, onLookupOwner }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center"><Car className="w-8 h-8 text-slate-600" /></div>
          <div><h2 className="text-xl font-bold text-white font-mono">{vehicle.plate}</h2><p className="text-sm text-slate-400">{vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.color}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Owner: </span><button onClick={() => onLookupOwner(vehicle.owner_name)} className="text-blue-400 hover:text-blue-300 hover:underline">{vehicle.owner_name || "Unknown"}</button></div>
          <div><span className="text-slate-500">Registration: </span><span className={`px-2 py-0.5 rounded-full text-xs ${vehicle.registration_status === "Valid" ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{vehicle.registration_status}</span></div>
          <div><span className="text-slate-500">Insurance: </span><span className={`px-2 py-0.5 rounded-full text-xs ${vehicle.insurance_status === "Valid" ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>{vehicle.insurance_status}</span></div>
          <div><span className="text-slate-500">Stolen: </span><span className={`px-2 py-0.5 rounded-full text-xs ${vehicle.is_stolen ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-slate-700"}`}>{vehicle.is_stolen ? "YES" : "No"}</span></div>
        </div>
        {vehicle.notes && <p className="text-sm text-slate-400 mt-4">{vehicle.notes}</p>}
      </div>

      {priors.bolos.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> BOLOs ({priors.bolos.length})</h3>
          <div className="space-y-2">{priors.bolos.map((b) => (
            <div key={b.id} className="bg-slate-800/50 rounded-lg p-3"><p className="text-sm text-white font-medium">{b.title}</p><p className="text-xs text-slate-400 mt-1">{b.description}</p>{b.last_seen_location && <p className="text-xs text-slate-500 mt-1">Last seen: {b.last_seen_location}</p>}</div>
          ))}</div>
        </div>
      )}

      {priors.reports.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Report Priors ({priors.reports.length})</h3>
          <div className="space-y-2">{priors.reports.map((r) => (
            <div key={r.id} className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between"><span className="text-sm text-white font-medium">{r.title}</span><span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "Filed" ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>{r.status}</span></div>
              <p className="text-xs text-slate-500 mt-1">{r.report_type} · {r.run_number || "No run #"}</p>
              {r.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>}
            </div>
          ))}</div>
        </div>
      )}
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