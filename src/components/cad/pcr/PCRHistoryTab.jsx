import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ChipInput from "@/components/cad/pcr/ChipInput";
import { AlertCircle, Pill, Heart, Utensils, Activity, Clock } from "lucide-react";

const Section = ({ title, icon: Icon, color, children }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
    <h3 className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color }}>{<Icon className="w-3.5 h-3.5" />} {title}</h3>
    {children}
  </div>
);

export default function PCRHistoryTab({ form, update }) {
  return (
    <div className="max-w-3xl space-y-3">
      <Section title="Allergies (A)" icon={AlertCircle} color="#ef4444">
        <Label className="text-slate-500 text-[10px] mb-1 block">Drug / Environmental Allergies</Label>
        <ChipInput values={form.allergies || []} onChange={(v) => update("allergies", v)} placeholder="Penicillin, Latex, Bee stings..." />
        <Label className="text-slate-500 text-[10px] mb-1 mt-3 block">Food Allergies</Label>
        <ChipInput values={form.food_allergies || []} onChange={(v) => update("food_allergies", v)} placeholder="Peanuts, Shellfish..." />
      </Section>

      <Section title="Medications (M)" icon={Pill} color="#3b82f6">
        <ChipInput values={form.medications || []} onChange={(v) => update("medications", v)} placeholder="Aspirin, Metformin, Lisinopril..." />
      </Section>

      <Section title="Past Medical History (P)" icon={Heart} color="#a855f7">
        <ChipInput values={form.medical_history || []} onChange={(v) => update("medical_history", v)} placeholder="HTN, DM, Asthma, MI, Prior surgeries..." />
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Section title="Last Oral Intake (L)" icon={Utensils} color="#22c55e">
          <Input value={form.last_oral_intake || ""} onChange={(e) => update("last_oral_intake", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Ate lunch 2hrs ago" />
        </Section>
        <Section title="Events Leading (E)" icon={Activity} color="#f59e0b">
          <Input value={form.events_leading || ""} onChange={(e) => update("events_leading", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Chest pain while walking" />
        </Section>
      </div>

      <Section title="Symptoms / Chief Complaint (S)" icon={Activity} color="#64748b">
        <Textarea value={form.symptoms || ""} onChange={(e) => update("symptoms", e.target.value)} className="bg-slate-800 border-slate-700 text-white" rows={2} placeholder="Patient's primary complaint in their own words" />
      </Section>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5 text-blue-400"><Clock className="w-3.5 h-3.5" /> OPQRST Pain Assessment</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><Label className="text-slate-500 text-[10px]">Onset</Label><Input value={form.pain_onset || ""} onChange={(e) => update("pain_onset", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="When did it start?" /></div>
          <div><Label className="text-slate-500 text-[10px]">Provocation</Label><Input value={form.pain_provocation || ""} onChange={(e) => update("pain_provocation", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="What makes it worse?" /></div>
          <div><Label className="text-slate-500 text-[10px]">Quality</Label><Input value={form.pain_quality || ""} onChange={(e) => update("pain_quality", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Sharp, dull, burning" /></div>
          <div><Label className="text-slate-500 text-[10px]">Radiation</Label><Input value={form.pain_radiation || ""} onChange={(e) => update("pain_radiation", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Does it move anywhere?" /></div>
          <div><Label className="text-slate-500 text-[10px]">Severity (0-10)</Label><Input type="number" min="0" max="10" value={form.pain_severity || ""} onChange={(e) => update("pain_severity", e.target.value)} className="bg-slate-800 border-slate-700 text-white" /></div>
          <div><Label className="text-slate-500 text-[10px]">Time</Label><Input value={form.pain_time || ""} onChange={(e) => update("pain_time", e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="How long / pattern" /></div>
        </div>
      </div>
    </div>
  );
}