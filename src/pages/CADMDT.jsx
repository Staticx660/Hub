import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Clock, Lock, ChevronLeft } from "lucide-react";
import Taskbar from "@/components/cad/mdt/Taskbar";
import LookupPanel from "@/components/cad/mdt/LookupPanel";
import RecordsPanel from "@/components/cad/mdt/RecordsPanel";
import DispatchView from "@/components/cad/mdt/DispatchView";
import MyCallView from "@/components/cad/mdt/MyCallView";
import GroupsView from "@/components/cad/mdt/GroupsView";
import PCRForm from "@/components/cad/mdt/PCRForm";
import CallViewer from "@/components/cad/mdt/CallViewer";
import ClockInDialog from "@/components/cad/mdt/ClockInDialog";
import KeybindsDialog from "@/components/cad/mdt/KeybindsDialog";
import { useKeybinds, loadKeybinds } from "@/hooks/useKeybinds";
import { startPanicSound, stopPanicSound, playStatusBeep, stopPanicVoice } from "@/components/cad/mdt/panicSound";

const OCRP_LOGO = "https://media.base44.com/images/public/6a441f279b9d3cd678958799/5a43a1b46_OCRP20.png";

export default function CADMDT() {
  const { deptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dispatch");
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [clockInOpen, setClockInOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [keybinds, setKeybinds] = useState(loadKeybinds());
  const [keybindsOpen, setKeybindsOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const dept = await base44.entities.CADDepartment.get(deptId);
        setDepartment(dept);
        const accessRes = await base44.functions.invoke('getUserCADDepartments', {});
        const deptAccess = accessRes.data.departments.find(d => d.id === deptId);
        if (deptAccess && !deptAccess.hasAccess) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        const sessions = await base44.entities.CADSession.filter({ user_id: user.id, department_id: deptId, is_active: true });
        if (sessions.length > 0) setSession(sessions[0]);
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    init();
  }, [deptId]);

  useEffect(() => {
    if (!department) return;
    const unsub = base44.entities.CADSession.subscribe((event) => {
      if (event.type === "update" && event.data?.department_id === department.id && event.data?.user_id !== user.id) {
        if (event.data?.panic_active) {
          toast({ title: "🚨 PANIC BUTTON ACTIVATED", description: `${event.data.callsign || event.data.user_name} has triggered a panic alert!`, variant: "destructive" });
          startPanicSound(event.data.callsign || event.data.user_name);
        } else {
          stopPanicSound();
          stopPanicVoice();
        }
      }
    });
    return unsub;
  }, [department]);

  const handleClockIn = async (formData) => {
    try {
      const now = new Date().toISOString();
      // Deactivate any existing active sessions for this user+department to prevent duplicates
      const existing = await base44.entities.CADSession.filter({ user_id: user.id, department_id: deptId, is_active: true });
      for (const s of existing) {
        await base44.entities.CADSession.update(s.id, { is_active: false, logout_time: now, status: "Unavailable" });
        if (s.shift_id) {
          const duration = (new Date(now) - new Date(s.login_time)) / (1000 * 60 * 60);
          await base44.entities.Shift.update(s.shift_id, { end_time: now, duration_hours: duration, status: "Completed" });
        }
      }
      const members = await base44.entities.RosterMember.filter({ name: formData.name });
      const member = members[0];
      const shift = await base44.entities.Shift.create({ member_id: member?.id || "", department_id: deptId, member_name: formData.name, start_time: now, status: "In Progress" });
      const newSession = await base44.entities.CADSession.create({
        user_id: user.id, user_name: formData.name, department_id: deptId, department_name: department.name,
        roster_member_id: member?.id || "", callsign: formData.callsign, rank: formData.rank,
        status: "Available", login_time: now, is_active: true, panic_active: false, shift_id: shift.id,
      });
      setSession(newSession);
      setClockInOpen(false);
      toast({ title: "Clocked In", description: `On duty as ${formData.callsign || formData.name}` });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const sessionRef = useRef(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const performClockOut = async (s) => {
    if (!s) return;
    try {
      const now = new Date().toISOString();
      await base44.entities.CADSession.update(s.id, { is_active: false, logout_time: now, status: "Unavailable" });
      if (s.shift_id) {
        const duration = (new Date(now) - new Date(s.login_time)) / (1000 * 60 * 60);
        await base44.entities.Shift.update(s.shift_id, { end_time: now, duration_hours: duration, status: "Completed" });
      }
      stopPanicSound();
      stopPanicVoice();
    } catch (e) { /* silent — cleanup */ }
  };

  // Auto clock-out on unmount / page leave
  useEffect(() => {
    const handleBeforeUnload = () => performClockOut(sessionRef.current);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleClockOut = async () => {
    if (!confirm("Clock out and end your shift?")) return;
    try {
      await performClockOut(session);
      setSession(null);
      setSelectedCallId(null);
      toast({ title: "Clocked Out" });
      navigate("/cad");
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const updates = { status: newStatus, panic_active: newStatus === "Panic" ? session.panic_active : false };
      // Going Available clears from active call
      if (newStatus === "Available" && session.active_call_id) {
        const call = await base44.entities.ActiveCall.get(session.active_call_id);
        const newIds = (call.assigned_unit_ids || []).filter(id => id !== session.id);
        const log = [...(call.assignment_log || []), { unit_name: session.callsign || session.user_name, action: "detached", timestamp: new Date().toISOString() }];
        await base44.entities.ActiveCall.update(call.id, { assigned_unit_ids: newIds, assignment_log: log });
        updates.active_call_id = "";
      }
      await base44.entities.CADSession.update(session.id, updates);
      setSession({ ...session, ...updates });
      playStatusBeep();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handlePanic = async () => {
    try {
      const newPanic = !session.panic_active;
      await base44.entities.CADSession.update(session.id, { panic_active: newPanic, status: newPanic ? "Panic" : "Available" });
      setSession({ ...session, panic_active: newPanic, status: newPanic ? "Panic" : "Available" });
      if (newPanic) {
        startPanicSound(session.callsign || session.user_name);
        toast({ title: "🚨 PANIC ACTIVATED", description: "All units have been alerted", variant: "destructive" });
      } else {
        stopPanicSound();
        stopPanicVoice();
      }
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  useKeybinds(keybinds, {
    view_dispatch: () => setActiveView("dispatch"),
    view_lookups: () => setActiveView("lookups"),
    view_records: () => setActiveView("records"),
    view_mycall: () => setActiveView("mycall"),
    view_groups: () => setActiveView("groups"),
    status_available: () => session && handleStatusChange("Available"),
    status_busy: () => session && handleStatusChange("Busy"),
    status_oncall: () => session && handleStatusChange("On Call"),
    status_unavailable: () => session && handleStatusChange("Unavailable"),
    panic: () => session && handlePanic(),
  });

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-950"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (accessDenied) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950 gap-4">
      <Lock className="w-16 h-16 text-slate-600" />
      <h1 className="text-2xl font-bold text-white">Access Denied</h1>
      <p className="text-slate-400">You don't have the Discord role required for this department.</p>
      <Button onClick={() => window.history.back()} variant="outline" className="border-slate-700 text-slate-300">Go Back</Button>
    </div>
  );
  if (!department) return <div className="flex justify-center items-center h-screen bg-slate-950 text-slate-400">Department not found</div>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 gap-6">
        <img src={OCRP_LOGO} alt="OCRP" className="w-24 h-24 rounded-2xl shadow-xl" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">{department.name}</h1>
          <p className="text-slate-400">{department.category} · MDT System</p>
          <p className="text-slate-500 text-sm mt-2">You are not currently on duty</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/cad")} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2 px-6"><ChevronLeft className="w-4 h-4" /> Back to Departments</Button>
          <Button onClick={() => setClockInOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 px-8"><Clock className="w-4 h-4" /> Clock In & Start MDT</Button>
        </div>
        <ClockInDialog open={clockInOpen} onOpenChange={setClockInOpen} department={department} user={user} onClockIn={handleClockIn} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {session.panic_active && <div className="bg-red-500/20 border-y border-red-500 text-red-400 text-center py-1.5 text-sm font-bold animate-pulse">🚨 PANIC ACTIVE — {session.callsign || session.user_name} — ALL UNITS RESPOND</div>}
      <div className="flex-1 overflow-hidden">
        {activeView === "dispatch" && <DispatchView department={department} session={session} setSession={setSession} setActiveView={setActiveView} setSelectedCallId={setSelectedCallId} />}
        {activeView === "callviewer" && <CallViewer department={department} session={session} selectedCallId={selectedCallId} onSelectCall={setSelectedCallId} onBack={() => setActiveView("dispatch")} />}
        {activeView === "lookups" && <LookupPanel department={department} session={session} />}
        {activeView === "pcr" && <PCRForm department={department} session={session} />}
        {activeView === "records" && <RecordsPanel department={department} session={session} />}
        {activeView === "mycall" && <MyCallView department={department} session={session} setSession={setSession} selectedCallId={selectedCallId} setSelectedCallId={setSelectedCallId} setActiveView={setActiveView} />}
        {activeView === "groups" && <GroupsView department={department} session={session} />}
      </div>
      <Taskbar activeView={activeView} setActiveView={(v) => { if (v === "dispatch" && (department.category === "Fire" || department.category === "EMS")) { navigate(`/cad/board/${deptId}`); } else { setActiveView(v); } }} session={session} departmentCategory={department.category} onStatusChange={handleStatusChange} onPanic={handlePanic} onClockOut={handleClockOut} onOpenKeybinds={() => setKeybindsOpen(true)} />
      <KeybindsDialog open={keybindsOpen} onOpenChange={setKeybindsOpen} keybinds={keybinds} setKeybinds={setKeybinds} />
    </div>
  );
}