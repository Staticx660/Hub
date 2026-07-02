import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Shield, Clock } from "lucide-react";
import Taskbar from "@/components/cad/mdt/Taskbar";
import LookupPanel from "@/components/cad/mdt/LookupPanel";
import RecordsPanel from "@/components/cad/mdt/RecordsPanel";
import DispatchView from "@/components/cad/mdt/DispatchView";
import MyCallView from "@/components/cad/mdt/MyCallView";
import GroupsView from "@/components/cad/mdt/GroupsView";

export default function CADMDT() {
  const { deptId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dispatch");

  useEffect(() => {
    const init = async () => {
      try {
        const dept = await base44.entities.CADDepartment.get(deptId);
        setDepartment(dept);
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
      if (event.type === "update" && event.data?.department_id === department.id && event.data?.panic_active && event.data?.user_id !== user.id) {
        toast({ title: "🚨 PANIC BUTTON ACTIVATED", description: `${event.data.callsign || event.data.user_name} has triggered a panic alert!`, variant: "destructive" });
      }
    });
    return unsub;
  }, [department]);

  const handleClockIn = async () => {
    try {
      const members = await base44.entities.RosterMember.filter({ name: user.full_name });
      const member = members[0];
      const now = new Date().toISOString();
      const shift = await base44.entities.Shift.create({ member_id: member?.id || "", department_id: deptId, member_name: user.full_name, start_time: now, status: "In Progress" });
      const newSession = await base44.entities.CADSession.create({
        user_id: user.id, user_name: user.full_name, department_id: deptId, department_name: department.name,
        roster_member_id: member?.id || "", callsign: member?.callsign || "", rank: member?.rank || "",
        status: "Available", login_time: now, is_active: true, panic_active: false, shift_id: shift.id,
      });
      setSession(newSession);
      toast({ title: "Clocked In", description: `On duty as ${member?.callsign || user.full_name}` });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleClockOut = async () => {
    if (!confirm("Clock out and end your shift?")) return;
    try {
      const now = new Date().toISOString();
      await base44.entities.CADSession.update(session.id, { is_active: false, logout_time: now, status: "Unavailable" });
      if (session.shift_id) {
        const duration = (new Date(now) - new Date(session.login_time)) / (1000 * 60 * 60);
        await base44.entities.Shift.update(session.shift_id, { end_time: now, duration_hours: duration, status: "Completed" });
      }
      setSession(null);
      toast({ title: "Clocked Out" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await base44.entities.CADSession.update(session.id, { status: newStatus, panic_active: newStatus === "Panic" ? session.panic_active : false });
      setSession({ ...session, status: newStatus });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handlePanic = async () => {
    try {
      const newPanic = !session.panic_active;
      await base44.entities.CADSession.update(session.id, { panic_active: newPanic, status: newPanic ? "Panic" : "Available" });
      setSession({ ...session, panic_active: newPanic, status: newPanic ? "Panic" : "Available" });
      if (newPanic) toast({ title: "🚨 PANIC ACTIVATED", description: "All units have been alerted", variant: "destructive" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-950"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!department) return <div className="flex justify-center items-center h-screen bg-slate-950 text-slate-400">Department not found</div>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">{department.name}</h1>
          <p className="text-slate-400">{department.category} · MDT System</p>
          <p className="text-slate-500 text-sm mt-2">You are not currently on duty</p>
        </div>
        <Button onClick={handleClockIn} className="bg-blue-600 hover:bg-blue-700 gap-2 px-8"><Clock className="w-4 h-4" /> Clock In & Start MDT</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {session.panic_active && <div className="bg-red-500/20 border-y border-red-500 text-red-400 text-center py-1.5 text-sm font-bold animate-pulse">🚨 PANIC ACTIVE — {session.callsign || session.user_name} — ALL UNITS RESPOND</div>}
      <div className="flex-1 overflow-hidden">
        {activeView === "dispatch" && <DispatchView department={department} session={session} setSession={setSession} />}
        {activeView === "lookups" && <LookupPanel department={department} session={session} />}
        {activeView === "records" && <RecordsPanel department={department} session={session} />}
        {activeView === "mycall" && <MyCallView department={department} session={session} setSession={setSession} />}
        {activeView === "groups" && <GroupsView department={department} session={session} />}
      </div>
      <Taskbar activeView={activeView} setActiveView={setActiveView} session={session} onStatusChange={handleStatusChange} onPanic={handlePanic} onClockOut={handleClockOut} />
    </div>
  );
}