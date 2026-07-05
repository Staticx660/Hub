import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { FileText, FolderOpen, Pencil, Eye, Plus, Shield, Clock, Gavel, ChevronDown, ChevronRight, List, LayoutGrid, X, Link2 } from "lucide-react";
import BoloForm from "@/components/cad/mdt/BoloForm";
import WarrantForm from "@/components/cad/mdt/WarrantForm";
import ReportFormView from "@/components/cad/mdt/ReportFormView";

const ALL_REPORT_TYPES = ["Incident", "Traffic Stop", "Field Contact", "Arrest", "Medical", "Fire", "Vehicle Accident", "Use of Force", "Evidence", "Other"];
const REPORT_TYPES_BY_CATEGORY = {
  Police: ["Incident", "Traffic Stop", "Field Contact", "Arrest", "Vehicle Accident", "Use of Force", "Evidence", "Other"],
  Fire: ["Fire", "Vehicle Accident", "Other"],
  EMS: ["Medical", "Vehicle Accident", "Other"],
  Dispatch: ["Incident", "Traffic Stop", "Other"],
  Civilian: ["Other"],
  "Private Security": ["Incident", "Field Contact", "Other"],
  Other: ALL_REPORT_TYPES,
};

const FILTER_CHECKBOXES_BY_CATEGORY = {
  Police: [{ key: "warrant", label: "Warrant" }, { key: "bolo", label: "BOLO" }, { key: "license", label: "License" }, { key: "vehicle", label: "Vehicle Registration" }],
  "Private Security": [{ key: "warrant", label: "Warrant" }, { key: "bolo", label: "BOLO" }, { key: "license", label: "License" }, { key: "vehicle", label: "Vehicle Registration" }],
  Fire: [{ key: "fire", label: "Fire Incident" }, { key: "mva", label: "MVA / Extrication" }, { key: "hazmat", label: "Hazmat" }, { key: "pcr", label: "Patient Care Report" }],
  EMS: [{ key: "medical", label: "Medical Call" }, { key: "pcr", label: "Patient Care Report" }],
  Dispatch: [{ key: "incident", label: "Incident" }],
  Other: [{ key: "warrant", label: "Warrant" }, { key: "bolo", label: "BOLO" }, { key: "license", label: "License" }, { key: "vehicle", label: "Vehicle Registration" }],
};

