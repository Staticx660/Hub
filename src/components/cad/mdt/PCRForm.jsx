import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ClipboardList, Plus, ArrowLeft, Save, Activity, Heart, Pill, FileText, Truck, User, Stethoscope, Sparkles } from "lucide-react";
import PCRPatientTab from "@/components/cad/pcr/PCRPatientTab";
import { generatePCRNarrative } from "@/lib/aiNarrative";
import PCRHistoryTab from "@/components/cad/pcr/PCRHistoryTab";
import PCRAssessmentTab from "@/components/cad/pcr/PCRAssessmentTab";
import PCRVitalsTab from "@/components/cad/pcr/PCRVitalsTab";
import PCRTreatmentTab from "@/components/cad/pcr/PCRTreatmentTab";

const TABS = [
  { id: "patient", label: "Patient", icon: User },
  { id: "history", label: "History", icon: Stethoscope },
  { id: "assessment", label: "Assessment", icon: Activity },
  { id: "vitals", label: "Vitals", icon: Heart },
  { id: "treatment", label: "Treatment", icon: Pill },
  { id: "disposition", label: "Disposition", icon: Truck },
  { id: "narrative", label: "Narrative", icon: FileText },
];

export default function PCRForm({ department, session }) {
  const [pcrs, setPcrs] = useState([]);
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("patient");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadPcrs(); }, []);

  const loadPcrs = async () => {
    try {
      const list = await base44.entities.PatientCareReport.filter({ department_id: department.id }, "-created_date", 50);
      setPcrs(list);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  const startNew = () => {
    setForm({
      pcr_number: `PCR-${Date.now().toString().slice(-6)}`,
      patient_civilian_id: "", patient_name: "", patient_dob: "", patient_age: "", patient_gender: "Unknown",
      patient_race: "", patient_address: "", patient_phone: "", blood_type: "",
      incident_location: "", incident_type: department.category === "Fire" ? "Fire" : "Medical",
      allergies: [], food_allergies: [], medications: [], medical_history: [],
      symptoms: "", last_oral_intake: "", events_leading: "",
      pain_onset: "", pain_provocation: "", pain_quality: "", pain_radiation: "", pain_severity: "", pain_time: "",
      general_impression: "", loc: "Alert", gcs_eye: "4", gcs_verbal: "5", gcs_motor: "6",
      pupils_left: "", pupils_right: "", skin_color: "", skin_temp: "", skin_condition: "",
      airway_patency: "Open", airway_intervention: "", breathing_effort: "Normal",
      breath_sounds_left: "", breath_sounds_right: "",
      circulation_pulse_location: "", circulation_pulse_quality: "", capillary_refill: "", bleeding_control: "",
      traumatic: false, trauma_findings: "",
      head_assessment: "", neck_assessment: "", chest_assessment: "", abdomen_assessment: "", pelvis_assessment: "", back_assessment: "", extremities_assessment: "",
      vitals: [], iv_access: [], treatments: [], medications_administered: [],
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
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleGenerateNarrative = async () => {
    setGenerating(true);
    try {
      const narrative = await generatePCRNarrative(form);
      update("narrative", narrative);
      toast({ title: "Narrative generated" });
    } catch (e) { toast({ title: "Error generating narrative", description: e.message, variant: "destructive" }); }
    setGenerating(false);
  };

  const save = async (status) => {
    if (!form.patient_name?.trim()) { toast({ title: "Patient name required", variant: "destructive" }); setTab("patient"); return; }
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
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "patient" && <PCRPatientTab form={form} update={update} />}
          {tab === "history" && <PCRHistoryTab form={form} update={update} />}
          {tab === "assessment" && <PCRAssessmentTab form={form} update={update} />}
          {tab === "vitals" && <PCRVitalsTab form={form} update={update} />}
          {tab === "treatment" && <PCRTreatmentTab form={form} update={update} />}
          {tab === "narrative" && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-slate-400 text-xs">Patient Care Narrative</Label>
                <Button onClick={handleGenerateNarrative} disabled={generating} size="sm" variant="outline" className="border-slate-700 text-cyan-400 hover:text-cyan-300 h-7 gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5" /> {generating ? "Generating..." : "AI Generate"}
                </Button>
              </div>
              <Textarea value={form.narrative || ""} onChange={(e) => update("narrative", e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1" rows={18} placeholder="Document the full patient encounter: dispatch info, arrival, scene safety, mechanism/nature of illness, initial assessment, interventions performed, patient response, changes in condition, transport, and transfer of care..." />
              <p className="text-xs text-slate-500 mt-2">{(form.narrative || "").length} characters</p>
              <p className="text-xs text-slate-600 mt-1">Tip: Fill out all other tabs first, then click AI Generate to compile a narrative from your data.</p>
            </div>
          )}
          {tab === "disposition" && (
            <div className="max-w-2xl space-y-4">
              <div>
                <Label className="text-slate-400 text-xs">Disposition</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {["Transported", "Treated/Released", "Refused AMA", "Deceased", "Transferred", "No Treatment"].map((d) => (
                    <button key={d} onClick={() => update("disposition", d)} className={`px-2 py-2 rounded-lg text-xs font-medium ${form.disposition === d ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{d}</button>
                  ))}
                </div>
              </div>
              {(form.disposition === "Transported" || form.disposition === "Transferred") && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-slate-400 text-xs">Destination</Label><input value={form.destination || ""} onChange={(e) => update("destination", e.target.value)} className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-white mt-1" placeholder="e.g. Pillbox Hill Medical Center" /></div>
                  <div><Label className="text-slate-400 text-xs">Transport Method</Label><input value={form.transport_method || ""} onChange={(e) => update("transport_method", e.target.value)} className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-white mt-1" placeholder="e.g. Ambulance, Air" /></div>
                </div>
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
          <div className="space-y-2">{pcrs.map((pcr) => (
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