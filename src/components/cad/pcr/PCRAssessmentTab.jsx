import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Wind, Droplet, Bone } from "lucide-react";

const Section = ({ title, icon: Icon, color, children }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
    <h3 className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color }}>{<Icon className="w-3.5 h-3.5" />} {title}</h3>
    {children}
  </div>
);

const BtnGroup = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((o) => (
      <button key={o} type="button" onClick={() => onChange(o)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${value === o ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{o}</button>
    ))}
  </div>
);

export default function PCRAssessmentTab({ form, update }) {
  const gcsTotal = (parseInt(form.gcs_eye) || 0) + (parseInt(form.gcs_verbal) || 0) + (parseInt(form.gcs_motor) || 0);
  const bodyParts = [
    { field: "head_assessment", label: "Head" },
    { field: "neck_assessment", label: "Neck" },
    { field: "chest_assessment", label: "Chest" },
    { field: "abdomen_assessment", label: "Abdomen" },
    { field: "pelvis_assessment", label: "Pelvis" },
    { field: "back_assessment", label: "Back" },
    { field: "extremities_assessment", label: "Extremities" },
  ];

  return (
    <div className="max-w-3xl space-y-3">
      <Section title="General Impression" icon={Eye} color="#64748b">
        <Textarea value={form.general_impression || ""} onChange={(e) => update("general_impression", e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={2} placeholder="What you see/feel on first contact — sick vs not sick, obvious injuries, position" />
      </Section>

      <Section title="Level of Consciousness" icon={Eye} color="#3b82f6">
        <Label className="text-slate-500 text-[10px] mb-1.5 block">LOC</Label>
        <BtnGroup options={["Alert", "Verbal", "Pain", "Unresponsive"]} value={form.loc || "Alert"} onChange={(v) => update("loc", v)} />
        <div className="grid grid-cols-4 gap-3 mt-3 items-end">
          <div><Label className="text-slate-500 text-[10px]">Eye (1-4)</Label><Input type="number" min="1" max="4" value={form.gcs_eye || ""} onChange={(e) => update("gcs_eye", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div><Label className="text-slate-500 text-[10px]">Verbal (1-5)</Label><Input type="number" min="1" max="5" value={form.gcs_verbal || ""} onChange={(e) => update("gcs_verbal", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div><Label className="text-slate-500 text-[10px]">Motor (1-6)</Label><Input type="number" min="1" max="6" value={form.gcs_motor || ""} onChange={(e) => update("gcs_motor", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div className="bg-slate-800 rounded-lg px-2 py-1.5 text-center"><p className="text-[10px] text-slate-500">GCS Total</p><p className="text-lg font-bold text-white">{gcsTotal || 0}<span className="text-xs text-slate-500">/15</span></p></div>
        </div>
      </Section>

      <Section title="Pupils & Skin" icon={Eye} color="#a855f7">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><Label className="text-slate-500 text-[10px]">Left Pupil</Label><Input value={form.pupils_left || ""} onChange={(e) => update("pupils_left", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="4mm reactive" /></div>
          <div><Label className="text-slate-500 text-[10px]">Right Pupil</Label><Input value={form.pupils_right || ""} onChange={(e) => update("pupils_right", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="3mm reactive" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-slate-500 text-[10px]">Skin Color</Label><Input value={form.skin_color || ""} onChange={(e) => update("skin_color", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Pink, pale, cyanotic" /></div>
          <div><Label className="text-slate-500 text-[10px]">Skin Temp</Label><Input value={form.skin_temp || ""} onChange={(e) => update("skin_temp", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Warm, cool, hot" /></div>
          <div><Label className="text-slate-500 text-[10px]">Skin Condition</Label><Input value={form.skin_condition || ""} onChange={(e) => update("skin_condition", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Dry, moist, diaphoretic" /></div>
        </div>
      </Section>

      <Section title="Airway (A)" icon={Wind} color="#22c55e">
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-slate-500 text-[10px]">Patency</Label><Select value={form.airway_patency || "Open"} onValueChange={(v) => update("airway_patency", v)}><SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{["Open", "Partially Obstructed", "Obstructed"].map((o) => <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-slate-500 text-[10px]">Airway Intervention</Label><Input value={form.airway_intervention || ""} onChange={(e) => update("airway_intervention", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="NPA, OPA, suction, none" /></div>
        </div>
      </Section>

      <Section title="Breathing (B)" icon={Wind} color="#3b82f6">
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-slate-500 text-[10px]">Effort</Label><Select value={form.breathing_effort || "Normal"} onValueChange={(v) => update("breathing_effort", v)}><SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{["Normal", "Labored", "Shallow", "Absent", "Agonal"].map((o) => <SelectItem key={o} value={o} className="text-white">{o}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-slate-500 text-[10px]">Lung Sounds — Left</Label><Input value={form.breath_sounds_left || ""} onChange={(e) => update("breath_sounds_left", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Clear, wheeze, rales" /></div>
          <div><Label className="text-slate-500 text-[10px]">Lung Sounds — Right</Label><Input value={form.breath_sounds_right || ""} onChange={(e) => update("breath_sounds_right", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Clear, wheeze, rales" /></div>
        </div>
      </Section>

      <Section title="Circulation (C)" icon={Droplet} color="#ef4444">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label className="text-slate-500 text-[10px]">Pulse Location</Label><Input value={form.circulation_pulse_location || ""} onChange={(e) => update("circulation_pulse_location", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Radial, carotid" /></div>
          <div><Label className="text-slate-500 text-[10px]">Pulse Quality</Label><Input value={form.circulation_pulse_quality || ""} onChange={(e) => update("circulation_pulse_quality", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Strong, weak, thready" /></div>
          <div><Label className="text-slate-500 text-[10px]">Capillary Refill</Label><Input value={form.capillary_refill || ""} onChange={(e) => update("capillary_refill", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="<2s, delayed" /></div>
          <div><Label className="text-slate-500 text-[10px]">Bleeding Control</Label><Input value={form.bleeding_control || ""} onChange={(e) => update("bleeding_control", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Pressure, tourniquet, none" /></div>
        </div>
      </Section>

      <Section title="Trauma Assessment" icon={Bone} color="#f59e0b">
        <div className="flex items-center gap-3 mb-3">
          <Label className="text-slate-400 text-xs">Trauma?</Label>
          <button type="button" onClick={() => update("traumatic", !form.traumatic)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${form.traumatic ? "bg-orange-600 text-white" : "bg-slate-800 text-slate-400"}`}>{form.traumatic ? "Trauma" : "Medical"}</button>
        </div>
        {form.traumatic && (
          <>
            <Label className="text-slate-500 text-[10px] mb-1 block">DCAP-BTLS Findings</Label>
            <Textarea value={form.trauma_findings || ""} onChange={(e) => update("trauma_findings", e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={2} placeholder="Deformities, Contusions, Abrasions, Punctures, Burns, Tenderness, Lacerations, Swelling — note location and findings" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
              {bodyParts.map((bp) => (
                <div key={bp.field}><Label className="text-slate-500 text-[10px]">{bp.label}</Label><Input value={form[bp.field] || ""} onChange={(e) => update(bp.field, e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" placeholder="Unremarkable / findings..." /></div>
              ))}
            </div>
          </>
        )}
      </Section>
    </div>
  );
}