export default function RecordsPanel({ department, session }) {
  const [tab, setTab] = useState("myfiles");
  const [reports, setReports] = useState([]);
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [closedCalls, setClosedCalls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boloOpen, setBoloOpen] = useState(false);
  const [warrantOpen, setWarrantOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("Incident");
  const [newFileExpanded, setNewFileExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [searchFilter, setSearchFilter] = useState("");
  const [filters, setFilters] = useState({});
  const { toast } = useToast();

  const load = async () => {
    try {
      const [r, w, b, t, cc] = await Promise.all([
        base44.entities.CADReport.filter({ department_id: department.id }),
        base44.entities.Warrant.filter({ department_id: department.id }),
        base44.entities.BOLO.filter({ department_id: department.id }),
        base44.entities.ReportTemplate.list(),
        base44.entities.ActiveCall.filter({ department_id: department.id, status: "Closed" }),
      ]);
      setReports(r); setWarrants(w); setBolos(b); setTemplates(t); setClosedCalls(cc);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const myReports = reports.filter((r) => r.filed_by_id === session.user_id);
  const myDrafts = myReports.filter((r) => r.status === "Draft");
  const isSupervisor = session.rank?.toLowerCase().match(/sergeant|lieutenant|captain|chief|supervisor|commander|sheriff/);
  const reportTypes = REPORT_TYPES_BY_CATEGORY[department.category] || ALL_REPORT_TYPES;
  const isPoliceType = ["Police", "Private Security", "Other"].includes(department.category);
  const filterCheckboxes = FILTER_CHECKBOXES_BY_CATEGORY[department.category] || [];

  const fileItems = [
    { id: "myfiles", label: "My Files", icon: FolderOpen, count: myReports.length },
    { id: "drafts", label: "My Drafts", icon: Pencil, count: myDrafts.length },
    ...(isPoliceType ? [
      { id: "warrants", label: "Warrants", icon: Gavel, count: warrants.filter(w => w.status === "Active").length },
      { id: "bolos", label: "BOLOs", icon: Eye, count: bolos.filter(b => b.status === "Active").length },
    ] : []),
    { id: "supervisor", label: "Supervisor Panel", icon: Shield, count: reports.length, supervisorOnly: true },
  ].filter(t => !t.supervisorOnly || isSupervisor);

  const searchItems = reportTypes;

  const currentList = tab === "myfiles" ? myReports : tab === "drafts" ? myDrafts : tab === "closedcalls" ? closedCalls : tab === "warrants" ? warrants : tab === "bolos" ? bolos : tab === "supervisor" ? reports : [];

  const filteredList = searchFilter
    ? currentList.filter(item => {
        const title = item.title || item.call_type || item.reason || item.person_name || "";
        const type = item.report_type || item.bolo_type || "";
        return title.toLowerCase().includes(searchFilter.toLowerCase()) || type.toLowerCase().includes(searchFilter.toLowerCase());
      })
    : currentList;

  const openNewFile = (type) => {
    setFormType(type);
    setShowForm(true);
    setSelected(null);
    setNewFileExpanded(false);
  };

  const deleteReport = async (id) => {
    if (!confirm("Delete this report?")) return;
    await base44.entities.CADReport.delete(id);
    setSelected(null); load();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  if (showForm) {
    return <ReportFormView department={department} session={session} initialType={formType} templates={templates} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />;
  }

  const isClosedCall = selected?.call_type !== undefined;

  return (
    <div className="flex h-full bg-[#1a1d21]">
      {/* Sidebar */}
      <div className="w-56 bg-[#131519] border-r border-[#2c2f36] flex flex-col overflow-y-auto flex-shrink-0">
        {/* Files */}
        <div className="p-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1.5">Files</h3>
          <div className="space-y-0.5">
            {fileItems.map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${tab === t.id ? "bg-slate-700/50 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                <span className="flex items-center gap-2"><t.icon className="w-3.5 h-3.5" /> {t.label}</span>
                {t.count !== undefined && <span className="text-[10px] text-slate-500">{t.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* New File */}
        <div className="p-2 border-t border-[#2c2f36]">
          <button onClick={() => setNewFileExpanded(!newFileExpanded)} className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white">
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-green-400" /> New File</span>
            {newFileExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {newFileExpanded && (
            <div className="mt-1 space-y-0.5 pl-4">
              {reportTypes.map((rt) => (
                <button key={rt} onClick={() => openNewFile(rt)} className="w-full text-left px-2 py-1 rounded-md text-xs text-slate-400 hover:bg-slate-800/50 hover:text-white">{rt}</button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="p-2 border-t border-[#2c2f36]">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1.5">Search</h3>
          <div className="space-y-0.5">
            {searchItems.map((s) => (
              <button key={s} onClick={() => setSearchFilter(searchFilter === s ? "" : s)} className={`w-full text-left px-2 py-1 rounded-md text-xs transition-colors ${searchFilter === s ? "bg-slate-700/50 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>{s}</button>
            ))}
            {searchFilter && <button onClick={() => setSearchFilter("")} className="w-full text-left px-2 py-1 rounded-md text-xs text-red-400 hover:bg-red-500/10">Clear filter</button>}
          </div>
        </div>

        {/* File History */}
        <div className="p-2 border-t border-[#2c2f36]">
          <button onClick={() => setHistoryExpanded(!historyExpanded)} className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white">
            <span>File History</span>
            {historyExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {historyExpanded && (
            <div className="mt-1 pl-2">
              {myReports.length === 0 ? <p className="text-xs text-slate-600 px-2 py-1">No recent records</p> : (
                <div className="space-y-0.5">
                  {myReports.slice(0, 5).map(r => (
                    <button key={r.id} onClick={() => { setTab("myfiles"); setSelected(r); }} className="w-full text-left px-2 py-1 rounded-md text-xs text-slate-400 hover:bg-slate-800/50 hover:text-white truncate">{r.title}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Types */}
        <div className="p-2 border-t border-[#2c2f36] mt-auto">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1.5">Filter Types</h3>
          <div className="space-y-1 px-2">
            {filterCheckboxes.map(f => (
              <label key={f.key} className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input type="checkbox" checked={filters[f.key] || false} onChange={e => setFilters({ ...filters, [f.key]: e.target.checked })} className="w-3.5 h-3.5 rounded border-2 border-red-500 bg-transparent accent-red-500" />
                {f.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Reports / Records</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"}`}><LayoutGrid className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mb-4">
              {tab === "bolos" && <button onClick={() => setBoloOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm"><Plus className="w-3.5 h-3.5" /> New BOLO</button>}
              {tab === "warrants" && <button onClick={() => setWarrantOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm"><Plus className="w-3.5 h-3.5" /> New Warrant</button>}
              {(tab === "myfiles" || tab === "drafts" || tab === "supervisor") && <button onClick={() => openNewFile(reportTypes[0])} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm"><Plus className="w-3.5 h-3.5" /> New File</button>}
            </div>

            {/* Record List */}
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <FileText className="w-12 h-12 mb-3 opacity-30" />
                <p>No Records Found</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredList.map((item) => {
                  const title = item.title || item.call_type || item.reason || `${item.person_name || "Unknown"}`;
                  const sub = item.report_type || item.bolo_type || (item.charges?.join(", ")) || item.run_number || "";
                  return (
                    <button key={item.id} onClick={() => setSelected(item)} className="bg-[#262a30] border border-[#2c2f36] rounded-lg p-3 hover:border-slate-600 transition-colors text-left">
                      {item.status && <span className={`text-[10px] px-1.5 py-0.5 rounded-full mb-2 inline-block ${item.status === "Draft" ? "text-yellow-400 bg-yellow-500/10" : item.status === "Active" ? "text-red-400 bg-red-500/10" : item.status === "Closed" ? "text-gray-400 bg-gray-500/10" : "text-green-400 bg-green-500/10"}`}>{item.status}</span>}
                      <p className="text-white font-medium text-sm truncate">{title}</p>
                      {sub && <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>}
                      <p className="text-[10px] text-slate-600 mt-1">{item.filed_by_name || item.issued_by_name || ""}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredList.map((item) => {
                  const title = item.title || item.call_type || item.reason || `${item.person_name || "Unknown"} — Warrant`;
                  const sub = item.report_type || item.bolo_type || (item.charges?.join(", ")) || item.run_number || "";
                  const date = item.created_date ? new Date(item.created_date).toLocaleDateString() : "";
                  return (
                    <button key={item.id} onClick={() => setSelected(item)} className="w-full flex items-center justify-between bg-[#262a30] border border-[#2c2f36] rounded-lg p-3 hover:border-slate-600 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        {item.status && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.status === "Draft" ? "text-yellow-400 bg-yellow-500/10" : item.status === "Active" ? "text-red-400 bg-red-500/10" : item.status === "Closed" ? "text-gray-400 bg-gray-500/10" : "text-green-400 bg-green-500/10"}`}>{item.status}</span>}
                        <div><p className="text-white font-medium text-sm">{title}</p>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>
                      </div>
                      <div className="text-right"><p className="text-xs text-slate-500">{item.filed_by_name || item.issued_by_name || ""}</p><p className="text-[10px] text-slate-600">{date}</p></div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4"><X className="w-4 h-4" /> Back to list</button>
            {isClosedCall ? (
              <div className="bg-[#262a30] border border-[#2c2f36] rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div><h2 className="text-xl font-bold text-white">{selected.call_type}</h2>{selected.run_number && <p className="text-sm text-blue-400 font-mono">{selected.run_number}</p>}</div>
                  <span className="text-xs px-2.5 py-1 rounded-full text-gray-400 bg-gray-500/10">Closed</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div><span className="text-slate-500">Location: </span><span className="text-slate-300">{selected.location}</span></div>
                  <div><span className="text-slate-500">Priority: </span><span className="text-slate-300">{selected.priority}</span></div>
                  {selected.caller_name && <div><span className="text-slate-500">Caller: </span><span className="text-slate-300">{selected.caller_name}</span></div>}
                  <div><span className="text-slate-500">Units: </span><span className="text-slate-300">{selected.assigned_unit_ids?.length || 0}</span></div>
                </div>
                {selected.description && <p className="text-sm text-slate-400 bg-[#1a1d21] rounded-lg p-3 mb-3">{selected.description}</p>}
                {selected.cad_notes && <div className="mb-3"><p className="text-xs text-slate-500 mb-1">CAD Notes:</p><p className="text-sm text-slate-300 bg-[#1a1d21] rounded-lg p-3">{selected.cad_notes}</p></div>}
                {selected.assignment_log?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Call Log:</p>
                    <div className="space-y-1">{selected.assignment_log.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs"><span className={`w-2 h-2 rounded-full ${entry.action === "attached" ? "bg-green-400" : entry.action === "detached" ? "bg-yellow-400" : "bg-blue-400"}`} /><span className="text-slate-300">{entry.unit_name}</span><span className="text-slate-500">{entry.action}</span><span className="text-slate-600 ml-auto">{new Date(entry.timestamp).toLocaleString()}</span></div>
                    ))}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#262a30] border border-[#2c2f36] rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div><h2 className="text-xl font-bold text-white">{selected.title || selected.reason || "Warrant"}</h2>{selected.run_number && <p className="text-sm text-blue-400 font-mono">{selected.run_number}</p>}</div>
                  {selected.status && <span className={`text-xs px-2.5 py-1 rounded-full ${selected.status === "Draft" ? "text-yellow-400 bg-yellow-500/10" : selected.status === "Active" ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"}`}>{selected.status}</span>}
                </div>
                {selected.report_type && <p className="text-sm text-slate-400 mb-2">Type: {selected.report_type}</p>}
                {selected.location && <p className="text-sm text-slate-400 mb-2">Location: {selected.location}</p>}
                {selected.linked_civilian_name && <p className="text-sm text-slate-400 mb-2">Linked Civilian: {selected.linked_civilian_name}</p>}
                {selected.linked_vehicle_plate && <p className="text-sm text-slate-400 mb-2">Linked Vehicle: <span className="font-mono">{selected.linked_vehicle_plate}</span>{selected.field_data?.vehicle?.model && <span className="ml-2">· {selected.field_data.vehicle.model}</span>}{selected.field_data?.vehicle?.color && <span className="ml-1">· {selected.field_data.vehicle.color}</span>}</p>}
                <p className="text-sm text-slate-300 whitespace-pre-wrap mt-3">{selected.description || selected.notes || ""}</p>
                {selected.field_data?.flags && (selected.field_data.flags.armed || selected.field_data.flags.violent || selected.field_data.flags.mentally_ill) && (
                  <div className="mt-3 flex gap-2">
                    {selected.field_data.flags.armed && <span className="text-xs px-2 py-0.5 rounded-full text-red-400 bg-red-500/10">Armed</span>}
                    {selected.field_data.flags.violent && <span className="text-xs px-2 py-0.5 rounded-full text-red-400 bg-red-500/10">Violent</span>}
                    {selected.field_data.flags.mentally_ill && <span className="text-xs px-2 py-0.5 rounded-full text-red-400 bg-red-500/10">Mentally Ill</span>}
                  </div>
                )}
                {selected.field_data?.charges?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#2c2f36]">
                    <p className="text-xs text-slate-500 mb-2">Charges:</p>
                    <div className="space-y-1">
                      {selected.field_data.charges.map((c, i) => (
                        <div key={i} className="text-sm"><span className="text-slate-300">{c.charge}</span>{c.charge_type && <span className="text-slate-500 ml-2">({c.charge_type})</span>}{c.bond_amount > 0 && <span className="text-yellow-400 ml-2">${c.bond_amount}</span>}</div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.field_data && Object.keys(selected.field_data).length > 0 && selected.field_data.civilian && (
                  <div className="mt-3 pt-3 border-t border-[#2c2f36]">
                    <p className="text-xs text-slate-500 mb-2">Civilian Details:</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {selected.field_data.civilian.first_name && <div><span className="text-slate-500">Name: </span><span className="text-slate-300">{selected.field_data.civilian.first_name} {selected.field_data.civilian.last_name}</span></div>}
                      {selected.field_data.civilian.dob && <div><span className="text-slate-500">DOB: </span><span className="text-slate-300">{selected.field_data.civilian.dob}</span></div>}
                      {selected.field_data.civilian.phone && <div><span className="text-slate-500">Phone: </span><span className="text-slate-300">{selected.field_data.civilian.phone}</span></div>}
                      {selected.field_data.civilian.address && <div><span className="text-slate-500">Address: </span><span className="text-slate-300">{selected.field_data.civilian.address}</span></div>}
                    </div>
                  </div>
                )}
                {selected.field_data?.linked_records?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#2c2f36]">
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Linked Records:</p>
                    <div className="space-y-1">
                      {selected.field_data.linked_records.map((rec, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-[#1a1d21] rounded-lg p-2">
                          {rec.type === "warrant" ? <Gavel className="w-3.5 h-3.5 text-red-400" /> : rec.type === "bolo" ? <Eye className="w-3.5 h-3.5 text-yellow-400" /> : <FileText className="w-3.5 h-3.5 text-blue-400" />}
                          <span className="text-slate-300">{rec.title}</span>
                          <span className="text-xs text-slate-500 ml-auto">{rec.type}{rec.number ? ` · ${rec.number}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(selected.filed_by_name || selected.issued_by_name) && <p className="text-xs text-slate-500 mt-4">Filed by: {selected.filed_by_name || selected.issued_by_name}</p>}
                {selected.title && <button onClick={() => deleteReport(selected.id)} className="mt-4 text-sm text-red-400 hover:text-red-300">Delete Report</button>}
              </div>
            )}
          </div>
        )}
      </div>

      <BoloForm open={boloOpen} onOpenChange={setBoloOpen} department={department} session={session} onSaved={load} />
      <WarrantForm open={warrantOpen} onOpenChange={setWarrantOpen} department={department} session={session} onSaved={load} />
    </div>
  );
}