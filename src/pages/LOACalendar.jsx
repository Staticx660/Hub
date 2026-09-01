import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Plus, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { Panel, Btn, EmptyState } from "@/components/mdt/ui/primitives";
import moment from "moment";

const inputCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selCls = "h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1";
const selContentCls = "bg-mdt-surface-2 border-mdt-line-2 text-mdt-text rounded-sm";
const labelCls = "text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function LOACalendar() {
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [form, setForm] = useState({ member_id: "", department_id: "", start_date: "", end_date: "", reason: "" });
  const [showRemove, setShowRemove] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeReason, setRemoveReason] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    try {
      const [r, m, d] = await Promise.all([
        base44.entities.LOARequest.list("-created_date", 50),
        base44.entities.RosterMember.list(),
        base44.entities.Department.list(),
      ]);
      setRequests(r);
      setMembers(m);
      setDepartments(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    try {
      const member = members.find(m => m.id === form.member_id);
      await base44.entities.LOARequest.create({
        ...form,
        member_name: member?.name,
        department_id: form.department_id || member?.department_id,
        status: "Pending",
      });
      toast({ title: "LOA request submitted" });
      setShowForm(false);
      setForm({ member_id: "", department_id: "", start_date: "", end_date: "", reason: "" });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleReview = async (id, status) => {
    await base44.entities.LOARequest.update(id, { status });
    if (status === "Approved") {
      const req = requests.find(r => r.id === id);
      if (req?.member_id) {
        await base44.entities.RosterMember.update(req.member_id, { status: "On LOA" });
        try {
          await base44.functions.invoke("manageLOARole", { member_id: req.member_id, action: "add" });
        } catch (e) { console.error("Discord role update failed:", e); }
      }
    }
    toast({ title: `LOA ${status.toLowerCase()}` });
    loadData();
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await base44.entities.RosterMember.update(removeTarget.member_id, { status: "Active" });
      await base44.entities.LOARequest.update(removeTarget.id, { status: "Removed", removal_reason: removeReason });
      try {
        await base44.functions.invoke("manageLOARole", { member_id: removeTarget.member_id, action: "remove" });
      } catch (e) { console.error("Discord role update failed:", e); }
      toast({ title: "Member removed from LOA" });
      setShowRemove(false);
      setRemoveTarget(null);
      setRemoveReason("");
      loadData();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const getDaysInMonth = () => {
    const start = currentMonth.clone().startOf("month").startOf("week");
    const end = currentMonth.clone().endOf("month").endOf("week");
    const days = [];
    const day = start.clone();
    while (day.isSameOrBefore(end)) {
      days.push(day.clone());
      day.add(1, "day");
    }
    return days;
  };

  const getLoaForDay = (day) => {
    return requests.filter(r => {
      if (r.status === "Denied") return false;
      const start = moment(r.start_date);
      const end = moment(r.end_date);
      return day.isBetween(start, end, "day", "[]");
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  const days = getDaysInMonth();
  const pending = requests.filter(r => r.status === "Pending");
  const active = requests.filter(r => r.status === "Approved");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-mdt-text tracking-tight">LOA Calendar</h1>
          <p className="text-[11.5px] text-mdt-dim">Manage leave of absence requests</p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setShowForm(true)}>New LOA Request</Btn>
      </div>

      {/* Calendar */}
      <Panel
        title={currentMonth.format("MMMM YYYY")}
        actions={
          <>
            <button onClick={() => setCurrentMonth(m => m.clone().subtract(1, "month"))} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setCurrentMonth(m => m.clone().add(1, "month"))} className="w-6 h-6 flex items-center justify-center rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        }
        scroll={false}
      >
        <div className="grid grid-cols-7 gap-px bg-mdt-line p-px">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center py-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-mdt-dim bg-mdt-surface-2">{d}</div>
          ))}
          {days.map((day, i) => {
            const loaItems = getLoaForDay(day);
            const isCurrentMonth = day.month() === currentMonth.month();
            const isToday = day.isSame(moment(), "day");
            return (
              <div
                key={i}
                className={`min-h-[72px] p-1 ${isCurrentMonth ? "bg-mdt-surface" : "bg-mdt-bg"} ${isToday ? "outline outline-1 -outline-offset-1 outline-mdt-accent" : ""}`}
              >
                <span className={`text-[10.5px] ${isToday ? "text-mdt-accent font-bold" : isCurrentMonth ? "text-mdt-muted" : "text-mdt-dim"}`}>
                  {day.date()}
                </span>
                {loaItems.slice(0, 2).map((loa) => (
                  <div
                    key={loa.id}
                    className={`mt-0.5 text-[9.5px] px-1 py-0.5 rounded-sm truncate border ${
                      loa.status === "Approved" ? "bg-amber-500/10 text-amber-300 border-amber-500/25" : "bg-mdt-surface-3 text-mdt-muted border-mdt-line-2"
                    }`}
                  >
                    {loa.member_name}
                  </div>
                ))}
                {loaItems.length > 2 && (
                  <p className="text-[9.5px] text-mdt-dim mt-0.5">+{loaItems.length - 2} more</p>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Pending Requests */}
      <Panel title={`Pending Requests · ${pending.length}`} scroll={false}>
        {pending.length === 0 ? (
          <div className="py-4"><EmptyState icon={CalendarDays} title="No pending requests" /></div>
        ) : (
          <div className="divide-y divide-mdt-line/60">
            {pending.map((r) => (
              <div key={r.id} className="px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-mdt-text truncate">{r.member_name}</p>
                  <p className="text-[10.5px] text-mdt-dim">{r.start_date} → {r.end_date}</p>
                  {r.reason && <p className="text-[10.5px] text-mdt-dim truncate">{r.reason}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Btn variant="primary" icon={Check} onClick={() => handleReview(r.id, "Approved")}>Approve</Btn>
                    <Btn variant="danger" icon={X} onClick={() => handleReview(r.id, "Denied")}>Deny</Btn>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Active LOAs */}
      <Panel title={`Active LOAs · ${active.length}`} scroll={false}>
        {active.length === 0 ? (
          <div className="py-4"><EmptyState icon={CalendarDays} title="No active LOAs" /></div>
        ) : (
          <div className="divide-y divide-mdt-line/60">
            {active.map((r) => (
              <div key={r.id} className="px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-mdt-text truncate">{r.member_name}</p>
                  <p className="text-[10.5px] text-mdt-dim">{r.start_date} → {r.end_date}</p>
                  {r.reason && <p className="text-[10.5px] text-mdt-dim truncate">{r.reason}</p>}
                </div>
                {isAdmin && (
                  <Btn onClick={() => { setRemoveTarget(r); setShowRemove(true); }}>Remove from LOA</Btn>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-md rounded-none sm:rounded-none">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">New LOA Request</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className={labelCls}>Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v, member_id: ""})}>
                <SelectTrigger className={selCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className={selContentCls}>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelCls}>Member</Label>
              <Select value={form.member_id} onValueChange={v => setForm({...form, member_id: v})}>
                <SelectTrigger className={selCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className={selContentCls}>
                  {members.filter(m => !form.department_id || m.department_id === form.department_id).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={labelCls}>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className={inputCls} />
              </div>
              <div>
                <Label className={labelCls}>End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className={inputCls} />
              </div>
            </div>
            <div>
              <Label className={labelCls}>Reason</Label>
              <Input value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className={inputCls} placeholder="Optional reason" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSubmit} disabled={!form.member_id || !form.start_date || !form.end_date}>Submit</Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemove} onOpenChange={setShowRemove}>
        <DialogContent className="mdt bg-mdt-surface border-mdt-line text-mdt-text max-w-md rounded-none sm:rounded-none">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold uppercase tracking-[0.06em]">Remove from LOA</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-[12px] text-mdt-muted">
              End {removeTarget?.member_name}'s leave of absence early and return them to active status.
            </p>
            <div>
              <Label className={labelCls}>Reason</Label>
              <Textarea value={removeReason} onChange={e => setRemoveReason(e.target.value)} className="rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px] mt-1" placeholder="Reason for early removal" rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setShowRemove(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleRemove}>Remove from LOA</Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}