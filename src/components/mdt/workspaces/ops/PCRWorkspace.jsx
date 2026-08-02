import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import DataTable from "@/components/mdt/ui/DataTable";
import { Btn, StatusPill } from "@/components/mdt/ui/primitives";
import PCRPatientTab from "@/components/cad/pcr/PCRPatientTab";
import PCRHistoryTab from "@/components/cad/pcr/PCRHistoryTab";
import PCRAssessmentTab from "@/components/cad/pcr/PCRAssessmentTab";
import PCRVitalsTab from "@/components/cad/pcr/PCRVitalsTab";
import PCRTreatmentTab from "@/components/cad/pcr/PCRTreatmentTab";
import { generatePCRNarrative } from "@/lib/aiNarrative";
import { Plus, ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";

const INPUT = "h-7 px-2 bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const FORM_TABS = ["patient", "history", "assessment", "vitals", "treatment", "disposition", "narrative"];
const DISPOSITIONS = ["Transported", "Treated/Released", "Refused AMA", "Deceased", "Transferred", "No Treatment"];

/** Patient Care Reports — enterprise list + full PCR form. */
export default function PCRWorkspace({ department, session }) {
  const { toast } = useToast();
  const [pcrs, setPcrs] = useState([]);
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("patient");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      setPcrs(await base44.entities.PatientCareReport.filter({ department_id: department.id }, "-created_date", 100));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const startNew = () => {
    setForm({
      pcr_number: `PCR-${Date.now().toString().slice(-6)}`,
      patient_name: "", patient_dob: "", patient_age: "", patient_gender: "Unknown",
      incident_type: department.category === "Fire" ? "Fire" : "Medical",
      allergies: [], food_allergies: [], medications: [], medical_history: [],
      loc: "Alert", gcs_eye: "4", gcs_verbal: "5", gcs_motor: "6",
      airway_patency: "Open", breathing_effort: "Normal", traumatic: false,
      vitals: [], iv_access: [], treatments: [], medications_administered: [],
      narrative: "", disposition: "Transported", destination: "", transport_method: "",
      department_id: department.id,
      filed_by_name: session?.user_name || "",
      filed_by_id: session?.user_id || "",
      status: "Draft",
    });
    setTab("patient");
  };

  const generate = async () => {
    setGenerating(true);
    try {
      update("narrative", await generatePCRNarrative(form, session, department));
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
      if (form.id) await base44.entities.PatientCareReport.update(form.id, data);
      else await base44.entities.PatientCareReport.create(data);
      toast({ title: status === "Filed" ? "PCR filed" : "PCR saved", description: form.pcr_number });
      setForm(null);
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-mdt-dim animate-spin" /></div>;

  if (form) {
    return (
      <>
        <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
          <Btn icon={ArrowLeft} onClick={() => setForm(null)}>Back</Btn>
          <span className="text-[12px] uppercase tracking-[0.06em] text-mdt-muted">Patient Care Report</span>
          <span className="text-[12.5px] font-mono text-mdt-text">{form.pcr_number}</span>
          <StatusPill tone={form.status === "Draft" ? "warn" : "ok"}>{form.status}</StatusPill>
          <div className="flex-1" />
          <Btn onClick={() => save("Draft")} disabled={saving}>Save Draft</Btn>
          <Btn variant="primary" icon={Save} onClick={() => save("Filed")} disabled={saving}>{saving ? "Saving" : "File PCR"}</Btn>
        </div>

        <div className="flex items-center gap-1 h-8 px-3 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0 overflow-x-auto">
          {FORM_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-6 px-2.5 border text-[12.5px] capitalize whitespace-nowrap ${tab === t ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-accent" : "bg-mdt-surface border-mdt-line text-mdt-text hover:bg-mdt-surface-3"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-auto mdt-scroll p-3">
          {tab === "patient" && <PCRPatientTab form={form} update={update} />}
          {tab === "history" && <PCRHistoryTab form={form} update={update} />}
          {tab === "assessment" && <PCRAssessmentTab form={form} update={update} />}
          {tab === "vitals" && <PCRVitalsTab form={form} update={update} />}
          {tab === "treatment" && <PCRTreatmentTab form={form} update={update} />}
          {tab === "disposition" && (
            <div className="max-w-2xl space-y-3">
              <div>
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">Disposition</div>
                <div className="flex flex-wrap gap-1.5">
                  {DISPOSITIONS.map((d) => (
                    <button key={d} onClick={() => update("disposition", d)} className={`h-7 px-2.5 border text-[12.5px] ${form.disposition === d ? "bg-mdt-accent/15 border-mdt-accent/60 text-mdt-accent" : "bg-mdt-surface border-mdt-line text-mdt-text hover:bg-mdt-surface-3"}`}>{d}</button>
                  ))}
                </div>
              </div>
              {(form.disposition === "Transported" || form.disposition === "Transferred") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">Destination</div>
                    <input value={form.destination || ""} onChange={(e) => update("destination", e.target.value)} placeholder="e.g. Pillbox Hill Medical Center" className={`${INPUT} w-full`} />
                  </div>
                  <div>
                    <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">Transport Method</div>
                    <input value={form.transport_method || ""} onChange={(e) => update("transport_method", e.target.value)} placeholder="e.g. Ambulance, Air" className={`${INPUT} w-full`} />
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "narrative" && (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">Patient Care Narrative</div>
                <Btn icon={Sparkles} onClick={generate} disabled={generating}>{generating ? "Generating…" : "AI Generate"}</Btn>
              </div>
              <textarea
                value={form.narrative || ""}
                onChange={(e) => update("narrative", e.target.value)}
                rows={18}
                placeholder="Dispatch, arrival, scene, assessment, interventions, response, transport, transfer of care…"
                className="w-full p-2 bg-mdt-surface-2 border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent resize-none"
              />
              <p className="text-[11px] text-mdt-dim mt-1">{(form.narrative || "").length} characters</p>
            </div>
          )}
        </div>
      </>
    );
  }

  const columns = [
    { key: "pcr_number", label: "PCR #", width: 120, mono: true },
    { key: "patient_name", label: "Patient", width: 200 },
    { key: "incident_type", label: "Type", width: 130 },
    { key: "disposition", label: "Disposition", width: 150 },
    { key: "status", label: "Status", width: 96, render: (r) => <StatusPill tone={r.status === "Draft" ? "warn" : r.status === "Reviewed" ? "info" : "ok"}>{r.status}</StatusPill> },
    { key: "filed_by_name", label: "Filed By", width: 150 },
    { key: "created_date", label: "Date", width: 110, render: (r) => (r.created_date ? new Date(r.created_date).toLocaleDateString() : "—") },
  ];

  return (
    <>
      <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        <span className="text-[12px] uppercase tracking-[0.06em] text-mdt-muted">Patient Care Reports</span>
        <span className="text-[12.5px] text-mdt-muted">{pcrs.length} on file</span>
        <div className="flex-1" />
        <Btn variant="primary" icon={Plus} onClick={startNew}>New PCR</Btn>
      </div>
      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        <DataTable
          columns={columns}
          rows={pcrs}
          onRowClick={(r) => { setForm({ ...r }); setTab("patient"); }}
          sort={{ key: "created_date", dir: "desc" }}
          emptyMessage="No PCRs filed"
        />
      </div>
    </>
  );
}