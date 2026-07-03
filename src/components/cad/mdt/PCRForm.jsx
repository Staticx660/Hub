import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ClipboardList, Plus, ArrowLeft, Save, Activity, Heart, Pill, FileText, User, Truck, Trash2 } from "lucide-react";

const TABS = [
  { id: "patient", label: "Patient", icon: User },
  { id: "assessment", label: "Assessment", icon: Activity },
  { id: "vitals", label: "Vitals", icon: Heart },
  { id: "treatment", label: "Treatment", icon: Pill },
  { id: "narrative", label: "Narrative", icon: FileText },
  { id: "disposition", label: "Disposition", icon: Truck },
];

export default function PCRForm({ department, session }) {
  const [pcrs, setPcrs] = useState([]);
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("patient");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadPcrs(); }, []);

  const loadPcrs = async () => {
    try {
      const list = await base44.entities.PatientCareReport.filter({ department_id: department.id }, '-created_date', 50);
      setPcrs(list);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  const startNew = () => {
    setForm({
      pcr_number: `PCR-${Date.now().toString().slice(-6)}`,
      patient_name: "", patient_dob: "", patient_age: "", patient_gender: "Unknown",
      patient_address: "", patient_phone: "",
      incident_location: "", incident_type: department.category === "Fire" ? "Fire" : "Medical",
      chief_complaint: "", mechanism_of_injury: "",
      loc: "Alert", gcs_eye: "4", gcs_verbal: "5", gcs_motor: "6",
      pupils_left: "", pupils_right: "",
      skin_color: "", skin_temp: "", skin_condition: "",
      vitals: [], treatments: [], medications: [],
      narrative: "",
      disposition: "Transported", destination: "", transport_method: "",
      department_id: department.id,
      filed_by_name: session?.user_name || "",
      filed_by_id: session?.user_id || "",
      status: "Draft",
    });
    setTab("patient");
  };

  const editPcr = (pcr) => { setForm({ ...pcr }); setTab("patient"); };
  const update = (field, value) => setForm({ ...form, [field]: value });

  const addVital = () => update("vitals", [...form.vitals, { timestamp: new Date().toISOString(), bp_systolic: "", bp_diastolic: "", heart_rate: "", respiratory_rate: "", spo2: "", temperature: "", bgl: "", pain_score: "" }]);
  const updateVital = (i, field, value) => { const v = [...form.vitals]; v[i] = { ...v[i], [field]: value }; update("vitals", v); };
  const removeVital = (i) => update("vitals", form.vitals.filter((_, idx) => idx !== i));

  const addTreatment = () => update("treatments", [...form.treatments, { timestamp: new Date().toISOString(), intervention: "", result: "" }]);
  const updateTreatment = (i, field, value) => { const t = [...form.treatments]; t[i] = { ...t[i], [field]: value }; update("treatments", t); };
  const removeTreatment = (i) => update("treatments", form.treatments.filter((_, idx) => idx !== i));

  const addMedication = () => update("medications", [...form.medications, { timestamp: new Date().toISOString(), medication: "", dose: "", route: "" }]);
  const updateMedication = (i, field, value) => { const m = [...form.medications]; m[i] = { ...m[i], [field]: value }; update("medications", m); };
  const removeMedication = (i) => update("medications", form.medications.filter((_, idx) => idx !== i));

  const save = async (status) => {
    if (!form.patient_name.trim()) { toast({ title: "Patient name required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let age = form.patient_age;
      if (form.patient_dob) {
        const birth = new Date(form.patient_dob);
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      }
      const data = { ...form, patient_age: age ? String(age) : "", status: status || form.status };
      if (form.id) {
        await base44.entities.PatientCareReport.update(form.id, data);
      } else {
        await base44.entities.PatientCareReport.create(data);
      }
      toast({ title: status === "Filed" ? "PCR Filed" : "PCR Saved", description: form.pcr_number });
      setForm(null);
      loadPcrs();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;

  if (form) {
    const accent = department.color || "#22c55e";
    const gcsTotal = (parseInt(form.gcs_eye) || 0) + (parseInt(form.gcs_verbal) || 0) + (parseInt(form.gcs_motor) || 0);
    return (
      <div className="flex flex-col h-full bg-[#1a1d21]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2c2f36] bg-[#131519]">
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(null)} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><ClipboardList className="w-4 h-4" style={{ color: accent }} /> Patient Care Report</h2>
              <p className="text-xs text-slate-500 font-mono">{form.pcr_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save("Draft")} disabled={saving} variant="outline" size="sm" className="border-slate-700 text-slate-300">Save Draft</Button>
            <Button onClick={() => save("Filed")} disabled={saving} size="sm" style={{ backgroundColor: accent }}><Save className="w-3.5 h-3.5" /> File PCR</Button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 py-2 border-b border-[#2c2f36] bg-[#131519] overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "patient" && (
            <div className="max-w-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-slate-400 text-xs">Patient Name *</Label><Input value={form.patient_name} onChange={e => update("patient_name", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Last, First" /></div>
                <div><Label className="text-slate-400 text-xs">Date of Birth</Label><Input type="date" value={form.patient_dob || ""} onChange={e => update("patient_dob", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
                <div><Label className="text-slate-400 text-xs">Age</Label><Input value={form.patient_age || ""} onChange={e => update("patient_age", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Auto from DOB" /></div>
                <div><Label className="text-slate-400 text-xs">Gender</Label><Select value={form.patient_gender} onValueChange={v => update("patient_gender", v)}><SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{["Male", "Female", "Other", "Unknown"].map(g => <SelectItem key={g} value={g} className="text-white">{g}</SelectItem>)}</SelectContent></Select></div>
                <div className="col-span-2"><Label className="text-slate-400 text-xs">Address</Label><Input value={form.patient_address || ""} onChange={e => update("patient_address", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
                <div><Label className="text-slate-400 text-xs">Phone</Label><Input value={form.patient_phone || ""} onChange={e => update("patient_phone", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
                <div><Label className="text-slate-400 text-xs">Incident Location</Label><Input value={form.incident_location || ""} onChange={e => update("incident_location", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
              </div>
            </div>
          )}
          {tab === "assessment" && (
            <div className="max-w-2xl space-y-4">
              <div><Label className="text-slate-400 text-xs">Chief Complaint</Label><Textarea value={form.chief_complaint || ""} onChange={e => update("chief_complaint", e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={2} placeholder="Patient's primary complaint" /></div>
              <div><Label className="text-slate-400 text-xs">Mechanism of Injury</Label><Input value={form.mechanism_of_injury || ""} onChange={e => update("mechanism_of_injury", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Fall, MVA, Burn" /></div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3"><h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Level of Consciousness</h3><div className="grid grid-cols-4 gap-2">{["Alert", "Verbal", "Pain", "Unresponsive"].map(l => <button key={l} onClick={() => update("loc", l)} className={`px-2 py-2 rounded-lg text-xs font-medium ${form.loc === l ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{l}</button>)}</div></div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3"><h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Glasgow Coma Scale</h3><div className="grid grid-cols-3 gap-3"><div><Label className="text-slate-500 text-[10px]">Eye (1-4)</Label><Input type="number" min="1" max="4" value={form.gcs_eye} onChange={e => update("gcs_eye", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div><div><Label className="text-slate-500 text-[10px]">Verbal (1-5)</Label><Input type="number" min="1" max="5" value={form.gcs_verbal} onChange={e => update("gcs_verbal", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div><div><Label className="text-slate-500 text-[10px]">Motor (1-6)</Label><Input type="number" min="1" max="6" value={form.gcs_motor} onChange={e => update("gcs_motor", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div></div><p className="text-xs text-slate-500 mt-2">Total GCS: {gcsTotal}/15</p></div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3"><h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Pupils</h3><div className="grid grid-cols-2 gap-3"><div><Label className="text-slate-500 text-[10px]">Left</Label><Input value={form.pupils_left || ""} onChange={e => update("pupils_left", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. 4mm reactive" /></div><div><Label className="text-slate-500 text-[10px]">Right</Label><Input value={form.pupils_right || ""} onChange={e => update("pupils_right", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. 3mm reactive" /></div></div></div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3"><h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Skin</h3><div className="grid grid-cols-3 gap-3"><div><Label className="text-slate-500 text-[10px]">Color</Label><Input value={form.skin_color || ""} onChange={e => update("skin_color", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Pink, pale" /></div><div><Label className="text-slate-500 text-[10px]">Temperature</Label><Input value={form.skin_temp || ""} onChange={e => update("skin_temp", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Warm, cool" /></div><div><Label className="text-slate-500 text-[10px]">Condition</Label><Input value={form.skin_condition || ""} onChange={e => update("skin_condition", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Dry, moist" /></div></div></div>
            </div>
          )}
          {tab === "vitals" && (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-white">Vital Signs</h3><Button onClick={addVital} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Vital Set</Button></div>
              {form.vitals.length === 0 ? <div className="text-center py-12 text-slate-600"><Heart className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No vitals recorded</p></div> : (
                <div className="space-y-3">{form.vitals.map((v, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-mono text-slate-500">Set {i + 1} · {new Date(v.timestamp).toLocaleTimeString()}</span><button onClick={() => removeVital(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                      <div><Label className="text-slate-500 text-[10px]">BP Sys</Label><Input type="number" value={v.bp_systolic || ""} onChange={e => updateVital(i, "bp_systolic", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                      <div><Label className="text-slate-500 text-[10px]">BP Dia</Label><Input type="number" value={v.bp_diastolic || ""} onChange={e => updateVital(i, "bp_diastolic", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                      <div><Label className="text-slate-500 text-[10px]">HR</Label><Input type="number" value={v.heart_rate || ""} onChange={e => updateVital(i, "heart_rate", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                      <div><Label className="text-slate-500 text-[10px]">RR</Label><Input type="number" value={v.respiratory_rate || ""} onChange={e => updateVital(i, "respiratory_rate", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                      <div><Label className="text-slate-500 text-[10px]">SpO₂</Label><Input type="number" value={v.spo2 || ""} onChange={e => updateVital(i, "spo2", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                      <div><Label className="text-slate-500 text-[10px]">Temp</Label><Input type="number" step="0.1" value={v.temperature || ""} onChange={e => updateVital(i, "temperature", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                      <div><Label className="text-slate-500 text-[10px]">BGL</Label><Input type="number" value={v.bgl || ""} onChange={e => updateVital(i, "bgl", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                      <div><Label className="text-slate-500 text-[10px]">Pain</Label><Input type="number" min="0" max="10" value={v.pain_score || ""} onChange={e => updateVital(i, "pain_score", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
          )}
          {tab === "treatment" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-white">Interventions</h3><Button onClick={addTreatment} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button></div>
                {form.treatments.length === 0 ? <p className="text-xs text-slate-600 text-center py-4">No interventions recorded</p> : (
                  <div className="space-y-2">{form.treatments.map((t, i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{new Date(t.timestamp).toLocaleTimeString()}</span>
                      <Input value={t.intervention} onChange={e => updateTreatment(i, "intervention", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1" placeholder="e.g. Oxygen 2L NC, Splinting" />
                      <Input value={t.result} onChange={e => updateTreatment(i, "result", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1" placeholder="Result/Response" />
                      <button onClick={() => removeTreatment(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}</div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-white">Medications</h3><Button onClick={addMedication} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button></div>
                {form.medications.length === 0 ? <p className="text-xs text-slate-600 text-center py-4">No medications recorded</p> : (
                  <div className="space-y-2">{form.medications.map((m, i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      <Input value={m.medication} onChange={e => updateMedication(i, "medication", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1" placeholder="Drug name" />
                      <Input value={m.dose} onChange={e => updateMedication(i, "dose", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-24" placeholder="Dose" />
                      <Input value={m.route} onChange={e => updateMedication(i, "route", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-24" placeholder="Route" />
                      <button onClick={() => removeMedication(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}</div>
                )}
              </div>
            </div>
          )}
          {tab === "narrative" && (
            <div className="max-w-2xl"><Label className="text-slate-400 text-xs">Patient Care Narrative</Label><Textarea value={form.narrative || ""} onChange={e => update("narrative", e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1" rows={16} placeholder="Document the full patient encounter including dispatch, arrival, assessment, treatment, and transport..." /><p className="text-xs text-slate-500 mt-2">{(form.narrative || "").length} characters</p></div>
          )}
          {tab === "disposition" && (
            <div className="max-w-2xl space-y-4">
              <div><Label className="text-slate-400 text-xs">Disposition</Label><div className="grid grid-cols-3 gap-2 mt-1">{["Transported", "Treated/Released", "Refused AMA", "Deceased", "Transferred", "No Treatment"].map(d => <button key={d} onClick={() => update("disposition", d)} className={`px-2 py-2 rounded-lg text-xs font-medium ${form.disposition === d ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{d}</button>)}</div></div>
              {(form.disposition === "Transported" || form.disposition === "Transferred") && (
                <div className="grid grid-cols-2 gap-3"><div><Label className="text-slate-400 text-xs">Destination</Label><Input value={form.destination || ""} onChange={e => update("destination", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Pillbox Hill Medical Center" /></div><div><Label className="text-slate-400 text-xs">Transport Method</Label><Input value={form.transport_method || ""} onChange={e => update("transport_method", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Ambulance, Air" /></div></div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Patient Care Reports</h2>
          <Button onClick={startNew} size="sm" style={{ backgroundColor: department.color || "#22c55e" }} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> New PCR</Button>
        </div>
        {pcrs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600"><ClipboardList className="w-12 h-12 mb-3 opacity-30" /><p>No PCRs filed</p><p className="text-xs mt-1">Click "New PCR" to start a patient care report</p></div>
        ) : (
          <div className="space-y-2">{pcrs.map(pcr => (
            <button key={pcr.id} onClick={() => editPcr(pcr)} className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-3 hover:border-slate-600 transition-colors text-left">
              <div className="flex items-center gap-3"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pcr.status === "Draft" ? "text-yellow-400 bg-yellow-500/10" : "text-green-400 bg-green-500/10"}`}>{pcr.status}</span><div><p className="text-white font-medium text-sm">{pcr.patient_name}</p><p className="text-xs text-slate-500 font-mono">{pcr.pcr_number}</p></div></div>
              <div className="text-right"><p className="text-xs text-slate-400">{pcr.disposition}</p><p className="text-[10px] text-slate-600">{pcr.filed_by_name}</p></div>
            </button>
          ))}</div>
        )}
      </div>
    </div>
  );
}