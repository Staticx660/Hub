import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Plus, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

export default function LOACalendar() {
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [form, setForm] = useState({ member_id: "", department_id: "", start_date: "", end_date: "", reason: "" });
  const { toast } = useToast();

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
      }
    }
    toast({ title: `LOA ${status.toLowerCase()}` });
    loadData();
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
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const days = getDaysInMonth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">LOA Calendar</h1>
          <p className="text-sm text-slate-400 mt-1">Manage leave of absence requests</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New LOA Request
        </Button>
      </div>

      {/* Calendar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(m => m.clone().subtract(1, "month"))} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold text-white">{currentMonth.format("MMMM YYYY")}</h2>
          <button onClick={() => setCurrentMonth(m => m.clone().add(1, "month"))} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-px">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center py-2 text-xs font-medium text-slate-500">{d}</div>
          ))}
          {days.map((day, i) => {
            const loaItems = getLoaForDay(day);
            const isCurrentMonth = day.month() === currentMonth.month();
            const isToday = day.isSame(moment(), "day");
            return (
              <div
                key={i}
                className={`min-h-[80px] p-1.5 border border-slate-800/50 rounded ${
                  isCurrentMonth ? "bg-slate-900/50" : "bg-slate-950/50"
                } ${isToday ? "ring-1 ring-blue-500/30" : ""}`}
              >
                <span className={`text-xs ${isToday ? "text-blue-400 font-bold" : isCurrentMonth ? "text-slate-400" : "text-slate-600"}`}>
                  {day.date()}
                </span>
                {loaItems.slice(0, 2).map((loa) => (
                  <div
                    key={loa.id}
                    className={`mt-0.5 text-[10px] px-1 py-0.5 rounded truncate ${
                      loa.status === "Approved" ? "bg-amber-500/10 text-amber-400" : "bg-purple-500/10 text-purple-400"
                    }`}
                  >
                    {loa.member_name}
                  </div>
                ))}
                {loaItems.length > 2 && (
                  <p className="text-[10px] text-slate-500 mt-0.5">+{loaItems.length - 2} more</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Requests */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Pending Requests</h2>
        {requests.filter(r => r.status === "Pending").length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
            No pending requests
          </div>
        ) : (
          <div className="space-y-2">
            {requests.filter(r => r.status === "Pending").map((r) => (
              <div key={r.id} className="bg-slate-900/80 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{r.member_name}</p>
                  <p className="text-xs text-slate-400">{r.start_date} → {r.end_date}</p>
                  {r.reason && <p className="text-xs text-slate-500 mt-1">{r.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleReview(r.id, "Approved")} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReview(r.id, "Denied")} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <X className="w-3.5 h-3.5 mr-1" /> Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>New LOA Request</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm({...form, department_id: v, member_id: ""})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Member</Label>
              <Select value={form.member_id} onValueChange={v => setForm({...form, member_id: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {members.filter(m => !form.department_id || m.department_id === form.department_id).map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-white">{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
              <div>
                <Label className="text-slate-300">End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Reason</Label>
              <Input value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="Optional reason" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.member_id || !form.start_date || !form.end_date} className="bg-blue-600 hover:bg-blue-700">Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}