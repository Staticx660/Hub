import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Clock, Lock, ChevronLeft, Radio } from "lucide-react";
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
import PanicDialog from "@/components/cad/mdt/PanicDialog";
import { useKeybinds, loadKeybinds } from "@/hooks/useKeybinds";
import { clearPanic } from "@/lib/panic";
import { useCadTheme } from "@/hooks/useCadTheme";
import RetroClockInScreen from "@/components/cad/retro/RetroClockInScreen";
import { startPanicSound, stopPanicSound, playStatusBeep, stopPanicVoice, loadNotificationTones } from "@/components/cad/mdt/panicSound";
import MDTShell from "@/components/mdt/shell/MDTShell";
import { AlertBanner } from "@/components/mdt/shell/StatusStrip";
import UnitControls from "@/components/mdt/shell/UnitControls";
import { Radio as RadioIcon, Search as SearchIcon, FileText, PhoneCall, Users } from "lucide-react";
import CallQueueWorkspace from "@/components/mdt/workspaces/police/CallQueueWorkspace";
import UnitBoardWorkspace from "@/components/mdt/workspaces/police/UnitBoardWorkspace";
import LookupsWorkspace from "@/components/mdt/workspaces/police/LookupsWorkspace";
import RecordsWorkspace from "@/components/mdt/workspaces/police/RecordsWorkspace";
import MyCallWorkspace from "@/components/mdt/workspaces/police/MyCallWorkspace";

const OCRP_LOGO = "https://media.base44.com/images/public/6a441f279b9d3cd678958799/5a43a1b46_OCRP20.png";

// Workspace views that can be opened as browser-style tabs
const VIEW_LABELS = {
  dispatch: "Calls",
  units: "Units",
  mycall: "My Call",
  lookups: "Lookups",
  records: "Records",
};

