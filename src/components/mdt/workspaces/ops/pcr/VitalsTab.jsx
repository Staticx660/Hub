import React from "react";
import { MField, MInput, MSection } from "@/components/mdt/ui/formFields";
import { Btn, EmptyState } from "@/components/mdt/ui/primitives";
import { Plus, Trash2, Heart } from "lucide-react";

const NUM_FIELDS = [
  { key: "bp_systolic", label: "BP Sys" },
  { key: "bp_diastolic", label: "BP Dia" },
  { key: "heart_rate", label: "HR" },
  { key: "respiratory_rate", label: "RR" },
  { key: "spo2", label: "SpO₂" },
  { key: "temperature", label: "Temp" },
  { key: "bgl", label: "BGL" },
  { key: "pain_score", label: "Pain" },
];

export default function VitalsTab({ form, update }) {
  const vitals = form.vitals || [];
  const add = () => update("vitals", [...vitals, { timestamp: new Date().toISOString(), bp_systolic: "", bp_diastolic: "", heart_rate: "", respiratory_rate: "", spo2: "", temperature: "", bgl: "", pain_score: "", capillary_refill: "", lung_sounds: "" }]);
  const set = (i, field, value) => { const v = [...vitals]; v[i] = { ...v[i], [field]: value }; update("vitals", v); };
  const remove = (i) => update("vitals", vitals.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-5xl space-y-2.5">
      <MSection title="Vital Signs — Serial" actions={<Btn icon={Plus} onClick={add}>Add Set</Btn>}>
        {vitals.length === 0 ? (
          <EmptyState icon={Heart} title="No vitals recorded" hint="Add a vital set to begin serial documentation" />
        ) : (
          <div className="space-y-2.5">
            {vitals.map((v, i) => (
              <div key={i} className="border border-mdt-line bg-mdt-surface-2 p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11.5px] font-mono text-mdt-dim">Set {i + 1} · {new Date(v.timestamp).toLocaleTimeString("en-US", { hour12: false })}</span>
                  <button onClick={() => remove(i)} className="text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                  {NUM_FIELDS.map((f) => (
                    <MField key={f.key} label={f.label}><MInput type="number" value={v[f.key] || ""} onChange={(e) => set(i, f.key, e.target.value)} /></MField>
                  ))}
                  <MField label="Cap Refill"><MInput value={v.capillary_refill || ""} onChange={(e) => set(i, "capillary_refill", e.target.value)} placeholder="<2s" /></MField>
                  <MField label="Lung Sounds" className="col-span-3 md:col-span-5 lg:col-span-9"><MInput value={v.lung_sounds || ""} onChange={(e) => set(i, "lung_sounds", e.target.value)} placeholder="Clear bilaterally / wheezing / rales / diminished" /></MField>
                </div>
              </div>
            ))}
          </div>
        )}
      </MSection>
    </div>
  );
}