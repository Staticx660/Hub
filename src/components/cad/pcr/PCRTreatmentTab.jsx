import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Droplet, Activity, Pill } from "lucide-react";

const Section = ({ title, icon: Icon, color, children }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
    <h3 className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color }}>{<Icon className="w-3.5 h-3.5" />} {title}</h3>
    {children}
  </div>
);

export default function PCRTreatmentTab({ form, update }) {
  const ivs = form.iv_access || [];
  const treatments = form.treatments || [];
  const meds = form.medications_administered || [];

  const addIV = () => update("iv_access", [...ivs, { timestamp: new Date().toISOString(), site: "", gauge: "", fluid: "", flow_rate: "" }]);
  const updateIV = (i, f, v) => { const a = [...ivs]; a[i] = { ...a[i], [f]: v }; update("iv_access", a); };
  const removeIV = (i) => update("iv_access", ivs.filter((_, idx) => idx !== i));

  const addTx = () => update("treatments", [...treatments, { timestamp: new Date().toISOString(), intervention: "", result: "" }]);
  const updateTx = (i, f, v) => { const a = [...treatments]; a[i] = { ...a[i], [f]: v }; update("treatments", a); };
  const removeTx = (i) => update("treatments", treatments.filter((_, idx) => idx !== i));

  const addMed = () => update("medications_administered", [...meds, { timestamp: new Date().toISOString(), medication: "", dose: "", route: "", response: "" }]);
  const updateMed = (i, f, v) => { const a = [...meds]; a[i] = { ...a[i], [f]: v }; update("medications_administered", a); };
  const removeMed = (i) => update("medications_administered", meds.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-4xl space-y-3">
      <Section title="IV / IO Access" icon={Droplet} color="#ef4444">
        <div className="flex items-center justify-end mb-2"><Button onClick={addIV} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Line</Button></div>
        {ivs.length === 0 ? <p className="text-xs text-slate-600 text-center py-3">No IV/IO access documented</p> : (
          <div className="space-y-2">{ivs.map((iv, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{new Date(iv.timestamp).toLocaleTimeString()}</span>
              <Input value={iv.site} onChange={(e) => updateIV(i, "site", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1 min-w-[100px]" placeholder="Site (L AC, R forearm)" />
              <Input value={iv.gauge} onChange={(e) => updateIV(i, "gauge", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-20" placeholder="Gauge (18g)" />
              <Input value={iv.fluid} onChange={(e) => updateIV(i, "fluid", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-28" placeholder="Fluid (NS, LR)" />
              <Input value={iv.flow_rate} onChange={(e) => updateIV(i, "flow_rate", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-24" placeholder="Rate (TKO, wide)" />
              <button onClick={() => removeIV(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}</div>
        )}
      </Section>

      <Section title="Interventions" icon={Activity} color="#22c55e">
        <div className="flex items-center justify-end mb-2"><Button onClick={addTx} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button></div>
        {treatments.length === 0 ? <p className="text-xs text-slate-600 text-center py-3">No interventions recorded</p> : (
          <div className="space-y-2">{treatments.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{new Date(t.timestamp).toLocaleTimeString()}</span>
              <Input value={t.intervention} onChange={(e) => updateTx(i, "intervention", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1" placeholder="Oxygen 2L NC, splinting, bleeding control..." />
              <Input value={t.result} onChange={(e) => updateTx(i, "result", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1" placeholder="Result / patient response" />
              <button onClick={() => removeTx(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}</div>
        )}
      </Section>

      <Section title="Medications Administered" icon={Pill} color="#3b82f6">
        <div className="flex items-center justify-end mb-2"><Button onClick={addMed} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button></div>
        {meds.length === 0 ? <p className="text-xs text-slate-600 text-center py-3">No medications administered</p> : (
          <div className="space-y-2">{meds.map((m, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{new Date(m.timestamp).toLocaleTimeString()}</span>
              <Input value={m.medication} onChange={(e) => updateMed(i, "medication", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1 min-w-[120px]" placeholder="Drug name" />
              <Input value={m.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-24" placeholder="Dose" />
              <Input value={m.route} onChange={(e) => updateMed(i, "route", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-24" placeholder="Route (IV, IM, PO)" />
              <Input value={m.response} onChange={(e) => updateMed(i, "response", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8 flex-1 min-w-[100px]" placeholder="Response" />
              <button onClick={() => removeMed(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}</div>
        )}
      </Section>
    </div>
  );
}