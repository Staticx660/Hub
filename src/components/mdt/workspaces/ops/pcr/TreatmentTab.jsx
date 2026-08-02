import React from "react";
import { MInput, MSection } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";
import { Plus, Trash2 } from "lucide-react";

const Row = ({ timestamp, onRemove, children }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-[11px] font-mono text-mdt-dim whitespace-nowrap">{new Date(timestamp).toLocaleTimeString("en-US", { hour12: false })}</span>
    {children}
    <button onClick={onRemove} className="text-mdt-dim hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
  </div>
);

export default function TreatmentTab({ form, update }) {
  const ivs = form.iv_access || [];
  const treatments = form.treatments || [];
  const meds = form.medications_administered || [];

  const mut = (key, list) => ({
    add: (row) => update(key, [...list, { timestamp: new Date().toISOString(), ...row }]),
    set: (i, f, v) => { const a = [...list]; a[i] = { ...a[i], [f]: v }; update(key, a); },
    remove: (i) => update(key, list.filter((_, idx) => idx !== i)),
  });
  const iv = mut("iv_access", ivs);
  const tx = mut("treatments", treatments);
  const md = mut("medications_administered", meds);

  return (
    <div className="max-w-5xl space-y-2.5">
      <MSection title="IV / IO Access" actions={<Btn icon={Plus} onClick={() => iv.add({ site: "", gauge: "", fluid: "", flow_rate: "" })}>Add Line</Btn>}>
        {ivs.length === 0 ? <p className="text-[12px] text-mdt-dim">No IV/IO access documented</p> : (
          <div className="space-y-2">
            {ivs.map((r, i) => (
              <Row key={i} timestamp={r.timestamp} onRemove={() => iv.remove(i)}>
                <MInput value={r.site || ""} onChange={(e) => iv.set(i, "site", e.target.value)} placeholder="Site (L AC, R forearm)" className="flex-1 min-w-[120px]" />
                <MInput value={r.gauge || ""} onChange={(e) => iv.set(i, "gauge", e.target.value)} placeholder="18g" className="w-20" />
                <MInput value={r.fluid || ""} onChange={(e) => iv.set(i, "fluid", e.target.value)} placeholder="NS, LR" className="w-28" />
                <MInput value={r.flow_rate || ""} onChange={(e) => iv.set(i, "flow_rate", e.target.value)} placeholder="TKO, wide" className="w-28" />
              </Row>
            ))}
          </div>
        )}
      </MSection>

      <MSection title="Interventions" actions={<Btn icon={Plus} onClick={() => tx.add({ intervention: "", result: "" })}>Add</Btn>}>
        {treatments.length === 0 ? <p className="text-[12px] text-mdt-dim">No interventions recorded</p> : (
          <div className="space-y-2">
            {treatments.map((r, i) => (
              <Row key={i} timestamp={r.timestamp} onRemove={() => tx.remove(i)}>
                <MInput value={r.intervention || ""} onChange={(e) => tx.set(i, "intervention", e.target.value)} placeholder="Oxygen 2L NC, splinting…" className="flex-1 min-w-[140px]" />
                <MInput value={r.result || ""} onChange={(e) => tx.set(i, "result", e.target.value)} placeholder="Result / patient response" className="flex-1 min-w-[140px]" />
              </Row>
            ))}
          </div>
        )}
      </MSection>

      <MSection title="Medications Administered" actions={<Btn icon={Plus} onClick={() => md.add({ medication: "", dose: "", route: "", response: "" })}>Add</Btn>}>
        {meds.length === 0 ? <p className="text-[12px] text-mdt-dim">No medications administered</p> : (
          <div className="space-y-2">
            {meds.map((r, i) => (
              <Row key={i} timestamp={r.timestamp} onRemove={() => md.remove(i)}>
                <MInput value={r.medication || ""} onChange={(e) => md.set(i, "medication", e.target.value)} placeholder="Drug name" className="flex-1 min-w-[120px]" />
                <MInput value={r.dose || ""} onChange={(e) => md.set(i, "dose", e.target.value)} placeholder="Dose" className="w-24" />
                <MInput value={r.route || ""} onChange={(e) => md.set(i, "route", e.target.value)} placeholder="IV, IM, PO" className="w-24" />
                <MInput value={r.response || ""} onChange={(e) => md.set(i, "response", e.target.value)} placeholder="Response" className="flex-1 min-w-[120px]" />
              </Row>
            ))}
          </div>
        )}
      </MSection>
    </div>
  );
}