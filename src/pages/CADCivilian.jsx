import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Pencil, FileText, Car, Phone, AlertTriangle, Eye, Gavel, ChevronLeft } from "lucide-react";
import CharacterForm from "@/components/cad/civilian/CharacterForm";
import CivilianDMV from "@/components/cad/civilian/CivilianDMV";
import AddressSearch from "@/components/cad/mdt/AddressSearch";

const CIVILIAN_CALL_TYPES = ["Medical Emergency", "Structure Fire", "Traffic Accident", "Burglary", "Robbery", "Assault", "Theft", "Vandalism", "Noise Complaint", "Suspicious Person", "Welfare Check", "Domestic Dispute", "Shots Fired", "Other"];

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
  const [department, setDepartment] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panel, setPanel] = useState(null);
  const [charFormOpen, setCharFormOpen] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  const [call911Open, setCall911Open] = useState(false);
  const [call911Form, setCall911Form] = useState({ call_type: "Medical Emergency", location: "", cross_streets: "", postal: "", block: "", description: "", priority: "1 - High" });
  const [warrants, setWarrants] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!deptId) { setLoading(false); setError("No department specified"); return; }
    let active = true;
    const load = async () => {
      try {
        const dept = await base44.entities.CADDepartment.get(deptId);
        if (!active) return;
        setDepartment(dept);
        // Load characters — use user.id if available, otherwise show empty state
        if (user?.id) {
          const chars = await base44.entities.Civilian.filter({ owner_user_id: user.id });
          if (!active) return;
          setCharacters(chars);
          setSelectedChar(chars[0] || null);
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [deptId, user?.id]);

  const loadRecords = async () => {
    if (!selectedChar || !department) return;
    const name = `${selectedChar.first_name} ${selectedChar.last_name}`;
    try {
      const [w, b, r] = await Promise.all([
        base44.entities.Warrant.filter({ person_name: name }),
        base44.entities.BOLO.filter({ person_name: name }),
        base44.entities.CADReport.filter({ department_id: department.id }),
      ]);
      setWarrants(w);
      setBolos(b);
      setReports(r.filter(rep => rep.description?.includes(name) || rep.title?.includes(name) || rep.linked_civilian_name === name || rep.linked_civilian_id === selectedChar.id));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  useEffect(() => { if (panel === "records" && selectedChar) loadRecords(); }, [panel, selectedChar]);

  const reloadCharacter = async () => {
    if (!selectedChar) return;
    try {
      const updated = await base44.entities.Civilian.get(selectedChar.id);
      setSelectedChar(updated);
    } catch (e) { /* silent */ }
  };

  const reloadCharacters = async () => {
    if (!user?.id) return;
    try {
      const chars = await base44.entities.Civilian.filter({ owner_user_id: user.id });
      setCharacters(chars);
      const updated = selectedChar ? chars.find(c => c.id === selectedChar.id) : null;
      setSelectedChar(updated || chars[0] || null);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handle911 = async () => {
    if (!call911Form.location || !selectedChar) return;
    try {
      const depts = await base44.entities.CADDepartment.list();
      const policeDept = depts.find(d => d.category === "Police");
      const dispatchDept = depts.find(d => d.category === "Dispatch") || policeDept || depts.find(d => d.id === deptId);
      const runNum = `911-${Date.now().toString().slice(-6)}`;
      await base44.entities.ActiveCall.create({
        call_type: call911Form.call_type, priority: call911Form.priority, status: "Pending",
        call_origin: "911",
        location: call911Form.location, cross_streets: call911Form.cross_streets,
        postal: call911Form.postal, block: call911Form.block,
        description: call911Form.description,
        caller_name: `${selectedChar.first_name} ${selectedChar.last_name}`,
        caller_phone: selectedChar.phone || "",
        department_id: dispatchDept?.id || deptId, run_number: runNum,
        assignment_log: [{ unit_name: "911 Caller", action: "call_placed", timestamp: new Date().toISOString(), message: `${call911Form.call_type}: ${call911Form.description}` }],
      });
      toast({ title: "911 call placed", description: runNum });
      setCall911Open(false);
      setCall911Form({ call_type: "Medical Emergency", location: "", cross_streets: "", postal: "", block: "", description: "", priority: "1 - High" });
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-cad-border border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="w-16 h-16 text-cad-dim" />
      <h1 className="text-xl font-bold text-cad-text">Something went wrong</h1>
      <p className="text-sm text-cad-muted">{error}</p>
      <Button onClick={() => window.history.back()} variant="outline" className="border-cad-border text-cad-muted gap-2">
        <ChevronLeft className="w-4 h-4" /> Go Back
      </Button>
    </div>
  );

  if (!department) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="w-16 h-16 text-cad-dim" />
      <h1 className="text-xl font-bold text-cad-text">Department not found</h1>
      <Button onClick={() => window.history.back()} variant="outline" className="border-cad-border text-cad-muted gap-2">
        <ChevronLeft className="w-4 h-4" /> Go Back
      </Button>
    </div>
  );

  const fullName = selectedChar ? `${selectedChar.first_name} ${selectedChar.middle_name ? selectedChar.middle_name + " " : ""}${selectedChar.last_name}` : "";

  return (
    <div className="min-h-screen cad-gradient-bg cad-font p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={OCRP_LOGO} alt="OCRP" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-cad-text">{department.name}</h1>
            <p className="text-sm text-cad-muted">Civilian MDT</p>
          </div>
        </div>
        <Link to="/cad" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cad-surface-2 border border-cad-border text-cad-muted hover:text-cad-text hover:bg-slate-700 transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Back to CAD
        </Link>
      </div>

      <div className="bg-cad-surface/60 border border-cad-border/50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <Label className="text-cad-muted text-sm font-semibold whitespace-nowrap">Character</Label>
          <Select value={selectedChar?.id || ""} onValueChange={v => { setSelectedChar(characters.find(c => c.id === v)); setPanel(null); }}>
            <SelectTrigger className="bg-cad-surface-2 border-cad-border text-cad-text flex-1">
              <SelectValue placeholder="Select a character..." />
            </SelectTrigger>
            <SelectContent className="bg-cad-surface-2 border-cad-border">
              {characters.map(c => <SelectItem key={c.id} value={c.id} className="text-cad-text">{c.first_name} {c.last_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setEditingChar(null); setCharFormOpen(true); }} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> New Character
          </Button>
          {selectedChar && (
            <Button onClick={() => { setEditingChar(selectedChar); setCharFormOpen(true); }} size="sm" variant="outline" className="border-cad-border text-cad-muted gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
          {selectedChar && (
            <Button onClick={() => setPanel(panel === "records" ? null : "records")} size="sm" variant="outline" className={`gap-1.5 ${panel === "records" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "border-cad-border text-cad-muted"}`}>
              <FileText className="w-3.5 h-3.5" /> Records
            </Button>
          )}
          {selectedChar && (
            <Button onClick={() => setPanel(panel === "dmv" ? null : "dmv")} size="sm" variant="outline" className={`gap-1.5 ${panel === "dmv" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "border-cad-border text-cad-muted"}`}>
              <Car className="w-3.5 h-3.5" /> DMV
            </Button>
          )}
          {selectedChar && (
            <Button onClick={() => setCall911Open(true)} size="sm" variant="outline" className="border-red-500/30 text-red-400 gap-1.5">
              <Phone className="w-3.5 h-3.5" /> 911
            </Button>
          )}
        </div>
      </div>

      {!selectedChar ? (
        <div className="flex flex-col items-center justify-center py-20 text-cad-dim">
          <UserPlus className="w-16 h-16 mb-3 opacity-30" />
          <p className="text-lg font-medium">No Character Selected</p>
          <p className="text-sm">Create a character to get started</p>
        </div>
      ) : panel === "records" ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-cad-muted uppercase tracking-wider">Records for {fullName}</h2>
          {warrants.length === 0 && bolos.length === 0 && reports.length === 0 ? (
            <div className="text-center py-12 text-cad-dim">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No records found</p>
            </div>
          ) : (
            <>
              {warrants.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-cad-dim uppercase mb-2 flex items-center gap-1.5"><Gavel className="w-3.5 h-3.5" /> Warrants ({warrants.length})</h3>
                  {warrants.map(w => (
                    <div key={w.id} className="bg-cad-surface/60 border border-cad-border/50 rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-cad-text font-medium text-sm">{w.reason}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === "Active" ? "bg-red-500/15 text-red-400" : "bg-slate-700 text-cad-muted"}`}>{w.status}</span>
                      </div>
                      {w.charges?.length > 0 && <p className="text-xs text-cad-dim mt-1">Charges: {w.charges.join(", ")}</p>}
                      {w.bail_amount && <p className="text-xs text-cad-dim">Bail: ${w.bail_amount}</p>}
                    </div>
                  ))}
                </div>
              )}
              {bolos.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-cad-dim uppercase mb-2 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> BOLOs ({bolos.length})</h3>
                  {bolos.map(b => (
                    <div key={b.id} className="bg-cad-surface/60 border border-cad-border/50 rounded-lg p-3 mb-2">
                      <span className="text-cad-text font-medium text-sm">{b.title}</span>
                      <p className="text-xs text-cad-dim mt-1">{b.description}</p>
                    </div>
                  ))}
                </div>
              )}
              {reports.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-cad-dim uppercase mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Reports ({reports.length})</h3>
                  {reports.map(r => (
                    <div key={r.id} className="bg-cad-surface/60 border border-cad-border/50 rounded-lg p-3 mb-2">
                      <span className="text-cad-text font-medium text-sm">{r.title}</span>
                      <p className="text-xs text-cad-dim mt-1">{r.report_type} · {r.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : panel === "dmv" ? (
        <CivilianDMV character={selectedChar} department={department} user={user} onUpdate={reloadCharacter} />
      ) : (
        <div className="bg-cad-surface/60 border border-cad-border/50 rounded-xl p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-24 h-24 rounded-xl bg-cad-surface-2 border border-cad-border overflow-hidden flex items-center justify-center flex-shrink-0">
              {selectedChar.photo_url ? (
                <img src={selectedChar.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-cad-dim">{selectedChar.first_name?.[0] || "?"}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-cad-text">{fullName}</h2>
              <p className="text-sm text-cad-muted">{calculateAge(selectedChar.dob)} years old · {selectedChar.gender}</p>
              {selectedChar.occupation && <p className="text-sm text-cad-dim">{selectedChar.occupation}</p>}
              {selectedChar.phone && <p className="text-sm text-cad-dim">📞 {selectedChar.phone}</p>}
              {selectedChar.address && <p className="text-sm text-cad-dim">📍 {selectedChar.address} {selectedChar.zip_code}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {selectedChar.hair_color && <div><span className="text-cad-dim block text-xs">Hair</span><span className="text-cad-muted">{selectedChar.hair_color}</span></div>}
            {selectedChar.eye_color && <div><span className="text-cad-dim block text-xs">Eyes</span><span className="text-cad-muted">{selectedChar.eye_color}</span></div>}
            {selectedChar.height && <div><span className="text-cad-dim block text-xs">Height</span><span className="text-cad-muted">{selectedChar.height}</span></div>}
            {selectedChar.weight && <div><span className="text-cad-dim block text-xs">Weight</span><span className="text-cad-muted">{selectedChar.weight}</span></div>}
            {selectedChar.race && <div><span className="text-cad-dim block text-xs">Race</span><span className="text-cad-muted">{selectedChar.race}</span></div>}
            {selectedChar.skin_tone && <div><span className="text-cad-dim block text-xs">Skin Tone</span><span className="text-cad-muted">{selectedChar.skin_tone}</span></div>}
            {selectedChar.zip_code && <div><span className="text-cad-dim block text-xs">Zip</span><span className="text-cad-muted">{selectedChar.zip_code}</span></div>}
          </div>
          {(selectedChar.allergies?.length > 0 || selectedChar.medications?.length > 0 || selectedChar.medical_history?.length > 0 || selectedChar.food_allergies?.length > 0) && (
            <div className="mt-4 pt-4 border-t border-cad-border/50">
              <h3 className="text-xs font-semibold text-cad-dim uppercase mb-2">Medical</h3>
              <div className="space-y-1.5 text-sm">
                {selectedChar.allergies?.length > 0 && <p><span className="text-cad-dim">Allergies: </span><span className="text-cad-muted">{selectedChar.allergies.join(", ")}</span></p>}
                {selectedChar.medications?.length > 0 && <p><span className="text-cad-dim">Medications: </span><span className="text-cad-muted">{selectedChar.medications.join(", ")}</span></p>}
                {selectedChar.medical_history?.length > 0 && <p><span className="text-cad-dim">History: </span><span className="text-cad-muted">{selectedChar.medical_history.join(", ")}</span></p>}
                {selectedChar.food_allergies?.length > 0 && <p><span className="text-cad-dim">Food Allergies: </span><span className="text-cad-muted">{selectedChar.food_allergies.join(", ")}</span></p>}
              </div>
            </div>
          )}
          {(selectedChar.emergency_contact_name || selectedChar.emergency_contact_phone) && (
            <div className="mt-4 pt-4 border-t border-cad-border/50">
              <h3 className="text-xs font-semibold text-cad-dim uppercase mb-2">Emergency Contact</h3>
              <p className="text-sm text-cad-muted">
                {selectedChar.emergency_contact_name}
                {selectedChar.emergency_contact_relationship && ` (${selectedChar.emergency_contact_relationship})`}
                {selectedChar.emergency_contact_phone && ` · 📞 ${selectedChar.emergency_contact_phone}`}
              </p>
            </div>
          )}
        </div>
      )}

      <CharacterForm open={charFormOpen} onOpenChange={setCharFormOpen} editing={editingChar} department={department} user={user} onSaved={reloadCharacters} />

      <Dialog open={call911Open} onOpenChange={setCall911Open}>
        <DialogContent className="bg-cad-surface border-cad-border">
          <DialogHeader>
            <DialogTitle className="text-cad-text flex items-center gap-2"><Phone className="w-5 h-5 text-red-400" /> Place 911 Call</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-cad-muted">Calling as: <span className="text-cad-text font-medium">{fullName}</span>{selectedChar?.phone && ` · ${selectedChar.phone}`}</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-cad-muted">Call Type *</Label>
                <Select value={call911Form.call_type} onValueChange={v => setCall911Form({ ...call911Form, call_type: v })}>
                  <SelectTrigger className="bg-cad-surface-2 border-cad-border text-cad-text"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-cad-surface-2 border-cad-border max-h-60">
                    {CIVILIAN_CALL_TYPES.map(t => <SelectItem key={t} value={t} className="text-cad-text">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-cad-muted">Priority</Label>
                <Select value={call911Form.priority} onValueChange={v => setCall911Form({ ...call911Form, priority: v })}>
                  <SelectTrigger className="bg-cad-surface-2 border-cad-border text-cad-text"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-cad-surface-2 border-cad-border">
                    {["1 - High", "2 - Medium", "3 - Low"].map(p => <SelectItem key={p} value={p} className="text-cad-text">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-cad-muted">Address *</Label>
              <AddressSearch value={call911Form.location} onChange={v => setCall911Form({ ...call911Form, location: v })} className="w-full bg-cad-surface-2 border-cad-border text-cad-text text-sm h-9 rounded-md pl-9 pr-3 focus-visible:ring-1 focus-visible:ring-slate-600" placeholder="Search for a road..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-cad-muted">Postal</Label>
                <Input value={call911Form.postal} onChange={e => setCall911Form({ ...call911Form, postal: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" placeholder="e.g. 1234" />
              </div>
              <div>
                <Label className="text-cad-muted">Block</Label>
                <Input value={call911Form.block} onChange={e => setCall911Form({ ...call911Form, block: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" placeholder="e.g. 100" />
              </div>
              <div>
                <Label className="text-cad-muted">Cross Streets</Label>
                <Input value={call911Form.cross_streets} onChange={e => setCall911Form({ ...call911Form, cross_streets: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" placeholder="e.g. Vinewood & Power" />
              </div>
            </div>
            <div>
              <Label className="text-cad-muted">Description</Label>
              <Textarea value={call911Form.description} onChange={e => setCall911Form({ ...call911Form, description: e.target.value })} className="bg-cad-surface-2 border-cad-border text-cad-text" rows={3} placeholder="Describe the emergency..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCall911Open(false)} className="border-cad-border text-cad-muted">Cancel</Button>
            <Button onClick={handle911} disabled={!call911Form.location} className="bg-red-600 hover:bg-red-700 gap-2"><Phone className="w-4 h-4" /> Call 911</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}