export default function CADMDT() {
  const { deptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(location.state?.initialView || "dispatch");
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [clockInOpen, setClockInOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [keybinds, setKeybinds] = useState(loadKeybinds());
  const [keybindsOpen, setKeybindsOpen] = useState(false);
  const [panicOpen, setPanicOpen] = useState(false);
  const [myDepts, setMyDepts] = useState([]);
  const [newFileRequest, setNewFileRequest] = useState(0);
  const [openTabs, setOpenTabs] = useState(["dispatch"]);
  const { theme } = useCadTheme();
  const retro = theme === "retro";

  useEffect(() => {
    loadNotificationTones();
    const init = async () => {
      try {
        const dept = await base44.entities.CADDepartment.get(deptId);
        setDepartment(dept);
        const accessRes = await base44.functions.invoke('getUserCADDepartments', {});
        setMyDepts((accessRes.data.departments || []).filter(d => d.hasAccess));
        const deptAccess = accessRes.data.departments.find(d => d.id === deptId);
        if (deptAccess && !deptAccess.hasAccess) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
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

  useEffect(() => {
    if (!department) return;
    const unsub = base44.entities.CADSession.subscribe((event) => {
      // Live-sync own session (status/panic changes from dispatch or other tabs)
      if (event.type === "update" && event.data?.id === sessionRef.current?.id) {
        setSession(event.data);
      }
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
        group_id: formData.group_id || "", group_name: formData.group_name || "",
      });
      setSession(newSession);
      setClockInOpen(false);
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
      navigate("/cad");
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      // Going Available while panic is active clears the panic call automatically
      if (newStatus === "Available" && session.panic_active) {
        const updated = await clearPanic(session);
        setSession(updated);
        stopPanicSound();
        stopPanicVoice();
        playStatusBeep();
        return;
      }
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
    if (session.panic_active) {
      try {
        const updated = await clearPanic(session);
        setSession(updated);
        stopPanicSound();
        stopPanicVoice();
        playStatusBeep();
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      return;
    }
    setPanicOpen(true);
  };

  const openView = (key) => {
    setOpenTabs((tabs) => (tabs.includes(key) ? tabs : [...tabs, key]));
    setActiveView(key);
  };

  const closeTab = (key) => {
    setOpenTabs((tabs) => {
      if (tabs.length <= 1) return tabs;
      const next = tabs.filter((t) => t !== key);
      const isActive = activeView === key || (key === "mycall" && activeView === "callviewer");
      if (isActive) setActiveView(next[Math.max(0, tabs.indexOf(key) - 1)]);
      return next;
    });
  };

  useKeybinds(keybinds, {
    view_dispatch: () => openView("dispatch"),
    view_lookups: () => openView("lookups"),
    view_records: () => openView("records"),
    view_mycall: () => openView("mycall"),
    view_groups: () => setActiveView("groups"),
    status_available: () => session && handleStatusChange("Available"),
    status_busy: () => session && handleStatusChange("Busy"),
    status_oncall: () => session && handleStatusChange("On Call"),
    status_unavailable: () => session && handleStatusChange("Unavailable"),
    panic: () => session && handlePanic(),
  });

  if (loading) return <div className="flex justify-center items-center h-screen cad-gradient-bg cad-font"><div className="w-8 h-8 border-4 border-cad-border border-t-blue-500 rounded-full animate-spin" /></div>;
  if (accessDenied) return (
    <div className="flex flex-col items-center justify-center h-screen cad-gradient-bg cad-font gap-4">
      <Lock className="w-16 h-16 text-cad-dim" />
      <h1 className="text-2xl font-bold text-cad-text">Access Denied</h1>
      <p className="text-cad-muted">You need the Discord role or an Admin Panel department assignment for this department.</p>
      <Button onClick={() => navigate("/cad")} variant="outline" className="border-cad-border text-cad-muted hover:bg-cad-surface-2/50">Back to Departments</Button>
    </div>
  );
  if (!department) return <div className="flex justify-center items-center h-screen cad-gradient-bg cad-font text-cad-muted">Department not found</div>;

  if (!session) {
    if (retro) return (
      <RetroClockInScreen department={department} user={user} onClockIn={handleClockIn} clockInOpen={clockInOpen} setClockInOpen={setClockInOpen} subtitle={`${department.category} · MDT SYSTEM`} clockInLabel="Clock In & Start MDT" onBack={() => navigate("/cad")} icon={Radio} accentColor="#3b82f6" />
    );
    return (
      <div className="flex flex-col items-center justify-center h-screen cad-gradient-bg cad-font gap-6">
        <img src={OCRP_LOGO} alt="OCRP" className="w-24 h-24 rounded-2xl shadow-xl cad-accent-glow" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cad-text mb-1">{department.name}</h1>
          <p className="text-cad-muted">{department.category} · MDT System</p>
          <p className="text-cad-dim text-sm mt-2">You are not currently on duty</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/cad")} variant="outline" className="border-cad-border text-cad-muted hover:bg-cad-surface-2/50 gap-2 px-6"><ChevronLeft className="w-4 h-4" /> Back to Departments</Button>
          <Button onClick={() => setClockInOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 px-8 cad-accent-glow"><Clock className="w-4 h-4" /> Clock In & Start MDT</Button>
        </div>
        <ClockInDialog open={clockInOpen} onOpenChange={setClockInOpen} department={department} user={user} onClockIn={handleClockIn} />
      </div>
    );
  }

  const views = (
    <>
      {activeView === "dispatch" && <DispatchView department={department} session={session} setSession={setSession} setActiveView={setActiveView} setSelectedCallId={setSelectedCallId} />}
      {activeView === "callviewer" && <CallViewer department={department} session={session} selectedCallId={selectedCallId} onSelectCall={setSelectedCallId} onBack={() => setActiveView("dispatch")} />}
      {activeView === "lookups" && <LookupPanel department={department} session={session} />}
      {activeView === "pcr" && <PCRForm department={department} session={session} />}
      {activeView === "records" && <RecordsPanel department={department} session={session} />}
      {activeView === "mycall" && <MyCallView department={department} session={session} setSession={setSession} selectedCallId={selectedCallId} setSelectedCallId={setSelectedCallId} setActiveView={setActiveView} />}
      {activeView === "groups" && <GroupsView department={department} session={session} />}
    </>
  );

  const deptRoute = (d) =>
    d.category === "Fire" ? `/cad/fire/${d.id}`
    : d.category === "EMS" ? `/cad/ems/${d.id}`
    : d.category === "Civilian" ? `/cad/civilian/${d.id}`
    : d.category === "Dispatch" ? `/cad/dispatch`
    : `/cad/mdt/${d.id}`;

  const buildMenus = ({ openSearch, toggleDetail, detailCollapsed }) => [
    {
      label: "File",
      items: [
        { label: "New Report…", shortcut: "Ctrl+N", onSelect: () => { openView("records"); setNewFileRequest(n => n + 1); } },
        { label: "Global Search…", shortcut: "Ctrl+K", onSelect: openSearch },
        { separator: true },
        { label: "Clock Out & End Shift", onSelect: handleClockOut, danger: true },
        { label: "Close MDT", onSelect: () => navigate("/cad") },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Copy Callsign", onSelect: () => navigator.clipboard?.writeText(session.callsign || ""), disabled: !session.callsign },
        { label: "Copy Unit Info", onSelect: () => navigator.clipboard?.writeText(`${session.callsign || ""} ${session.user_name}${session.rank ? " (" + session.rank + ")" : ""}`.trim()) },
        { separator: true },
        { label: "Set Status: Available", onSelect: () => handleStatusChange("Available") },
        { label: "Set Status: Busy", onSelect: () => handleStatusChange("Busy") },
        { label: "Set Status: Unavailable", onSelect: () => handleStatusChange("Unavailable") },
        { separator: true },
        { label: session.panic_active ? "Clear Panic" : "Activate Panic", onSelect: handlePanic, danger: true },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Call Queue", onSelect: () => openView("dispatch") },
        { label: "Unit Board", onSelect: () => openView("units") },
        { label: "My Call", onSelect: () => openView("mycall") },
        { label: "Lookups", onSelect: () => openView("lookups") },
        { label: "Records", onSelect: () => openView("records") },
        { separator: true },
        { label: detailCollapsed ? "Show Status Detail" : "Hide Status Detail", onSelect: toggleDetail },
        { label: "Reload Workspace", onSelect: () => window.location.reload() },
      ],
    },
    {
      label: "Window",
      items: [
        ...myDepts.map(d => ({ label: d.name, disabled: d.id === deptId, onSelect: () => navigate(deptRoute(d)) })),
        { separator: true },
        { label: "CAD Home", onSelect: () => navigate("/cad") },
        { label: "Dispatch Center", onSelect: () => navigate("/cad/dispatch") },
        { label: "My Records", onSelect: () => navigate("/my-records") },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Keybind Settings…", onSelect: () => setKeybindsOpen(true) },
        { label: "Help Center", onSelect: () => navigate("/help") },
        { separator: true },
        { label: `About — ${department.name} MDT`, onSelect: () => toast({ title: `${department.name} MDT`, description: "OCRP Hub Mobile Data Terminal" }) },
      ],
    },
  ];

  // Police MDT runs on the new Windows-style workspace shell
  if (department.category === "Police" && !retro) {
    return (
      <>
        <MDTShell
          agency={department.name}
          subtitle="MDT"
          unit={`${session.callsign ? session.callsign + " · " : ""}${session.user_name}${session.rank ? " · " + session.rank : ""}`}
          status={{ label: session.panic_active ? "PANIC" : session.status }}
          navItems={[
            { key: "dispatch", label: "Calls", icon: RadioIcon },
            { key: "units", label: "Units", icon: Users },
            { key: "mycall", label: "My Call", icon: PhoneCall },
            { key: "lookups", label: "Lookups", icon: SearchIcon },
            { key: "records", label: "Records", icon: FileText },
          ]}
          active={activeView === "callviewer" ? "mycall" : activeView}
          onNavigate={openView}
          menus={buildMenus}
          tabs={openTabs.map(k => ({ key: k, label: VIEW_LABELS[k] || k }))}
          activeTab={activeView === "callviewer" ? "mycall" : activeView}
          onSelectTab={setActiveView}
          onAddTab={openView}
          onCloseTab={closeTab}
          tabAddOptions={Object.keys(VIEW_LABELS).filter(k => !openTabs.includes(k)).map(k => ({ key: k, label: VIEW_LABELS[k] }))}
          banner={session.panic_active ? <AlertBanner>PANIC ACTIVE — {session.callsign || session.user_name} — ALL UNITS RESPOND</AlertBanner> : null}
          headerRight={
            <UnitControls
              session={session}
              onStatusChange={handleStatusChange}
              onPanic={handlePanic}
              onOpenKeybinds={() => setKeybindsOpen(true)}
              onClockOut={handleClockOut}
            />
          }
        >
          {({ detailCollapsed }) => (
            activeView === "dispatch" ? (
              <CallQueueWorkspace
                department={department}
                session={session}
                setSession={setSession}
                onOpenCall={(id) => { setSelectedCallId(id); openView("mycall"); setActiveView("callviewer"); }}
                detailCollapsed={detailCollapsed}
              />
            ) : activeView === "units" ? (
              <UnitBoardWorkspace session={session} setSession={setSession} />
            ) : activeView === "lookups" ? (
              <LookupsWorkspace session={session} />
            ) : activeView === "records" ? (
              <RecordsWorkspace department={department} session={session} newFileRequest={newFileRequest} />
            ) : activeView === "mycall" || activeView === "callviewer" ? (
              <MyCallWorkspace
                department={department}
                session={session}
                setSession={setSession}
                selectedCallId={selectedCallId}
                setSelectedCallId={setSelectedCallId}
                setActiveView={setActiveView}
              />
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden">{views}</div>
            )
          )}
        </MDTShell>
        <PanicDialog open={panicOpen} department={department} session={session} onClose={() => setPanicOpen(false)} onActivated={(s) => setSession(s)} />
        <KeybindsDialog open={keybindsOpen} onOpenChange={setKeybindsOpen} keybinds={keybinds} setKeybinds={setKeybinds} />
      </>
    );
  }

  return (
    <div className={`flex flex-col h-screen cad-gradient-bg cad-font overflow-hidden ${retro ? "retro-shell" : ""}`}>
      {session.panic_active && <div className="bg-red-500/20 border-y border-red-500 text-red-400 text-center py-1.5 text-sm font-bold animate-pulse">🚨 PANIC ACTIVE — {session.callsign || session.user_name} — ALL UNITS RESPOND</div>}
      <div className="flex-1 overflow-hidden">{views}</div>
      <Taskbar activeView={activeView} setActiveView={(v) => { if (v === "dispatch" && department.category === "Fire") { navigate(`/cad/fire/${deptId}`); } else if (v === "dispatch" && department.category === "EMS") { navigate(`/cad/ems/${deptId}`); } else { setActiveView(v); } }} session={session} departmentCategory={department.category} onStatusChange={handleStatusChange} onPanic={handlePanic} onClockOut={handleClockOut} onOpenKeybinds={() => setKeybindsOpen(true)} onSessionUpdate={setSession} />
      <PanicDialog open={panicOpen} department={department} session={session} onClose={() => setPanicOpen(false)} onActivated={(s) => setSession(s)} />
      <KeybindsDialog open={keybindsOpen} onOpenChange={setKeybindsOpen} keybinds={keybinds} setKeybinds={setKeybinds} />
    </div>
  );
}