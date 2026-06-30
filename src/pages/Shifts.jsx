import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, Plus, Download, Play, Square, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ member_id: "", department_id: "", start_time: "", notes: "" });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [s, m, d] = await Promise.all([
        base44.entities.Shift.list("-start_time", 50),
        base44.entities.RosterMember.list(),
        base44.entities.Department.list(),
      ]);
      setShifts(s);
      setMembers(m);
      setDepartments(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const unsubscribe = base44.entities.Shift.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const handleClockIn = async () => {
    try {
      const member = members.find(m => m.id === form.member_id);
      await base44.entities.Shift.create({
        member_id: form.member_id,
        department_id: form.department_id || member?.department_id,
        member_name: member?.name,
        start_time: form.start_time || new Date().toISOString(),
        status: "In Progress",
        notes: form.notes,
      });
      toast({ title: "Shift started" });
      setShowForm(false);
      setForm({ member_id: "", department_id: "", start_time: "", notes: "" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleClockOut = async (shift) => {
    const end = new Date();
    const start = new Date(shift.start_time);
    const hours = ((end - start) / 3600000).toFixed(2);
    await base44.entities.Shift.update(shift.id, {
      end_time: end.toISOString(),
      status: "Completed",
      duration_hours: parseFloat(hours),
    });
    toast({ title: `Shift ended — ${hours} hours` });
    loadData();
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Shift History Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${moment().format("MMMM D, YYYY h:mm A")}`, 14, 28);

    let y = 40;
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("Member", 14, y);
    doc.text("Start", 60, y);
    doc.text("End", 110, y);
    doc.text("Hours", 160, y);
    doc.text("Status", 180, y);
    y += 6;
    doc.setFont(undefined, "normal");

    const filtered = getFiltered();
    filtered.forEach((s) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(s.member_name || "—", 14, y);
      doc.text(moment(s.start_time).format("MM/DD HH:mm"), 60, y);
      doc.text(s.end_time ? moment(s.end_time).format("MM/DD HH:mm") : "—", 110, y);
      doc.text(s.duration_hours?.toFixed(1) || "—", 160, y);
      doc.text(s.status, 180, y);
      y += 5;
    });

    doc.save("shift-history.pdf");
    toast({ title: "PDF exported" });
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "—";

  const getFiltered = () => shifts.filter(s => {
    const matchDept = filterDept === "all" || s.department_id === filterDept;
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchDept && matchStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const filtered = getFiltered();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shift Tracking</h1>
          <p className="text-sm text-slate-400 mt-1">Track and manage member shifts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Log Shift
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            <SelectItem value="In Progress" className="text-white">In Progress</SelectItem>
            <SelectItem value="Completed" className="text-white">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Member</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Department</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Start</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">End</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Hours</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No shifts found</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-3 text-sm text-white font-medium">{s.member_name || "—"}</td>
                  <td className="px-5 py-3 text-sm text-slate-400">{getDeptName(s.department_id)}</td>
                  <td className="px-5 py-3 text-sm text-slate-300">{moment(s.start_time).format("MMM D, h:mm A")}</td>
                  <td className="px-5 py-3 text-sm text-slate-300">{s.end_time ? moment(s.end_time).format("MMM D, h:mm A") : "—"}</td>
                  <td className="px-5 py-3 text-sm text-slate-300">{s.duration_hours?.toFixed(1) || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${s.status === "In Progress" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.status === "In Progress" && (
                      <Button size="sm" variant="outline" onClick={() => handleClockOut(s)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        <Square className="w-3 h-3 mr-1" /> Clock Out
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Log Shift</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v, member_id: ""})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Member</Label>
              <Select value={form.member_id} onValueChange={v => setForm({...form, member_id: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {members.filter(m => !form.department_id || m.department_id === form.department_id).map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-white">{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="Optional notes..." />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleClockIn} disabled={!form.member_id} className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-4 h-4 mr-2" /> Clock In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}