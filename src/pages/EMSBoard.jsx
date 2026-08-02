import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Taskbar from "@/components/cad/mdt/Taskbar";
import ClockInDialog from "@/components/cad/mdt/ClockInDialog";
import CallViewer from "@/components/cad/mdt/CallViewer";
import GroupsView from "@/components/cad/mdt/GroupsView";
import EMSDashboard from "@/components/cad/ems/EMSDashboard";
import OpsBoardShell from "@/components/mdt/shell/OpsBoardShell";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";
import { useCadTheme } from "@/hooks/useCadTheme";
import RetroClockInScreen from "@/components/cad/retro/RetroClockInScreen";
import { Clock, Ambulance, ChevronLeft, ArrowLeft, FileText } from "lucide-react";
import PanicDialog from "@/components/cad/mdt/PanicDialog";
import { useKeybinds, loadKeybinds } from "@/hooks/useKeybinds";
import { clearPanic } from "@/lib/panic";
import { playStatusBeep, loadNotificationTones } from "@/components/cad/mdt/panicSound";

export default function EMSBoard() {
  const { deptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockInOpen, setClockInOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [panicOpen, setPanicOpen] = useState(false);
  useCommunityBranding();
  const { theme } = useCadTheme();
  const retro = theme === "retro";

  useEffect(() => {
    loadNotificationTones();
    const init = async () => {
      try {
        const dept = await base44.entities.CADDepartment.get(deptId);
        setDepartment(dept);
        const sessions = await base44.entities.CADSession.filter({ user_id: user.id, department_id: deptId, is_active: true });
        if (sessions.length > 0) {
          const sorted = [...sessions].sort((a, b) => new Date(b.login_time || b.created_date) - new Date(a.login_time || a.created_date));
          setSession(sorted[0]);
          for (const stale of sorted.slice(1)) {
            base44.entities.CADSession.update(stale.id, { is_active: false, logout_time: new Date().toISOString(), status: "Unavailable" });
          }
        }
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    init();
  }, [deptId]);

  const sessionRef = useRef(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Live-sync own session (status changes from dispatch or other tabs)
  useEffect(() => {
    const unsub = base44.entities.CADSession.subscribe((event) => {
      const cur = sessionRef.current;
      if (cur && event.type === "update" && event.data?.id === cur.id) setSession(event.data);
    });
    return unsub;
  }, []);

  const [keybinds] = useState(loadKeybinds);

  const handleClockIn = async (formData) => {
    try {
      const now = new Date().toISOString();
      const existing = await base44.entities.CADSession.filter({ user_id: user.id, department_id: deptId, is_active: true });
      for (const s of existing) await base44.entities.CADSession.update(s.id, { is_active: false, logout_time: now, status: "Unavailable" });
      const shift = await base44.entities.Shift.create({ member_id: user.id, department_id: deptId, member_name: formData.name, start_time: now, status: "In Progress" });
      const newSession = await base44.entities.CADSession.create({
        user_id: user.id, user_name: formData.name, department_id: deptId, department_name: department.name,
        callsign: formData.callsign, rank: formData.rank, status: "Available", login_time: now, is_active: true, panic_active: false, shift_id: shift.id,
        group_id: formData.group_id || "", group_name: formData.group_name || "",
      });
      setSession(newSession); setClockInOpen(false);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const performClockOut = async (s) => {
    if (!s) return;
    try {
      const now = new Date().toISOString();
      await base44.entities.CADSession.update(s.id, { is_active: false, logout_time: now, status: "Unavailable" });
      if (s.shift_id) {
        const duration = (new Date(now) - new Date(s.login_time)) / (1000 * 60 * 60);
        await base44.entities.Shift.update(s.shift_id, { end_time: now, duration_hours: duration, status: "Completed" });
      }
    } catch (e) { /* silent */ }
  };



  const handleClockOut = async () => {
    if (!confirm("Clock out and end your shift?")) return;
    await performClockOut(session);
    setSession(null);
    navigate("/cad");
  };

  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === "Available" && session.panic_active) {
        const updated = await clearPanic(session);
        setSession(updated);
        playStatusBeep();
        return;
      }
      await base44.entities.CADSession.update(session.id, { status: newStatus });
      setSession({ ...session, status: newStatus });
      playStatusBeep();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handlePanic = async () => {
    if (session.panic_active) {
      try {
        const updated = await clearPanic(session);
        setSession(updated);
        playStatusBeep();
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      return;
    }
    setPanicOpen(true);
  };

  useKeybinds(keybinds, {
    status_available: () => session && handleStatusChange("Available"),
    status_busy: () => session && handleStatusChange("Busy"),
    status_oncall: () => session && handleStatusChange("On Call"),
    status_unavailable: () => session && handleStatusChange("Unavailable"),
    panic: () => session && handlePanic(),
  });

  const newCall = async () => {
    try {
      const runNum = `911-${Date.now().toString().slice(-6)}`;
      const c = await base44.entities.ActiveCall.create({
        call_type: "New Call", priority: "2 - Medium", status: "Pending", location: "", description: "",
        department_id: department.id, run_number: runNum, assigned_unit_ids: [], cad_notes: "",
        call_origin: "911", postal: "", block: "",
      });
      toast({ title: "New call created", description: runNum });
      setSelectedCallId(c.id);
      setActiveView("callviewer");
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const openCall = (callId) => { setSelectedCallId(callId); setActiveView("callviewer"); };

  const enterprise = !retro && department && session;

  if (loading) return <div className="flex justify-center items-center h-screen cad-gradient-bg cad-font"><div className="w-8 h-8 border-4 border-cad-border border-t-green-500 rounded-full animate-spin" /></div>;
  if (!department) return <div className="flex justify-center items-center h-screen cad-gradient-bg cad-font text-cad-muted">Department not found</div>;

  if (!session) {
    if (retro) return <RetroClockInScreen department={department} user={user} onClockIn={handleClockIn} clockInOpen={clockInOpen} setClockInOpen={setClockInOpen} subtitle="EMS OPERATIONS BOARD" clockInLabel="Clock In" onBack={() => navigate("/cad")} icon={Ambulance} accentColor="#22c55e" />;
    return (
      <div className="flex flex-col items-center justify-center h-screen cad-gradient-bg cad-font gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-green-500/10 cad-accent-glow">
          <Ambulance className="w-10 h-10 text-green-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cad-text mb-1">{department.name}</h1>
          <p className="text-cad-muted">EMS Operations Board</p>
          <p className="text-cad-dim text-sm mt-2">You are not currently on duty</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/cad")} variant="outline" className="border-cad-border text-cad-muted hover:bg-cad-surface-2/50 gap-2 px-6"><ChevronLeft className="w-4 h-4" /> Back</Button>
          <Button onClick={() => setClockInOpen(true)} className="bg-green-600 hover:bg-green-700 gap-2 px-8 cad-accent-glow"><Clock className="w-4 h-4" /> Clock In</Button>
        </div>
        <ClockInDialog open={clockInOpen} onOpenChange={setClockInOpen} department={department} user={user} onClockIn={handleClockIn} />
      </div>
    );
  }

  if (enterprise) {
    return (
      <>
        <OpsBoardShell
          department={department}
          session={session}
          setSession={setSession}
          subtitle="EMS Operations"
          onStatusChange={handleStatusChange}
          onPanic={handlePanic}
          onClockOut={handleClockOut}
          onNewCall={newCall}
          selectedCallId={selectedCallId}
          setSelectedCallId={setSelectedCallId}
        />
        <PanicDialog open={panicOpen} department={department} session={session} onClose={() => setPanicOpen(false)} onActivated={(s) => setSession(s)} />
      </>
    );
  }

  return (
    <div className={`flex flex-col h-screen cad-gradient-bg cad-font overflow-hidden ${retro ? "retro-shell" : ""}`}>
      {session.panic_active && <div className="bg-red-500/20 border-y border-red-500 text-red-400 text-center py-1.5 text-sm font-bold animate-pulse">🚨 PANIC ACTIVE — {session.callsign || session.user_name}</div>}

      {activeView === "callviewer" && (
        <div className="flex items-center gap-2 px-4 py-2 cad-glass border-b border-cad-border/50">
          <Button onClick={() => setActiveView("dashboard")} variant="ghost" size="sm" className="text-cad-muted hover:bg-cad-surface-2/50 gap-1.5"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
          <Link to={`/cad/mdt/${deptId}`}><Button variant="ghost" size="sm" className="text-cad-muted hover:bg-cad-surface-2/50 gap-1.5"><FileText className="w-4 h-4" /> PCR / MDT</Button></Link>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeView === "dashboard" && (
          <EMSDashboard department={department} session={session} setSession={setSession} onOpenCall={openCall} onNewCall={newCall} onManageGroups={() => setActiveView("groups")} />
        )}
        {activeView === "callviewer" && (
          <CallViewer department={department} session={session} selectedCallId={selectedCallId} onSelectCall={setSelectedCallId} onBack={() => setActiveView("dashboard")} />
        )}
        {activeView === "groups" && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 py-2 cad-glass border-b border-cad-border/50">
              <Button onClick={() => setActiveView("dashboard")} variant="ghost" size="sm" className="text-cad-muted hover:bg-cad-surface-2/50 gap-1.5"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>
            </div>
            <div className="flex-1 overflow-hidden"><GroupsView department={department} session={session} /></div>
          </div>
        )}
      </div>

      <PanicDialog open={panicOpen} department={department} session={session} onClose={() => setPanicOpen(false)} onActivated={(s) => setSession(s)} />

      <Taskbar activeView="dispatch" setActiveView={(v) => { if (v !== "dispatch") navigate(`/cad/mdt/${deptId}`, { state: { initialView: v } }); }} session={session} departmentCategory={department.category} onStatusChange={handleStatusChange} onPanic={handlePanic} onClockOut={handleClockOut} onOpenKeybinds={() => {}} />
    </div>
  );
}