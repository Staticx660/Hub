import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Pencil, FileText, Car, Phone, ChevronLeft, AlertTriangle, Eye, Gavel } from "lucide-react";
import CharacterForm from "@/components/cad/civilian/CharacterForm";
import CivilianDMV from "@/components/cad/civilian/CivilianDMV";

const OCRP_LOGO = "https://media.base44.com/images/public/6a441f279b9d3cd678958799/5a43a1b46_OCRP20.png";

function calculateAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : "";
}

export default function CADCivilian() {
  const { deptId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(null);
  const [charFormOpen, setCharFormOpen] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  const [call911Open, setCall911Open] = useState(false);
  const [call911Form, setCall911Form] = useState({ location: "", description: "", priority: "2 - Medium" });
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [reports, setReports] = useState([]);

  const load = async () => {
    try {
      const dept = await base44.entities.CADDepartment.get(deptId);
      setDepartment(dept);
      const chars = await base44.entities.Civilian.filter({ owner_user_id: user.id });
      setCharacters(chars);
      if (selectedChar) {
        const updated = chars.find(c => c.id === selectedChar.id);
        if (updated) setSelectedChar(updated);
        else setSelectedChar(chars[0] || null);
      } else {
        setSelectedChar(chars[0] || null);
      }
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [deptId]);

  const loadRecords = async () => {
    if (!selectedChar) return;
    const name = `${selectedChar.first_name} ${selectedChar.last_name}`;
    try {
      const [w, b, r] = await Promise.all([
        base44.entities.Warrant.filter({ person_name: name }),
        base44.entities.BOLO.filter({ person_name: name }),
        base44.entities.CADReport.filter({ department_id: department.id }),
      ]);
      setWarrants(w); setBolos(b); setReports(r.filter(rep => rep.description?.includes(name) || rep.title?.includes(name)));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  useEffect(() => { if (panel === "records" && selectedChar) loadRecords(); }, [panel, selectedChar]);

  const handle911 = async () => {
    if (!call911Form.location) return;
    try {
      const depts = await base44.entities.CADDepartment.list();
      const dispatchDept = depts.find(d => d.category === "Dispatch") || depts.find(d => d.id === deptId);
      const runNum = `911-${Date.now().toString().slice(-6)}`;
      await base44.entities.ActiveCall.create({
        call_type: "911 Emergency Call", priority: call911Form.priority, status: "Pending",
        location: call911Form.location, description: call911Form.description,
        caller_name: `${selectedChar.first_name} ${selectedChar.last_name}`,
        caller_phone: selectedChar.phone || "",
        department_id: dispatchDept?.id || deptId, run_number: runNum,
        assignment_log: [{ unit_name: "911 Caller", action: "call_placed", timestamp: new Date().toISOString(), message: call911Form.description }],
      });
      toast({ title: "911 call placed", description: runNum });
      setCall911Open(false); setCall911Form({ location: "", description: "", priority: "2 - Medium" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-950"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!department) return <div className="flex justify-center items-center h-screen bg-slate-950 text-slate-400">Department not found</div>;

  const fullName = selectedChar ? `${selectedChar.first_name} ${selectedChar.middle_name ? selectedChar.middle_name + " " : ""}${selectedChar.last_name}` : "";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <button onClick={() => navigate("/cad")} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
        <img src={OCRP_LOGO} alt="OCRP" className="w-8 h-8 rounded" />
        <div>
          <h1 className="text-white font-bold text-sm">{department.name}</h1>
          <p className="text-xs text-slate-500">Civilian MDT</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => base44.auth.logout("/login")} className="text-xs text-slate-500 hover:text-white">Logout</button>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full">
        {/* Character Selector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Label className="text-slate-300 text-sm font-semibold whitespace-nowrap">Selected Character</Label>
            <Select value={selectedChar?.id || ""} onValueChange={v => { setSelectedChar(characters.find(c => c.id === v)); setPanel(null); }}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white flex-1"><SelectValue placeholder="Select a character..." /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {characters.map(c => <SelectItem key={c.id} value={c.id} className="text-white">{c.first_name} {c.last_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setEditingChar(null); setCharFormOpen(true); }} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"><UserPlus className="w-3.5 h-3.5" /> New Character</Button>
            {selectedChar && <Button onClick={() => { setEditingChar(selectedChar); setCharFormOpen(true); }} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</Button>}
            {selectedChar && <Button onClick={() => setPanel(panel === "records" ? null : "records")} size="sm" variant={panel === "records" ? "secondary" : "outline"} className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Records</Button>}
            {selectedChar && <Button onClick={() => setPanel(panel === "dmv" ? null : "dmv")} size="sm" variant={panel === "dmv" ? "secondary" : "outline"} className="gap-1.5"><Car className="w-3.5 h-3.5" /> DMV</Button>}
            {selectedChar && <Button onClick={() => setCall911Open(true)} size="sm" variant="outline" className="border-red-500/30 text-red-400 gap-1.5"><Phone className="w-3.5 h-3.5" /> 911</Button>}
          </div>
        </div>

        {/* Content */}
        {!selectedChar ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <UserPlus className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-lg font-medium">No Character Selected</p>
            <p className="text-sm">Create a character to get started</p>
          </div>
        ) : panel === "records" ? (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Records for {fullName}</h2>
            {warrants.length === 0 && bolos.length === 0 && reports.length === 0 ? (
              <div className="text-center py-12 text-slate-600"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No records found</p></div>
            ) : (
              <>
                {warrants.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><Gavel className="w-3.5 h-3.5" /> Warrants ({warrants.length})</h3>
                    {warrants.map(w => (
                      <div key={w.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between"><span className="text-white font-medium text-sm">{w.reason}</span><span className={`text-xs px-2 py-0.5 rounded-full ${w.status === "Active" ? "bg-red-500/15 text-red-400" : "bg-slate-700 text-slate-400"}`}>{w.status}</span></div>
                        {w.charges?.length > 0 && <p className="text-xs text-slate-500 mt-1">Charges: {w.charges.join(", ")}</p>}
                        {w.bail_amount && <p className="text-xs text-slate-500">Bail: ${w.bail_amount}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {bolos.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> BOLOs ({bolos.length})</h3>
                    {bolos.map(b => (
                      <div key={b.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 mb-2">
                        <span className="text-white font-medium text-sm">{b.title}</span>
                        <p className="text-xs text-slate-500 mt-1">{b.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                {reports.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Reports ({reports.length})</h3>
                    {reports.map(r => (
                      <div key={r.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 mb-2">
                        <span className="text-white font-medium text-sm">{r.title}</span>
                        <p className="text-xs text-slate-500 mt-1">{r.report_type} · {r.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : panel === "dmv" ? (
          <CivilianDMV character={selectedChar} department={department} user={user} />
        ) : (
          /* Character Info */
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-24 h-24 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                {selectedChar.photo_url ? <img src={selectedChar.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-slate-600">{selectedChar.first_name[0]}</span>}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{fullName}</h2>
                <p className="text-sm text-slate-400">{calculateAge(selectedChar.dob)} years old · {selectedChar.gender}</p>
                {selectedChar.occupation && <p className="text-sm text-slate-500">{selectedChar.occupation}</p>}
                {selectedChar.phone && <p className="text-sm text-slate-500">📞 {selectedChar.phone}</p>}
                {selectedChar.address && <p className="text-sm text-slate-500">📍 {selectedChar.address} {selectedChar.zip_code}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {selectedChar.hair_color && <div><span className="text-slate-500 block text-xs">Hair</span><span className="text-slate-300">{selectedChar.hair_color}</span></div>}
              {selectedChar.eye_color && <div><span className="text-slate-500 block text-xs">Eyes</span><span className="text-slate-300">{selectedChar.eye_color}</span></div>}
              {selectedChar.height && <div><span className="text-slate-500 block text-xs">Height</span><span className="text-slate-300">{selectedChar.height}</span></div>}
              {selectedChar.weight && <div><span className="text-slate-500 block text-xs">Weight</span><span className="text-slate-300">{selectedChar.weight}</span></div>}
              {selectedChar.skin_color && <div><span className="text-slate-500 block text-xs">Skin</span><span className="text-slate-300">{selectedChar.skin_color}</span></div>}
              {selectedChar.zip_code && <div><span className="text-slate-500 block text-xs">Zip</span><span className="text-slate-300">{selectedChar.zip_code}</span></div>}
            </div>
            {(selectedChar.allergies?.length > 0 || selectedChar.medications?.length > 0 || selectedChar.medical_history?.length > 0 || selectedChar.food_allergies?.length > 0) && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Medical</h3>
                <div className="space-y-1.5 text-sm">
                  {selectedChar.allergies?.length > 0 && <p><span className="text-slate-500">Allergies: </span><span className="text-slate-300">{selectedChar.allergies.join(", ")}</span></p>}
                  {selectedChar.medications?.length > 0 && <p><span className="text-slate-500">Medications: </span><span className="text-slate-300">{selectedChar.medications.join(", ")}</span></p>}
                  {selectedChar.medical_history?.length > 0 && <p><span className="text-slate-500">History: </span><span className="text-slate-300">{selectedChar.medical_history.join(", ")}</span></p>}
                  {selectedChar.food_allergies?.length > 0 && <p><span className="text-slate-500">Food Allergies: </span><span className="text-slate-300">{selectedChar.food_allergies.join(", ")}</span></p>}
                </div>
              </div>
            )}
            {(selectedChar.emergency_contact_name || selectedChar.emergency_contact_phone) && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Emergency Contact</h3>
                <p className="text-sm text-slate-300">{selectedChar.emergency_contact_name} {selectedChar.emergency_contact_relationship && `(${selectedChar.emergency_contact_relationship})`} {selectedChar.emergency_contact_phone && `· 📞 ${selectedChar.emergency_contact_phone}`}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <CharacterForm open={charFormOpen} onOpenChange={setCharFormOpen} editing={editingChar} department={department} user={user} onSaved={load} />

      {/* 911 Dialog */}
      <Dialog open={call911Open} onOpenChange={setCall911Open}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><Phone className="w-5 h-5 text-red-400" /> Place 911 Call</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-400">Calling as: <span className="text-white font-medium">{fullName}</span>{selectedChar.phone && ` · ${selectedChar.phone}`}</p>
          <div className="space-y-3">
            <div><Label className="text-slate-300">Location *</Label><Input value={call911Form.location} onChange={e => setCall911Form({ ...call911Form, location: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Where is the emergency?" /></div>
            <div><Label className="text-slate-300">Priority</Label>
              <Select value={call911Form.priority} onValueChange={v => setCall911Form({ ...call911Form, priority: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{["1 - High", "2 - Medium", "3 - Low"].map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={call911Form.description} onChange={e => setCall911Form({ ...call911Form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={3} placeholder="Describe the emergency..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCall911Open(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handle911} disabled={!call911Form.location} className="bg-red-600 hover:bg-red-700 gap-2"><Phone className="w-4 h-4" /> Call 911</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}