import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Taskbar from "@/components/cad/mdt/Taskbar";
import ClockInDialog from "@/components/cad/mdt/ClockInDialog";
import AddressSearch from "@/components/cad/mdt/AddressSearch";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";
import { useCadTheme } from "@/hooks/useCadTheme";
import RetroClockInScreen from "@/components/cad/retro/RetroClockInScreen";
import { Clock, Siren, Users, PhoneCall, Activity, Flame, Ambulance, Radio, Plus, X, MapPin, AlertTriangle, CheckCircle, Building2, Stethoscope, ChevronLeft } from "lucide-react";

export default function DepartmentBoard() {
  const { deptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [department, setDepartment] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockInOpen, setClockInOpen] = useState(false);
  const [calls, setCalls] = useState([]);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showIntake, setShowIntake] = useState(false);
  useCommunityBranding();
  const { theme } = useCadTheme();
  const retro = theme === "retro";

  useEffect(() => {
    const init = async () => {
      try {
        const dept = await base44.entities.CADDepartment.get(deptId);
        if (dept.category === "Dispatch") { navigate(`/cad/mdt/${deptId}`); return; }
        if (dept.category === "EMS") { navigate(`/cad/ems/${deptId}`); return; }
        if (dept.category === "Fire") { navigate(`/cad/fire/${deptId}`); return; }
        setDepartment(dept);
        const sessions = await base44.entities.CADSession.filter({ user_id: user.id, department_id: deptId, is_active: true });
        if (sessions.length > 0) setSession(sessions[0]);
        await loadData();
      } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      setLoading(false);
    };
    init();
  }, [deptId]);

  useEffect(() => {
    const unsub1 = base44.entities.ActiveCall.subscribe(() => loadData());
    const unsub2 = base44.entities.CADSession.subscribe(() => loadData());
    return () => { unsub1(); unsub2(); };
  }, []);

  const loadData = async () => {
    try {
      const [c, u, p, depts] = await Promise.all([
        base44.entities.ActiveCall.filter({ status: { $ne: "Closed" } }),
        base44.entities.CADUnit.list(),
        base44.entities.CADSession.filter({ is_active: true }),
        base44.entities.CADDepartment.list(),
      ]);
      const nonCivilianIds = depts.filter(d => d.category !== "Civilian").map(d => d.id);
      setCalls(c); setUnits(u); setPersonnel(p.filter(s => nonCivilianIds.includes(s.department_id)));
    } catch (e) { /* silent */ }
  };

  const handleClockIn = async (formData) => {
    try {
      const now = new Date().toISOString();
      const existing = await base44.entities.CADSession.filter({ user_id: user.id, department_id: deptId, is_active: true });
      for (const s of existing) await base44.entities.CADSession.update(s.id, { is_active: false, logout_time: now, status: "Unavailable" });
      const shift = await base44.entities.Shift.create({ member_id: user.id, department_id: deptId, member_name: formData.name, start_time: now, status: "In Progress" });
      const newSession = await base44.entities.CADSession.create({
        user_id: user.id, user_name: formData.name, department_id: deptId, department_name: department.name,
        callsign: formData.callsign, rank: formData.rank, status: "Available", login_time: now, is_active: true, panic_active: false, shift_id: shift.id,
      });
      setSession(newSession); setClockInOpen(false);
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
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    const handler = () => performClockOut(sessionRef.current);
    window.addEventListener('beforeunload', handler);
    return () => { window.removeEventListener('beforeunload', handler); };
  }, []);

  const handleClockOut = async () => {
    if (!confirm("Clock out and end your shift?")) return;
    await performClockOut(session);
    setSession(null); setSelectedCall(null);
    toast({ title: "Clocked Out" });
    navigate("/cad");
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await base44.entities.CADSession.update(session.id, { status: newStatus });
      setSession({ ...session, status: newStatus });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handlePanic = async () => {
    try {
      const newPanic = !session.panic_active;
      await base44.entities.CADSession.update(session.id, { panic_active: newPanic, status: newPanic ? "Panic" : "Available" });
      setSession({ ...session, panic_active: newPanic, status: newPanic ? "Panic" : "Available" });
      toast({ title: newPanic ? "🚨 PANIC ACTIVATED" : "Panic Cancelled", variant: newPanic ? "destructive" : "default" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen cad-gradient-bg cad-font"><div className="w-8 h-8 border-4 border-cad-border border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!department) return <div className="flex justify-center items-center h-screen cad-gradient-bg cad-font text-cad-muted">Department not found</div>;

  if (!session) {
    if (retro) {
      const BoardIcon = department.category === "Fire" ? Flame : department.category === "EMS" ? Ambulance : Radio;
      return <RetroClockInScreen department={department} user={user} onClockIn={handleClockIn} clockInOpen={clockInOpen} setClockInOpen={setClockInOpen} subtitle={`${department.category} · COMMAND BOARD`} clockInLabel="Clock In & Start Board" onBack={() => navigate("/cad")} icon={BoardIcon} accentColor={department.color || "#3b82f6"} />;
    }
    return (
      <div className="flex flex-col items-center justify-center h-screen cad-gradient-bg cad-font gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: (department.color || "#3b82f6") + "20" }}>
          {department.category === "Fire" ? <Flame className="w-10 h-10" style={{ color: department.color || "#ef4444" }} /> : department.category === "EMS" ? <Ambulance className="w-10 h-10" style={{ color: department.color || "#22c55e" }} /> : <Radio className="w-10 h-10" style={{ color: department.color || "#3b82f6" }} />}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cad-text mb-1">{department.name}</h1>
          <p className="text-cad-muted">{department.category} · Command Board</p>
          <p className="text-cad-dim text-sm mt-2">You are not currently on duty</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/cad")} variant="outline" className="border-cad-border text-cad-muted hover:bg-cad-surface-2/50 gap-2 px-6"><ChevronLeft className="w-4 h-4" /> Back to Departments</Button>
          <Button onClick={() => setClockInOpen(true)} style={{ backgroundColor: department.color || "#3b82f6" }} className="gap-2 px-8"><Clock className="w-4 h-4" /> Clock In & Start Board</Button>
        </div>
        <ClockInDialog open={clockInOpen} onOpenChange={setClockInOpen} department={department} user={user} onClockIn={handleClockIn} />
      </div>
    );
  }

  const activeCalls = calls.filter(c => c.status !== "Closed");
  const deptCalls = activeCalls.filter(c => c.department_id === deptId);
  const deptUnits = units.filter(u => u.department_id === deptId);
  const deptPersonnel = personnel.filter(p => p.department_id === deptId);
  const isDispatch = department.category === "Dispatch";
  const isFire = department.category === "Fire";
  const isEMS = department.category === "EMS";
  const accent = department.color || "#3b82f6";
  const statusColor = (s) => s === "Available" ? "bg-green-400" : s === "On Duty" || s === "On Call" ? "bg-red-400" : s === "Panic" ? "bg-red-500 animate-pulse" : "bg-gray-400";
  const dispatchGroups = isDispatch ? Object.entries(personnel.reduce((acc, p) => {
    const dept = p.department_name || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(p);
    return acc;
  }, {})) : [];

  return (
    <div className={`flex flex-col h-screen cad-gradient-bg cad-font overflow-hidden ${retro ? "retro-shell" : ""}`}>
      {session.panic_active && <div className="bg-red-500/20 border-y border-red-500 text-red-400 text-center py-1.5 text-sm font-bold animate-pulse">🚨 PANIC ACTIVE — {session.callsign || session.user_name}</div>}
      
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Active Calls */}
        <div className="w-80 border-r border-cad-border/50 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-cad-border/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-cad-text flex items-center gap-2"><Activity className="w-4 h-4" style={{ color: accent }} /> Active Calls</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cad-surface-2 text-cad-muted">{isDispatch ? activeCalls.length : deptCalls.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {(isDispatch ? activeCalls : deptCalls).length === 0 ? (
              <p className="text-xs text-cad-dim text-center py-8">No active calls</p>
            ) : (
              (isDispatch ? activeCalls : deptCalls).map(call => (
                <button key={call.id} onClick={() => setSelectedCall(call)} className={`w-full text-left p-2.5 rounded-lg border transition-colors ${selectedCall?.id === call.id ? "bg-cad-surface-2 border-slate-600" : "bg-slate-900 border-slate-800 hover:border-cad-border"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${call.priority === "1 - High" ? "text-red-400 bg-red-500/10" : call.priority === "2 - Medium" ? "text-yellow-400 bg-yellow-500/10" : "text-green-400 bg-green-500/10"}`}>{call.priority}</span>
                    {call.run_number && <span className="text-[10px] text-cad-dim font-mono">{call.run_number}</span>}
                  </div>
                  <p className="text-sm text-cad-text font-medium truncate">{call.call_type}</p>
                  <p className="text-xs text-cad-dim flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {call.location}</p>
                  {call.assigned_unit_ids?.length > 0 && <p className="text-[10px] text-cyan-400 mt-1">{call.assigned_unit_ids.length} unit(s) assigned</p>}
                </button>
              ))
            )}
          </div>
          {isDispatch && (
            <div className="p-2 border-t border-cad-border/50">
              <button onClick={() => setShowIntake(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-cad-text" style={{ backgroundColor: accent }}><Plus className="w-4 h-4" /> New 911 Call</button>
            </div>
          )}
        </div>

        {/* Center Panel - Call Details or Board */}
        <div className="flex-1 overflow-y-auto">
          {selectedCall ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-cad-text">{selectedCall.call_type}</h2>
                  {selectedCall.run_number && <p className="text-sm font-mono" style={{ color: accent }}>{selectedCall.run_number}</p>}
                </div>
                <button onClick={() => setSelectedCall(null)} className="text-cad-muted hover:text-cad-text"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-cad-dim">Status: </span><span className="text-cad-text">{selectedCall.status}</span></div>
                  <div><span className="text-cad-dim">Priority: </span><span className="text-cad-text">{selectedCall.priority}</span></div>
                  <div><span className="text-cad-dim">Location: </span><span className="text-cad-text">{selectedCall.location}</span></div>
                  {selectedCall.caller_name && <div><span className="text-cad-dim">Caller: </span><span className="text-cad-text">{selectedCall.caller_name}</span></div>}
                  {selectedCall.caller_phone && <div><span className="text-cad-dim">Phone: </span><span className="text-cad-text">{selectedCall.caller_phone}</span></div>}
                </div>
                {selectedCall.description && <div className="bg-cad-bg-solid rounded-lg p-3"><p className="text-xs text-cad-dim mb-1">Description:</p><p className="text-sm text-cad-muted">{selectedCall.description}</p></div>}
                {selectedCall.cad_notes && <div className="bg-cad-bg-solid rounded-lg p-3"><p className="text-xs text-cad-dim mb-1">CAD Notes:</p><p className="text-sm text-cad-muted">{selectedCall.cad_notes}</p></div>}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="border-cad-border text-cad-muted hover:bg-cad-surface-2" onClick={() => { base44.entities.ActiveCall.update(selectedCall.id, { status: "Closed" }); setSelectedCall(null); loadData(); toast({ title: "Call closed" }); }}>
                    <CheckCircle className="w-4 h-4" /> Close Call
                  </Button>
                  <Link to={`/cad/mdt/${deptId}`}><Button size="sm" variant="outline" className="border-cad-border text-cad-muted hover:bg-cad-surface-2"><Siren className="w-4 h-4" /> Open MDT</Button></Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* Category-specific board header */}
              <div className="flex items-center gap-3 mb-4">
                {isFire ? <Flame className="w-6 h-6 text-red-400" /> : isEMS ? <Ambulance className="w-6 h-6 text-green-400" /> : <Radio className="w-6 h-6" style={{ color: accent }} />}
                <div>
                  <h2 className="text-lg font-bold text-cad-text">{department.name} Command Board</h2>
                  <p className="text-xs text-cad-dim">{department.category} Department</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-cad-surface/80 border border-cad-border/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-cyan-400" /><span className="text-xs text-cad-dim uppercase">Active Calls</span></div>
                  <p className="text-2xl font-bold text-cad-text">{isDispatch ? activeCalls.length : deptCalls.length}</p>
                </div>
                <div className="bg-cad-surface/80 border border-cad-border/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1"><Siren className="w-4 h-4 text-yellow-400" /><span className="text-xs text-cad-dim uppercase">Units</span></div>
                  <p className="text-2xl font-bold text-cad-text">{deptUnits.length}</p>
                </div>
                <div className="bg-cad-surface/80 border border-cad-border/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-green-400" /><span className="text-xs text-cad-dim uppercase">On Duty</span></div>
                  <p className="text-2xl font-bold text-cad-text">{deptPersonnel.length}</p>
                </div>
                <div className="bg-cad-surface/80 border border-cad-border/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-cad-dim uppercase">High Priority</span></div>
                  <p className="text-2xl font-bold text-cad-text">{(isDispatch ? activeCalls : deptCalls).filter(c => c.priority === "1 - High").length}</p>
                </div>
              </div>

              {/* Category-specific content */}
              {isDispatch && <DispatchContent calls={activeCalls} units={units} personnel={personnel} accent={accent} onAssign={loadData} session={session} />}
              {isFire && <FireContent calls={deptCalls} units={deptUnits} personnel={deptPersonnel} accent={accent} deptId={deptId} />}
              {isEMS && <EMSContent calls={deptCalls} units={deptUnits} personnel={deptPersonnel} accent={accent} deptId={deptId} />}
              {!isDispatch && !isFire && !isEMS && (
                <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-6 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-cad-dim mb-3" />
                  <p className="text-cad-muted">Select a call from the left to view details</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Units & Personnel */}
        <div className="w-72 border-l border-cad-border/50 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-cad-border/50">
            <h2 className="text-sm font-bold text-cad-text flex items-center gap-2"><Siren className="w-4 h-4 text-yellow-400" /> Active Units</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {isDispatch ? (
              dispatchGroups.length === 0 ? <p className="text-xs text-cad-dim text-center py-8">No units on duty</p> : dispatchGroups.map(([deptName, members]) => (
                <div key={deptName}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-400 px-1 mb-1.5">{deptName} ({members.length})</p>
                  <div className="space-y-1.5">
                    {members.map(p => (
                      <div key={p.id} className="bg-cad-surface/80 border border-cad-border/50 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {p.callsign && <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1 rounded">{p.callsign}</span>}
                            <span className="text-xs text-cad-text font-medium truncate">{p.user_name}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor(p.status)}`} />
                            <span className="text-[10px] text-cad-dim">{p.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : deptPersonnel.length === 0 ? (
              <p className="text-xs text-cad-dim text-center py-8">No units on duty</p>
            ) : (
              deptPersonnel.map(p => (
                <div key={p.id} className="bg-cad-surface/80 border border-cad-border/50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p.callsign && <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1 rounded">{p.callsign}</span>}
                      <span className="text-sm text-cad-text font-medium truncate">{p.user_name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusColor(p.status)}`} />
                      <span className="text-[10px] text-cad-dim">{p.status}</span>
                    </div>
                  </div>
                  {p.rank && <p className="text-[10px] text-cad-dim mt-0.5">{p.rank}</p>}
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-cad-border/50">
            <Link to="/cad/admin" className="block text-center text-xs text-cad-dim hover:text-cad-text py-1">Manage in Admin Panel →</Link>
          </div>
        </div>
      </div>

      {/* 911 Intake Dialog */}
      {showIntake && <CallIntakeDialog department={department} session={session} onClose={() => setShowIntake(false)} onSaved={() => { setShowIntake(false); loadData(); }} />}

      <Taskbar activeView="dispatch" setActiveView={(v) => { if (v !== "dispatch") navigate(`/cad/mdt/${deptId}`); }} session={session} departmentCategory={department.category} onStatusChange={handleStatusChange} onPanic={handlePanic} onClockOut={handleClockOut} onOpenKeybinds={() => {}} />
    </div>
  );
}

function DispatchContent({ calls, units, personnel, accent, onAssign, session }) {
  const unassigned = calls.filter(c => !c.assigned_unit_ids?.length);
  const assigned = calls.filter(c => c.assigned_unit_ids?.length > 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400" /> Unassigned ({unassigned.length})</h3>
          <div className="space-y-2">
            {unassigned.length === 0 ? <p className="text-xs text-cad-dim text-center py-4">All calls assigned</p> : unassigned.map(call => (
              <div key={call.id} className="bg-cad-bg-solid rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-cad-text">{call.call_type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${call.priority === "1 - High" ? "text-red-400 bg-red-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>{call.priority}</span>
                </div>
                <p className="text-xs text-cad-dim">{call.location}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Assigned ({assigned.length})</h3>
          <div className="space-y-2">
            {assigned.length === 0 ? <p className="text-xs text-cad-dim text-center py-4">No assigned calls</p> : assigned.map(call => (
              <div key={call.id} className="bg-cad-bg-solid rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-cad-text">{call.call_type}</span>
                  <span className="text-[10px] text-cyan-400">{call.assigned_unit_ids.length} unit(s)</span>
                </div>
                <p className="text-xs text-cad-dim">{call.location}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" /> All Active Personnel ({personnel.length})</h3>
        <div className="space-y-3">
          {Object.entries(personnel.reduce((acc, p) => {
            const dept = p.department_name || "Unassigned";
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(p);
            return acc;
          }, {})).map(([deptName, members]) => (
            <div key={deptName}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-400 mb-1.5">{deptName} ({members.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {members.map(p => (
                  <div key={p.id} className="bg-cad-bg-solid rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-cad-text font-medium truncate">{p.user_name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === "Available" ? "bg-green-400" : p.status === "On Duty" || p.status === "On Call" ? "bg-red-400" : "bg-gray-400"}`} />
                    </div>
                    {p.callsign && <span className="text-[10px] font-mono text-cad-dim">{p.callsign}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FireContent({ calls, units, personnel, accent, deptId }) {
  const fireCalls = calls.filter(c => c.call_type?.toLowerCase().includes("fire") || c.call_type?.toLowerCase().includes("rescue") || c.call_type?.toLowerCase().includes("hazmat"));
  return (
    <div className="space-y-4">
      <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-red-400" /> Active Fire Incidents</h3>
        <div className="space-y-2">
          {fireCalls.length === 0 && calls.length === 0 ? <p className="text-xs text-cad-dim text-center py-4">No active incidents</p> :
            calls.map(call => (
              <div key={call.id} className="bg-cad-bg-solid rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-cad-text font-medium">{call.call_type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${call.priority === "1 - High" ? "text-red-400 bg-red-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>{call.priority}</span>
                </div>
                <p className="text-xs text-cad-dim flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</p>
                <p className="text-[10px] text-cyan-400 mt-1">{call.assigned_unit_ids?.length || 0} apparatus assigned</p>
              </div>
            ))
          }
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><Siren className="w-4 h-4 text-yellow-400" /> Apparatus ({units.length})</h3>
          <div className="space-y-1.5">
            {units.length === 0 ? <p className="text-xs text-cad-dim text-center py-4">No apparatus</p> : units.map(u => (
              <div key={u.id} className="bg-cad-bg-solid rounded-lg p-2 flex items-center justify-between">
                <span className="text-xs text-cad-text">{u.name || u.identifier || "Unit"}</span>
                <span className={`text-[10px] ${u.status === "Available" ? "text-green-400" : "text-yellow-400"}`}>{u.status || "Unknown"}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-green-400" /> Personnel ({personnel.length})</h3>
          <div className="space-y-1.5">
            {personnel.length === 0 ? <p className="text-xs text-cad-dim text-center py-4">No personnel on duty</p> : personnel.map(p => (
              <div key={p.id} className="bg-cad-bg-solid rounded-lg p-2 flex items-center justify-between">
                <div><span className="text-xs text-cad-text">{p.user_name}</span>{p.rank && <span className="text-[10px] text-cad-dim ml-2">{p.rank}</span>}</div>
                <span className={`w-1.5 h-1.5 rounded-full ${p.status === "Available" ? "bg-green-400" : "bg-red-400"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EMSContent({ calls, units, personnel, accent, deptId }) {
  return (
    <div className="space-y-4">
      <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><Ambulance className="w-4 h-4 text-green-400" /> Active Medical Calls</h3>
        <div className="space-y-2">
          {calls.length === 0 ? <p className="text-xs text-cad-dim text-center py-4">No active medical calls</p> : calls.map(call => (
            <div key={call.id} className="bg-cad-bg-solid rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-cad-text font-medium">{call.call_type}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${call.priority === "1 - High" ? "text-red-400 bg-red-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>{call.priority}</span>
              </div>
              <p className="text-xs text-cad-dim flex items-center gap-1"><MapPin className="w-3 h-3" /> {call.location}</p>
              {call.caller_name && <p className="text-[10px] text-cad-dim mt-1">Patient: {call.caller_name}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><Siren className="w-4 h-4 text-yellow-400" /> Ambulances ({units.length})</h3>
          <div className="space-y-1.5">
            {units.length === 0 ? <p className="text-xs text-cad-dim text-center py-4">No ambulances</p> : units.map(u => (
              <div key={u.id} className="bg-cad-bg-solid rounded-lg p-2 flex items-center justify-between">
                <span className="text-xs text-cad-text">{u.name || u.identifier || "Unit"}</span>
                <span className={`text-[10px] ${u.status === "Available" ? "text-green-400" : u.status === "Transporting" ? "text-yellow-400" : "text-red-400"}`}>{u.status || "Unknown"}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-cad-surface/80 border border-cad-border/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-cad-text mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-green-400" /> Medics ({personnel.length})</h3>
          <div className="space-y-1.5">
            {personnel.length === 0 ? <p className="text-xs text-cad-dim text-center py-4">No medics on duty</p> : personnel.map(p => (
              <div key={p.id} className="bg-cad-bg-solid rounded-lg p-2 flex items-center justify-between">
                <div><span className="text-xs text-cad-text">{p.user_name}</span>{p.rank && <span className="text-[10px] text-cad-dim ml-2">{p.rank}</span>}</div>
                <span className={`w-1.5 h-1.5 rounded-full ${p.status === "Available" ? "bg-green-400" : "bg-red-400"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CallIntakeDialog({ department, session, onClose, onSaved }) {
  const [form, setForm] = useState({ call_type: "", priority: "2 - Medium", location: "", cross_streets: "", description: "", caller_name: "", caller_phone: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!form.call_type.trim() || !form.location.trim()) { toast({ title: "Call type and location required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const runNum = `911-${Date.now().toString().slice(-6)}`;
      await base44.entities.ActiveCall.create({ ...form, status: "Pending", department_id: department.id, run_number: runNum });
      toast({ title: "911 call created" });
      onSaved();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-cad-surface border border-cad-border rounded-xl p-5 w-full max-w-md cad-font">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-cad-text flex items-center gap-2"><PhoneCall className="w-5 h-5 text-cyan-400" /> New 911 Call</h2>
          <button onClick={onClose} className="text-cad-muted hover:text-cad-text"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div><Label className="text-cad-muted text-xs">Call Type *</Label><Input value={form.call_type} onChange={e => setForm({ ...form, call_type: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" placeholder="e.g. Structure Fire, Medical Emergency" /></div>
          <div><Label className="text-cad-muted text-xs">Priority</Label>
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger className="bg-cad-surface-2 border-cad-border text-cad-text"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-cad-surface-2 border-cad-border">{["1 - High", "2 - Medium", "3 - Low"].map(p => <SelectItem key={p} value={p} className="text-cad-text">{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-cad-muted text-xs">Location *</Label><AddressSearch value={form.location} onChange={v => setForm({ ...form, location: v })} className="w-full bg-cad-surface-2 border border-cad-border text-cad-text text-sm h-9 rounded-md pl-8 pr-2 focus-visible:ring-1 focus-visible:ring-slate-600 placeholder:text-cad-dim" placeholder="Search address..." /></div>
          <div><Label className="text-cad-muted text-xs">Cross Streets</Label><Input value={form.cross_streets} onChange={e => setForm({ ...form, cross_streets: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" placeholder="e.g. Vinewood Blvd & Alta St" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-cad-muted text-xs">Caller Name</Label><Input value={form.caller_name} onChange={e => setForm({ ...form, caller_name: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" /></div>
            <div><Label className="text-cad-muted text-xs">Caller Phone</Label><Input value={form.caller_phone} onChange={e => setForm({ ...form, caller_phone: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" /></div>
          </div>
          <div><Label className="text-cad-muted text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" rows={2} /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-cyan-600 hover:bg-cyan-700">{saving ? "Creating..." : "Create Call"}</Button>
          <Button onClick={onClose} variant="outline" className="border-cad-border text-cad-muted">Cancel</Button>
        </div>
      </div>
    </div>
  );
}