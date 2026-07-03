import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Archive, Siren, FileText, AlertTriangle, Eye, Search, Clock, MapPin, Phone, Users } from "lucide-react";

const priorityColors = { "1 - High": "bg-red-500/15 text-red-400 border-red-500/30", "2 - Medium": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", "3 - Low": "bg-blue-500/15 text-blue-400 border-blue-500/30" };

export default function DepartmentArchive() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("all");
  const [tab, setTab] = useState("calls");
  const [calls, setCalls] = useState([]);
  const [reports, setReports] = useState([]);
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const load = async () => {
    try {
      const [d, c, r, w, b] = await Promise.all([
        base44.entities.CADDepartment.filter({ is_active: true }),
        base44.entities.ActiveCall.filter({ status: "Closed" }),
        base44.entities.CADReport.list(),
        base44.entities.Warrant.list(),
        base44.entities.BOLO.list(),
      ]);
      setDepartments(d);
      setCalls(c);
      setReports(r);
      setWarrants(w.filter(x => x.status !== "Active"));
      setBolos(b.filter(x => x.status !== "Active"));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unknown";

  const filterByDept = (items) => selectedDept === "all" ? items : items.filter(i => i.department_id === selectedDept);
  const filterBySearch = (items) => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => (i.title || i.call_type || i.reason || i.name || "").toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q) || (i.run_number || "").toLowerCase().includes(q));
  };

  const filteredCalls = filterBySearch(filterByDept(calls));
  const filteredReports = filterBySearch(filterByDept(reports));
  const filteredWarrants = filterBySearch(filterByDept(warrants));
  const filteredBolos = filterBySearch(filterByDept(bolos));

  const tabs = [
    { id: "calls", label: "Closed Calls", icon: Siren, count: filteredCalls.length },
    { id: "reports", label: "Reports", icon: FileText, count: filteredReports.length },
    { id: "warrants", label: "Warrants", icon: AlertTriangle, count: filteredWarrants.length },
    { id: "bolos", label: "BOLOs", icon: Eye, count: filteredBolos.length },
  ];

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  const currentList = tab === "calls" ? filteredCalls : tab === "reports" ? filteredReports : tab === "warrants" ? filteredWarrants : filteredBolos;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Archive className="w-6 h-6 text-cyan-400" /> Department Archive</h1>
        <p className="text-sm text-slate-400 mt-1">View closed calls, past reports, and historical records</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white h-9"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search archive..." className="bg-slate-800 border-slate-700 text-white pl-9" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-white"}`}>
            <t.icon className="w-4 h-4" /> {t.label} <span className="text-xs text-slate-500">({t.count})</span>
          </button>
        ))}
      </div>

      {currentList.length === 0 ? (
        <div className="text-center py-16 text-slate-600"><Archive className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No records found</p></div>
      ) : (
        <div className="space-y-2">
          {currentList.map(item => {
            const title = item.title || item.call_type || item.reason || item.person_name || "Unknown";
            const sub = item.report_type || item.bolo_type || (item.charges?.join(", ")) || item.run_number || "";
            const date = item.created_date ? new Date(item.created_date).toLocaleString() : "";
            return (
              <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.priority && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[item.priority] || "bg-slate-700 text-slate-400"}`}>{item.priority}</span>}
                    {item.status && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{item.status}</span>}
                    <div>
                      <p className="text-white font-medium text-sm">{title}</p>
                      {sub && <p className="text-xs text-slate-500">{sub}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{deptName(item.department_id)}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> {date}</p>
                  </div>
                </div>
                {tab === "calls" && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>
                    {item.caller_name && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.caller_name}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.assigned_unit_ids?.length || 0} units</span>
                  </div>
                )}
                {item.description && <p className="text-sm text-slate-400 mt-2 bg-slate-800/40 rounded-lg p-2">{item.description}</p>}
                {item.notes && <p className="text-sm text-slate-400 mt-2 bg-slate-800/40 rounded-lg p-2">{item.notes}</p>}
                {item.filed_by_name && <p className="text-xs text-slate-500 mt-2">Filed by: {item.filed_by_name}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}