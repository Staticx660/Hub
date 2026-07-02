import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { FileText, FolderOpen, Pencil, AlertTriangle, Eye, Plus, Shield, ClipboardList } from "lucide-react";

const reportTypes = ["Incident", "Traffic Stop", "Field Contact", "Arrest", "Medical", "Fire", "Vehicle Accident", "Use of Force", "Evidence", "Other"];

export default function RecordsPanel({ department, session }) {
  const [tab, setTab] = useState("myfiles");
  const [reports, setReports] = useState([]);
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ title: "", report_type: "Incident", description: "", location: "" });
  const { toast } = useToast();

  const load = async () => {
    try {
      const [r, w, b, t] = await Promise.all([
        base44.entities.CADReport.filter({ department_id: department.id }),
        base44.entities.Warrant.filter({ department_id: department.id }),
        base44.entities.BOLO.filter({ department_id: department.id }),
        base44.entities.ReportTemplate.list(),
      ]);
      setReports(r); setWarrants(w); setBolos(b); setTemplates(t);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const myReports = reports.filter((r) => r.filed_by_id === session.user_id);
  const myDrafts = myReports.filter((r) => r.status === "Draft");
  const isSupervisor = session.rank?.toLowerCase().includes("sergeant") || session.rank?.toLowerCase().includes("lieutenant") || session.rank?.toLowerCase().includes("captain") || session.rank?.toLowerCase().includes("chief") || session.rank?.toLowerCase().includes("supervisor");

  const tabs = [
    { id: "myfiles", label: "My Files", icon: FolderOpen, count: myReports.length },
    { id: "drafts", label: "My Drafts", icon: Pencil, count: myDrafts.length },
    { id: "warrants", label: "Warrants", icon: AlertTriangle, count: warrants.filter((w) => w.status === "Active").length },
    { id: "bolos", label: "BOLOs", icon: Eye, count: bolos.filter((b) => b.status === "Active").length },
    { id: "supervisor", label: "Supervisor", icon: Shield, count: reports.length, supervisorOnly: true },
    { id: "new", label: "New File", icon: Plus },
  ];

  const visibleTabs = tabs.filter((t) => !t.supervisorOnly || isSupervisor);

  const handleSaveReport = async (asDraft) => {
    try {
      const runNum = `RUN-${Date.now().toString().slice(-6)}`;
      await base44.entities.CADReport.create({ ...reportForm, department_id: department.id, filed_by_name: session.callsign || session.user_name, filed_by_id: session.user_id, status: asDraft ? "Draft" : "Filed", run_number: runNum });
      toast({ title: asDraft ? "Draft saved" : "Report filed" });
      setDialogOpen(false); setReportForm({ title: "", report_type: "Incident", description: "", location: "" }); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const deleteReport = async (id) => {
    if (!confirm("Delete this report?")) return;
    await base44.entities.CADReport.delete(id);
    setSelected(null); load();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  const currentList = tab === "myfiles" ? myReports : tab === "drafts" ? myDrafts : tab === "warrants" ? warrants : tab === "bolos" ? bolos : tab === "supervisor" ? reports : [];

  return (
    <div className="flex h-full">
      <div className="w-60 border-r border-slate-800 bg-slate-900/50 p-3 overflow-y-auto flex-shrink-0">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Records</h3>
        <div className="space-y-1">
          {visibleTabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); if (t.id === "new") setDialogOpen(true); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${tab === t.id ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:bg-slate-800"}`}>
              <span className="flex items-center gap-2"><t.icon className="w-4 h-4" /> {t.label}</span>
              {t.count !== undefined && <span className="text-xs text-slate-500">{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">File Types</h4>
          <div className="space-y-1 px-2">{reportTypes.map((rt) => <div key={rt} className="text-xs text-slate-500 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" /> {rt}</div>)}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "new" ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600"><Plus className="w-12 h-12 mb-3 opacity-30" /><p>Click "New File" to create a report</p></div>
        ) : !selected ? (
          <div className="space-y-2">
            {currentList.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-600"><FileText className="w-12 h-12 mb-3 opacity-30" /><p>No records found</p></div> : (
              currentList.map((item) => {
                const title = item.title || item.reason || `${item.person_name || "Unknown"} — Warrant`;
                const sub = item.report_type || item.bolo_type || (item.charges?.join(", ")) || "";
                const date = item.created_date ? new Date(item.created_date).toLocaleDateString() : "";
                return (
                  <button key={item.id} onClick={() => setSelected(item)} className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      {item.status && <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "Draft" ? "text-yellow-400 bg-yellow-500/10" : item.status === "Active" ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"}`}>{item.status}</span>}
                      <div><p className="text-white font-medium text-sm">{title}</p>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>
                    </div>
                    <div className="text-right"><p className="text-xs text-slate-500">{item.filed_by_name || item.issued_by_name || ""}</p><p className="text-xs text-slate-600">{date}</p></div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelected(null)} className="text-sm text-slate-400 hover:text-white mb-4">← Back to list</button>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div><h2 className="text-xl font-bold text-white">{selected.title || selected.reason || "Warrant"}</h2>{selected.run_number && <p className="text-sm text-blue-400 font-mono">{selected.run_number}</p>}</div>
                {selected.status && <span className={`text-xs px-2.5 py-1 rounded-full ${selected.status === "Draft" ? "text-yellow-400 bg-yellow-500/10" : selected.status === "Active" ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"}`}>{selected.status}</span>}
              </div>
              {selected.report_type && <p className="text-sm text-slate-400 mb-2">Type: {selected.report_type}</p>}
              {selected.location && <p className="text-sm text-slate-400 mb-2">Location: {selected.location}</p>}
              <p className="text-sm text-slate-300 whitespace-pre-wrap mt-3">{selected.description || selected.notes || ""}</p>
              {(selected.filed_by_name || selected.issued_by_name) && <p className="text-xs text-slate-500 mt-4">Filed by: {selected.filed_by_name || selected.issued_by_name}</p>}
              {selected.title && <button onClick={() => deleteReport(selected.id)} className="mt-4 text-sm text-red-400 hover:text-red-300">Delete Report</button>}
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">New Report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-slate-300">Title</Label><Input value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Report Type</Label><Select value={reportForm.report_type} onValueChange={(v) => setReportForm({ ...reportForm, report_type: v })}><SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{reportTypes.map((t) => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-slate-300">Location</Label><Input value={reportForm.location} onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={4} /></div>
            {templates.length > 0 && <div><Label className="text-slate-300">Template</Label><Select onValueChange={(v) => { const t = templates.find((t) => t.id === v); if (t) setReportForm({ ...reportForm, report_type: t.category, title: t.name }); }}><SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Use template..." /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{templates.map((t) => <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>)}</SelectContent></Select></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button variant="outline" onClick={() => handleSaveReport(true)} disabled={!reportForm.title || !reportForm.description} className="border-slate-700 text-yellow-400 hover:text-yellow-300">Save Draft</Button>
            <Button onClick={() => handleSaveReport(false)} disabled={!reportForm.title || !reportForm.description} className="bg-blue-600 hover:bg-blue-700">File Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}