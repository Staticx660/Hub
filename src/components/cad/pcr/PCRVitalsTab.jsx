import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Heart } from "lucide-react";

export default function PCRVitalsTab({ form, update }) {
  const vitals = form.vitals || [];
  const addVital = () => update("vitals", [...vitals, { timestamp: new Date().toISOString(), bp_systolic: "", bp_diastolic: "", heart_rate: "", respiratory_rate: "", spo2: "", temperature: "", bgl: "", pain_score: "", capillary_refill: "", lung_sounds: "" }]);
  const updateVital = (i, field, value) => { const v = [...vitals]; v[i] = { ...v[i], [field]: value }; update("vitals", v); };
  const removeVital = (i) => update("vitals", vitals.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Vital Signs — Serial</h3>
        <Button onClick={addVital} size="sm" variant="outline" className="border-slate-700 text-slate-300 gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Vital Set</Button>
      </div>
      {vitals.length === 0 ? (
        <div className="text-center py-12 text-slate-600"><Heart className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No vitals recorded</p></div>
      ) : (
        <div className="space-y-3">
          {vitals.map((v, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-500">Set {i + 1} · {new Date(v.timestamp).toLocaleTimeString()}</span>
                <button onClick={() => removeVital(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                <div><Label className="text-slate-500 text-[10px]">BP Sys</Label><Input type="number" value={v.bp_systolic || ""} onChange={(e) => updateVital(i, "bp_systolic", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                <div><Label className="text-slate-500 text-[10px]">BP Dia</Label><Input type="number" value={v.bp_diastolic || ""} onChange={(e) => updateVital(i, "bp_diastolic", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                <div><Label className="text-slate-500 text-[10px]">HR</Label><Input type="number" value={v.heart_rate || ""} onChange={(e) => updateVital(i, "heart_rate", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                <div><Label className="text-slate-500 text-[10px]">RR</Label><Input type="number" value={v.respiratory_rate || ""} onChange={(e) => updateVital(i, "respiratory_rate", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                <div><Label className="text-slate-500 text-[10px]">SpO₂</Label><Input type="number" value={v.spo2 || ""} onChange={(e) => updateVital(i, "spo2", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                <div><Label className="text-slate-500 text-[10px]">Temp</Label><Input type="number" step="0.1" value={v.temperature || ""} onChange={(e) => updateVital(i, "temperature", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                <div><Label className="text-slate-500 text-[10px]">BGL</Label><Input type="number" value={v.bgl || ""} onChange={(e) => updateVital(i, "bgl", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                <div><Label className="text-slate-500 text-[10px]">Pain</Label><Input type="number" min="0" max="10" value={v.pain_score || ""} onChange={(e) => updateVital(i, "pain_score", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" /></div>
                <div><Label className="text-slate-500 text-[10px]">Cap Refill</Label><Input value={v.capillary_refill || ""} onChange={(e) => updateVital(i, "capillary_refill", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" placeholder="<2s" /></div>
                <div className="col-span-3 md:col-span-5 lg:col-span-9"><Label className="text-slate-500 text-[10px]">Lung Sounds</Label><Input value={v.lung_sounds || ""} onChange={(e) => updateVital(i, "lung_sounds", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm h-8" placeholder="Clear bilaterally / wheezing / rales / diminished" /></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}