import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Download, Play, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Panel, Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import { Clock } from "lucide-react";
import moment from "moment";

const inputCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selContentCls = "bg-mdt-surface-2 border-mdt-line-2 text-mdt-text rounded-sm";
const labelCls = "text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

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
    return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  const filtered = getFiltered();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-mdt-text tracking-tight">Shift Tracking</h1>
          <p className="text-[11.5px] text-mdt-dim">Track and manage member shifts</p>
        </div>
        <div className="flex gap-1.5">
          <Btn icon={Download} onClick={exportPDF}>Export PDF</Btn>
          {isAdmin && <Btn variant="primary" icon={Plus} onClick={() => setShowForm(true)}>Log Shift</Btn>}
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className={`w-48 ${selCls} mt-0`}><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent className={selContentCls}>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className={`w-40 ${selCls} mt-0`}><SelectValue /></SelectTrigger>
          <SelectContent className={selContentCls}>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Panel title={`Shift History · ${filtered.length}`} scroll={false}>
        <div className="overflow-x-auto mdt-scroll">
          <table className="w-full">
            <thead>
              <tr className="border-b border-mdt-line bg-mdt-surface-2">
                {["Member", "Department", "Start", "End", "Hours", "Status", ""].map((h, i) => (
                  <th key={i} className={`px-3 h-7 text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim whitespace-nowrap ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mdt-line/60">
              {filtered.length === 0 && (
                <tr><td colSpan={7}><EmptyState icon={Clock} title="No shifts found" /></td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-mdt-surface-2">
                  <td className="px-3 h-9 text-[12px] text-mdt-text font-medium whitespace-nowrap">{s.member_name || "—"}</td>
                  <td className="px-3 h-9 text-[12px] text-mdt-muted whitespace-nowrap">{getDeptName(s.department_id)}</td>
                  <td className="px-3 h-9 text-[12px] text-mdt-muted whitespace-nowrap">{moment(s.start_time).format("MMM D, h:mm A")}</td>
                  <td className="px-3 h-9 text-[12px] text-mdt-muted whitespace-nowrap">{s.end_time ? moment(s.end_time).format("MMM D, h:mm A") : "—"}</td>
                  <td className="px-3 h-9 text-[12px] text-mdt-muted">{s.duration_hours?.toFixed(1) || "—"}</td>
                  <td className="px-3 h-9">
                    <StatusPill tone={s.status === "In Progress" ? "warn" : "ok"}>{s.status}</StatusPill>
                  </td>
                  <td className="px-3 h-9 text-right">
                    {isAdmin && s.status === "In Progress" && (
                      <Btn icon={Square} onClick={() => handleClockOut(s)}>Clock Out</Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-md rounded-none sm:rounded-none">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">Log Shift</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className={labelCls}>Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v, member_id: ""})}>
                <SelectTrigger className={selCls}><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent className={selContentCls}>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelCls}>Member</Label>
              <Select value={form.member_id} onValueChange={v => setForm({...form, member_id: v})}>
                <SelectTrigger className={selCls}><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent className={selContentCls}>
                  {members.filter(m => !form.department_id || m.department_id === form.department_id).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelCls}>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputCls} placeholder="Optional notes..." />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn variant="primary" icon={Play} onClick={handleClockIn} disabled={!form.member_id}>Clock In</Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}