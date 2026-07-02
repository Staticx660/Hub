import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { Plus, FileText, MapPin, Clock, User } from "lucide-react";

const reportTypes = ["Incident", "Traffic Stop", "Field Contact", "Arrest", "Medical", "Fire", "Vehicle Accident", "Other"];
const statusColors = { "Draft": "bg-slate-700 text-slate-400", "Filed": "bg-blue-500/15 text-blue-400", "Reviewed": "bg-yellow-500/15 text-yellow-400", "Approved": "bg-green-500/15 text-green-400" };
const emptyForm = { title: "", report_type: "Incident", description: "", location: "", department_id: "" };

export default function CADReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [r, d] = await Promise.all([base44.entities.CADReport.list("-created_date"), base44.entities.CADDepartment.list()]);
      setReports(r); setDepartments(d);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find(d => d.id === id)?.name || "—";

  const handleSave = async () => {
    try {
      await base44.entities.CADReport.create({
        ...form,
        status: "Filed",
        filed_by_name: user?.full_name || "Unknown",
        filed_by_id: user?.id,
      });
      toast({ title: "Report filed" });
      setDialogOpen(false); setForm(emptyForm); load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openCreate = () => { setForm({ ...emptyForm, department_id: departments[0]?.id || "" }); setDialogOpen(true); };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-sm text-slate-400">File and view incident reports</p>
        </div>
        <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" /> New Report</Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No reports filed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(r => (
            <button key={r.id} onClick={() => setViewReport(r)} className="text-left bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-900 transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{r.report_type}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[r.status] || statusColors["Filed"]}`}>{r.status}</span>
              </div>
              <h3 className="font-semibold text-white mb-1">{r.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 mb-3">{r.description}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                {r.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location}</span>}
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {r.filed_by_name || "Unknown"}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">New Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-300">Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Traffic stop on Route 1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-slate-300">Type</Label>
                <Select value={form.report_type} onValueChange={v => setForm({ ...form, report_type: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{reportTypes.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-300">Department</Label>
                <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-slate-300">Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Intersection of Main and 5th" /></div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={4} placeholder="Describe the incident in detail..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.description} className="bg-cyan-600 hover:bg-cyan-700">File Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          {viewReport && (
            <>
              <DialogHeader><DialogTitle className="text-white">{viewReport.title}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{viewReport.report_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[viewReport.status] || statusColors["Filed"]}`}>{viewReport.status}</span>
                </div>
                {viewReport.location && <p className="text-sm text-slate-400 flex items-center gap-1"><MapPin className="w-4 h-4" /> {viewReport.location}</p>}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{viewReport.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {viewReport.filed_by_name || "Unknown"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(viewReport.created_date).toLocaleString()}</span>
                  {viewReport.department_id && <span>{deptName(viewReport.department_id)}</span>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}