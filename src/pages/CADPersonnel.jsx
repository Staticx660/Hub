import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Pencil, Trash2, RefreshCw, Loader2, CheckCircle2, Search } from "lucide-react";

const statusColors = { "Available": "bg-green-500/15 text-green-400", "On Duty": "bg-blue-500/15 text-blue-400", "Off Duty": "bg-slate-700 text-slate-400" };
const emptyForm = { name: "", discord_id: "", department_id: "", rank: "", badge_number: "", callsign: "", status: "Off Duty" };

export default function CADPersonnel() {
  const [personnel, setPersonnel] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterDept, setFilterDept] = useState("all");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [p, d] = await Promise.all([base44.entities.CADPersonnel.list(), base44.entities.CADDepartment.list()]);
      setPersonnel(p);
      setDepartments(d);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find(d => d.id === id)?.name || "Unassigned";
  const deptColor = (id) => departments.find(d => d.id === id)?.color || "#64748b";

  const allDeptNames = (p) => {
    const names = [deptName(p.department_id)];
    (p.additional_department_ids || []).forEach(id => names.push(deptName(id)));
    return [...new Set(names)].filter(n => n !== "Unassigned" || names.length === 1);
  };

  // Filter — a person shows if they match the department filter (primary or additional) and search
  const filtered = personnel.filter(p => {
    const matchesDept = filterDept === "all" || p.department_id === filterDept || (p.additional_department_ids || []).includes(filterDept);
    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.callsign?.toLowerCase().includes(search.toLowerCase()) || p.badge_number?.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleSave = async () => {
    try {
      if (editing) { await base44.entities.CADPersonnel.update(editing.id, form); toast({ title: "Personnel updated" }); }
      else { await base44.entities.CADPersonnel.create(form); toast({ title: "Personnel added" }); }
      setDialogOpen(false); setEditing(null); setForm(emptyForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this personnel record?")) return;
    try { await base44.entities.CADPersonnel.delete(id); toast({ title: "Personnel removed" }); load(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openEdit = (p) => { setEditing(p); setForm({ ...emptyForm, ...p, additional_department_ids: p.additional_department_ids || [] }); setDialogOpen(true); };
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, department_id: departments[0]?.id || "" }); setDialogOpen(true); };

  const handleSync = async () => {
    setSyncing(true); setSyncReport(null);
    try {
      const res = await base44.functions.invoke('syncCADPersonnel', {});
      if (res.data.error) {
        toast({ title: "Sync failed", description: res.data.error, variant: "destructive" });
      } else {
        const report = res.data.report;
        setSyncReport(report);
        toast({ title: "Personnel synced", description: `${report.added} added, ${report.updated} updated, ${report.merged || 0} merged` });
        load();
      }
    } catch (e) { toast({ title: "Sync failed", description: e.message, variant: "destructive" }); }
    setSyncing(false);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-cyan-400" /> Personnel Management</h1>
        <p className="text-sm text-slate-400 mt-1">Manage callsigns, ranks, and department assignments. One record per person.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, callsign, badge..." className="bg-slate-800 border-slate-700 text-white pl-9" />
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />} Sync from Discord
          </Button>
          <Button onClick={openCreate} disabled={departments.length === 0} className="bg-cyan-600 hover:bg-cyan-700"><Users className="w-4 h-4 mr-2" /> Add Personnel</Button>
        </div>
      </div>

      {syncReport && (
        <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>Synced {syncReport.totalDiscordMembers} Discord members: <span className="text-green-400">{syncReport.added} added</span> · <span className="text-blue-400">{syncReport.updated} updated</span>{syncReport.merged > 0 && <> · <span className="text-cyan-400">{syncReport.merged} merged</span></>} · <span className="text-slate-500">{syncReport.skipped} skipped</span></span>
          </div>
          {syncReport.addedToDefault > 0 && <p className="text-xs text-amber-400 mt-2 ml-6">{syncReport.addedToDefault} members had no matching Discord role and were added to the default department.</p>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-600"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No personnel found.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b border-slate-800">
              <th className="pb-2 pr-4">Name</th><th className="pb-2 pr-4">Department(s)</th><th className="pb-2 pr-4">Rank</th><th className="pb-2 pr-4">Badge</th><th className="pb-2 pr-4">Callsign</th><th className="pb-2 pr-4">Status</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-slate-800/50">
                  <td className="py-2.5 pr-4 text-white font-medium">{p.name}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {allDeptNames(p).map((name, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          <span className="w-2 h-2 rounded-full" style={{ background: deptColor(i === 0 ? p.department_id : p.additional_department_ids?.[i - 1]) }} />
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-400">{p.rank || "—"}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{p.badge_number || "—"}</td>
                  <td className="py-2.5 pr-4 text-slate-400 font-mono">{p.callsign || "—"}</td>
                  <td className="py-2.5 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[p.status] || statusColors["Off Duty"]}`}>{p.status}</span></td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Edit Personnel" : "Add Personnel"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-300">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Ofc. John Smith" /></div>
            <div><Label className="text-slate-300">Discord ID</Label><Input value={form.discord_id} onChange={e => setForm({ ...form, discord_id: e.target.value })} className="bg-slate-800 border-slate-700 text-white font-mono" placeholder="Discord user ID" /></div>
            <div><Label className="text-slate-300">Primary Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Rank</Label><Input value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Officer" /></div>
              <div><Label className="text-slate-300">Badge #</Label><Input value={form.badge_number} onChange={e => setForm({ ...form, badge_number: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Callsign</Label><Input value={form.callsign} onChange={e => setForm({ ...form, callsign: e.target.value })} className="bg-slate-800 border-slate-700 text-white font-mono" /></div>
              <div><Label className="text-slate-300">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{Object.keys(statusColors).map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.department_id} className="bg-cyan-600 hover:bg-cyan-700">{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}