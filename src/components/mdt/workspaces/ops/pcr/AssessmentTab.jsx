import React from "react";
import { MField, MInput, MTextarea, MSelect, MSection, MToggleGroup } from "@/components/mdt/ui/formFields";

const BODY_PARTS = [
  { field: "head_assessment", label: "Head" },
  { field: "neck_assessment", label: "Neck" },
  { field: "chest_assessment", label: "Chest" },
  { field: "abdomen_assessment", label: "Abdomen" },
  { field: "pelvis_assessment", label: "Pelvis" },
  { field: "back_assessment", label: "Back" },
  { field: "extremities_assessment", label: "Extremities" },
];

export default function AssessmentTab({ form, update }) {
  const gcsTotal = (parseInt(form.gcs_eye) || 0) + (parseInt(form.gcs_verbal) || 0) + (parseInt(form.gcs_motor) || 0);

  return (
    <div className="max-w-4xl space-y-2.5">
      <MSection title="General Impression">
        <MTextarea value={form.general_impression || ""} onChange={(e) => update("general_impression", e.target.value)} rows={3} placeholder="First-contact impression — sick vs not sick, obvious injuries, position" />
      </MSection>

      <MSection title="Level of Consciousness">
        <MField label="LOC"><MToggleGroup options={["Alert", "Verbal", "Pain", "Unresponsive"]} value={form.loc || "Alert"} onChange={(v) => update("loc", v)} /></MField>
        <div className="grid grid-cols-4 gap-2.5 mt-2.5 items-end">
          <MField label="Eye (1-4)"><MInput type="number" min="1" max="4" value={form.gcs_eye || ""} onChange={(e) => update("gcs_eye", e.target.value)} /></MField>
          <MField label="Verbal (1-5)"><MInput type="number" min="1" max="5" value={form.gcs_verbal || ""} onChange={(e) => update("gcs_verbal", e.target.value)} /></MField>
          <MField label="Motor (1-6)"><MInput type="number" min="1" max="6" value={form.gcs_motor || ""} onChange={(e) => update("gcs_motor", e.target.value)} /></MField>
          <div className="border border-mdt-line-2 bg-mdt-surface-2 px-2 py-1 text-center">
            <div className="text-[9.5px] uppercase tracking-[0.09em] text-mdt-dim">GCS Total</div>
            <div className="text-[15px] font-semibold text-mdt-text">{gcsTotal || 0}<span className="text-[11px] text-mdt-dim">/15</span></div>
          </div>
        </div>
      </MSection>

      <MSection title="Pupils & Skin">
        <div className="grid grid-cols-2 gap-2.5">
          <MField label="Left Pupil"><MInput value={form.pupils_left || ""} onChange={(e) => update("pupils_left", e.target.value)} placeholder="4mm reactive" /></MField>
          <MField label="Right Pupil"><MInput value={form.pupils_right || ""} onChange={(e) => update("pupils_right", e.target.value)} placeholder="3mm reactive" /></MField>
        </div>
        <div className="grid grid-cols-3 gap-2.5 mt-2.5">
          <MField label="Skin Color"><MInput value={form.skin_color || ""} onChange={(e) => update("skin_color", e.target.value)} placeholder="Pink, pale, cyanotic" /></MField>
          <MField label="Skin Temp"><MInput value={form.skin_temp || ""} onChange={(e) => update("skin_temp", e.target.value)} placeholder="Warm, cool, hot" /></MField>
          <MField label="Skin Condition"><MInput value={form.skin_condition || ""} onChange={(e) => update("skin_condition", e.target.value)} placeholder="Dry, moist, diaphoretic" /></MField>
        </div>
      </MSection>

      <MSection title="Airway (A)">
        <div className="grid grid-cols-2 gap-2.5">
          <MField label="Patency"><MSelect value={form.airway_patency || "Open"} onChange={(e) => update("airway_patency", e.target.value)} options={["Open", "Partially Obstructed", "Obstructed"]} /></MField>
          <MField label="Intervention"><MInput value={form.airway_intervention || ""} onChange={(e) => update("airway_intervention", e.target.value)} placeholder="NPA, OPA, suction, none" /></MField>
        </div>
      </MSection>

      <MSection title="Breathing (B)">
        <div className="grid grid-cols-3 gap-2.5">
          <MField label="Effort"><MSelect value={form.breathing_effort || "Normal"} onChange={(e) => update("breathing_effort", e.target.value)} options={["Normal", "Labored", "Shallow", "Absent", "Agonal"]} /></MField>
          <MField label="Lung Sounds — Left"><MInput value={form.breath_sounds_left || ""} onChange={(e) => update("breath_sounds_left", e.target.value)} placeholder="Clear, wheeze, rales" /></MField>
          <MField label="Lung Sounds — Right"><MInput value={form.breath_sounds_right || ""} onChange={(e) => update("breath_sounds_right", e.target.value)} placeholder="Clear, wheeze, rales" /></MField>
        </div>
      </MSection>

      <MSection title="Circulation (C)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <MField label="Pulse Location"><MInput value={form.circulation_pulse_location || ""} onChange={(e) => update("circulation_pulse_location", e.target.value)} placeholder="Radial, carotid" /></MField>
          <MField label="Pulse Quality"><MInput value={form.circulation_pulse_quality || ""} onChange={(e) => update("circulation_pulse_quality", e.target.value)} placeholder="Strong, weak, thready" /></MField>
          <MField label="Capillary Refill"><MInput value={form.capillary_refill || ""} onChange={(e) => update("capillary_refill", e.target.value)} placeholder="<2s, delayed" /></MField>
          <MField label="Bleeding Control"><MInput value={form.bleeding_control || ""} onChange={(e) => update("bleeding_control", e.target.value)} placeholder="Pressure, tourniquet, none" /></MField>
        </div>
      </MSection>

      <MSection title="Trauma Assessment">
        <MField label="Nature"><MToggleGroup options={["Medical", "Trauma"]} value={form.traumatic ? "Trauma" : "Medical"} onChange={(v) => update("traumatic", v === "Trauma")} /></MField>
        {form.traumatic && (
          <>
            <div className="mt-2.5">
              <MField label="DCAP-BTLS Findings"><MTextarea value={form.trauma_findings || ""} onChange={(e) => update("trauma_findings", e.target.value)} rows={3} placeholder="Deformities, contusions, abrasions, punctures, burns, tenderness, lacerations, swelling — with locations" /></MField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5">
              {BODY_PARTS.map((bp) => (
                <MField key={bp.field} label={bp.label}><MInput value={form[bp.field] || ""} onChange={(e) => update(bp.field, e.target.value)} placeholder="Unremarkable / findings…" /></MField>
              ))}
            </div>
          </>
        )}
      </MSection>
    </div>
  );
}