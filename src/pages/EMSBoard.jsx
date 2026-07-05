import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Taskbar from "@/components/cad/mdt/Taskbar";
import ClockInDialog from "@/components/cad/mdt/ClockInDialog";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";
import { Clock, Ambulance, Activity, Heart, Plus, X, MapPin, AlertTriangle, CheckCircle, Stethoscope, ChevronLeft, Hospital, User, Phone, Siren, Truck, BedDouble } from "lucide-react";

const TRANSPORT_STATUS = ["Available", "Responding", "On Scene", "Transporting", "At Hospital", "Offline"];
const HOSPITALS = ["Pillbox Hill Medical Center", "Central Los Santos Medical", "Mount Zonah Medical", "Sandy Shores Medical", "Paleto Bay Care"];

export default function EMSBoard() {
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
  const [pcrs, setPcrs] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  useCommunityBranding();

  useEffect(() => {
    const init = async () => {
      try {
        const dept = await base44.entities.CADDepartment.get(deptId);
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
    const u1 = base44.entities.ActiveCall.subscribe(() => loadData());
    const u2 = base44.entities.CADSession.subscribe(() => loadData());
    return () => { u1(); u2(); };
  }, []);

  const loadData = async () => {
    try {
      const [c, u, p, pc] = await Promise.all([
        base44.entities.ActiveCall.filter({ status: { $ne: "Closed" } }),
        base44.entities.CADUnit.filter({ department_id: deptId }),
        base44.entities.CADSession.filter({ is_active: true, department_id: deptId }),
        base44.entities.PatientCareReport.filter({ department_id: deptId }, "-created_date", 20),
      ]);
      setCalls(c); setUnits(u); setPersonnel(p); setPcrs(pc);
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

  const setStatus = async (unitId, status) => {
    try {
      await base44.entities.CADUnit.update(unitId, { status });
      loadData();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const closeCall = async (callId) => {
    if (!confirm("Mark this call as cleared?")) return;
    try {
      await base44.entities.ActiveCall.update(callId, { status: "Closed" });
      toast({ title: "Call cleared" });
      setSelectedCall(null);
      loadData();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-950"><div className="w-8 h-8 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin" /></div>;
  if (!department) return <div className="flex justify-center items-center h-screen bg-slate-950 text-slate-400">Department not found</div>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-green-500/10">
          <Ambulance className="w-10 h-10 text-green-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">{department.name}</h1>
          <p className="text-slate-400">EMS Operations Board</p>
          <p className="text-slate-500 text-sm mt-2">You are not currently on duty</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/cad")} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2 px-6"><ChevronLeft className="w-4 h-4" /> Back to Departments</Button>
          <Button onClick={() => setClockInOpen(true)} className="bg-green-600 hover:bg-green-700 gap-2 px-8"><Clock className="w-4 h-4" /> Clock In</Button>
        </div>
        <ClockInDialog open={clockInOpen} onOpenChange={setClockInOpen} department={department} user={user} onClockIn={handleClockIn} />
      </div>
    );
  }

  const accent = department.color || "#22c55e";
  const activeCalls = calls;
  const available = units.filter(u => u.status === "Available").length;
  const transporting = units.filter(u => u.status === "Transporting").length;
  const atHospital = units.filter(u => u.status === "At Hospital").length;
  const onScene = units.filter(u => u.status === "On Scene").length;

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {session.panic_active && <div className="bg-red-500/20 border-y border-red-500 text-red-400 text-center py-1.5 text-sm font-bold animate-pulse">🚨 PANIC ACTIVE — {session.callsign || session.user_name}</div>}

      {/* Top Stats Bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Ambulance className="w-5 h-5 text-green-400" />
          <div>
            <h1 className="text-sm font-bold text-white">{department.name}</h1>
            <p className="text-[10px] text-slate-500">EMS Operations</p>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-800 mx-1" />
        <div className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-red-400" /><span className="text-lg font-bold text-white">{activeCalls.length}</span><span className="text-[10px] text-slate-500 uppercase">Calls</span></div>
        <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-lg font-bold text-white">{available}</span><span className="text-[10px] text-slate-500 uppercase">Available</span></div>
        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-yellow-400" /><span className="text-lg font-bold text-white">{onScene}</span><span className="text-[10px] text-slate-500 uppercase">On Scene</span></div>
        <div className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-orange-400" /><span className="text-lg font-bold text-white">{transporting}</span><span className="text-[10px] text-slate-500 uppercase">Transporting</span></div>
        <div className="flex items-center gap-1.5"><Hospital className="w-4 h-4 text-blue-400" /><span className="text-lg font-bold text-white">{atHospital}</span><span className="text-[10px] text-slate-500 uppercase">At Hospital</span></div>
        <div className="ml-auto flex items-center gap-1.5"><Heart className="w-4 h-4 text-pink-400" /><span className="text-lg font-bold text-white">{pcrs.length}</span><span className="text-[10px] text-slate-500 uppercase">PCRs Today</span></div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left - Medical Calls */}
        <div className="w-80 border-r border-slate-800 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Heart className="w-4 h-4 text-pink-400" /> Medical Calls</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{activeCalls.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {activeCalls.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">No active medical calls</p>
            ) : activeCalls.map(call => (
              <button key={call.id} onClick={() => setSelectedCall(call)} className={`w-full text-left p-2.5 rounded-lg border transition-colors ${selectedCall?.id === call.id ? "bg-slate-800 border-slate-600" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${call.priority === "1 - High" ? "text-red-400 bg-red-500/10" : call.priority === "2 - Medium" ? "text-yellow-400 bg-yellow-500/10" : "text-green-400 bg-green-500/10"}`}>{call.priority}</span>
                  {call.run_number && <span className="text-[10px] text-slate-500 font-mono">{call.run_number}</span>}
                </div>
                <p className="text-sm text-white font-medium truncate">{call.call_type}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {call.location}</p>
                {call.caller_name && <p className="text-[10px] text-pink-400 mt-1 flex items-center gap-1"><User className="w-2.5 h-2.5" /> {call.caller_name}</p>}
                {call.assigned_unit_ids?.length > 0 && <p className="text-[10px] text-green-400 mt-1">{call.assigned_unit_ids.length} unit(s) responding</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Center - Call Detail or Overview */}
        <div className="flex-1 overflow-y-auto">
          {selectedCall ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCall.call_type}</h2>
                  {selectedCall.run_number && <p className="text-sm font-mono text-green-400">{selectedCall.run_number}</p>}
                </div>
                <button onClick={() => setSelectedCall(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Status: </span><span className="text-white">{selectedCall.status}</span></div>
                  <div><span className="text-slate-500">Priority: </span><span className="text-white">{selectedCall.priority}</span></div>
                  <div><span className="text-slate-500">Location: </span><span className="text-white">{selectedCall.location}</span></div>
                  {selectedCall.caller_name && <div className="flex items-center gap-1"><User className="w-3 h-3 text-slate-500" /><span className="text-slate-500">Patient: </span><span className="text-white">{selectedCall.caller_name}</span></div>}
                  {selectedCall.caller_phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /><span className="text-slate-500">Phone: </span><span className="text-white">{selectedCall.caller_phone}</span></div>}
                </div>
                {selectedCall.description && <div className="bg-slate-950 rounded-lg p-3"><p className="text-xs text-slate-500 mb-1">Description:</p><p className="text-sm text-slate-300">{selectedCall.description}</p></div>}
                {selectedCall.cad_notes && <div className="bg-slate-950 rounded-lg p-3"><p className="text-xs text-slate-500 mb-1">Notes:</p><p className="text-sm text-slate-300">{selectedCall.cad_notes}</p></div>}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => closeCall(selectedCall.id)}><CheckCircle className="w-4 h-4" /> Clear Call</Button>
                  <Link to={`/cad/mdt/${deptId}`}><Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"><Stethoscope className="w-4 h-4" /> Open MDT</Button></Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-green-400" /> Fleet Status</h2>
                <div className="space-y-2">
                  {units.length === 0 ? <p className="text-xs text-slate-600 text-center py-4">No ambulances in fleet</p> : units.map(u => (
                    <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ambulance className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-sm text-white font-medium">{u.name || u.identifier || "Ambulance"}</p>
                          <p className="text-[10px] text-slate-500">{u.callsign || u.unit_type || ""}</p>
                        </div>
                      </div>
                      <Select value={u.status || "Available"} onValueChange={(v) => setStatus(u.id, v)}>
                        <SelectTrigger className="h-7 w-32 text-xs bg-transparent border-slate-700"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">{TRANSPORT_STATUS.map(s => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-green-400" /> Recent PCRs</h2>
                <div className="space-y-2">
                  {pcrs.length === 0 ? <p className="text-xs text-slate-600 text-center py-4">No recent PCRs</p> : pcrs.slice(0, 5).map(pcr => (
                    <div key={pcr.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{pcr.patient_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{pcr.pcr_number}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pcr.disposition === "Transported" ? "text-blue-400 bg-blue-500/10" : pcr.disposition === "Treated/Released" ? "text-green-400 bg-green-500/10" : "text-slate-400 bg-slate-700"}`}>{pcr.disposition}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Hospital className="w-4 h-4 text-blue-400" /> Hospital Destinations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {HOSPITALS.map(h => {
                    const count = units.filter(u => u.status === "At Hospital" && u.notes?.includes(h)).length;
                    return (
                      <div key={h} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2"><BedDouble className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-white">{h}</span></div>
                        <span className="text-[10px] text-slate-500">{count} unit(s)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right - Medics On Duty */}
        <div className="w-72 border-l border-slate-800 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Stethoscope className="w-4 h-4 text-green-400" /> Medics On Duty</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {personnel.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">No medics on duty</p>
            ) : personnel.map(p => {
              const dotColor = p.status === "Available" ? "bg-green-400" : p.status === "On Call" || p.status === "On Duty" ? "bg-red-400" : p.status === "Panic" ? "bg-red-500 animate-pulse" : "bg-gray-400";
              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p.callsign && <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 px-1 rounded">{p.callsign}</span>}
                      <span className="text-xs text-white font-medium truncate">{p.user_name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      <span className="text-[10px] text-slate-500">{p.status}</span>
                    </div>
                  </div>
                  {p.rank && <p className="text-[10px] text-slate-600 mt-0.5">{p.rank}</p>}
                </div>
              );
            })}
          </div>
          <div className="p-2 border-t border-slate-800">
            <Link to={`/cad/mdt/${deptId}`} className="block text-center text-xs text-slate-500 hover:text-white py-1">Open MDT →</Link>
          </div>
        </div>
      </div>

      <Taskbar activeView="dispatch" setActiveView={(v) => { if (v !== "dispatch") navigate(`/cad/mdt/${deptId}`); }} session={session} departmentCategory={department.category} onStatusChange={handleStatusChange} onPanic={handlePanic} onClockOut={handleClockOut} onOpenKeybinds={() => {}} />
    </div>
  );
}