import React from "react";
import { MField, MInput, MTextarea, MSection, MChips } from "@/components/mdt/ui/formFields";

export default function HistoryTab({ form, update }) {
  return (
    <div className="max-w-4xl space-y-2.5">
      <MSection title="Allergies (A)">
        <MField label="Drug / Environmental"><MChips values={form.allergies || []} onChange={(v) => update("allergies", v)} placeholder="Penicillin, Latex, Bee stings…" /></MField>
        <div className="mt-2"><MField label="Food"><MChips values={form.food_allergies || []} onChange={(v) => update("food_allergies", v)} placeholder="Peanuts, Shellfish…" /></MField></div>
      </MSection>

      <MSection title="Medications (M)">
        <MChips values={form.medications || []} onChange={(v) => update("medications", v)} placeholder="Aspirin, Metformin, Lisinopril…" />
      </MSection>

      <MSection title="Past Medical History (P)">
        <MChips values={form.medical_history || []} onChange={(v) => update("medical_history", v)} placeholder="HTN, DM, Asthma, MI, prior surgeries…" />
      </MSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <MSection title="Last Oral Intake (L)">
          <MInput value={form.last_oral_intake || ""} onChange={(e) => update("last_oral_intake", e.target.value)} placeholder="e.g. Ate lunch 2hrs ago" />
        </MSection>
        <MSection title="Events Leading (E)">
          <MInput value={form.events_leading || ""} onChange={(e) => update("events_leading", e.target.value)} placeholder="e.g. Chest pain while walking" />
        </MSection>
      </div>

      <MSection title="Symptoms / Chief Complaint (S)">
        <MTextarea value={form.symptoms || ""} onChange={(e) => update("symptoms", e.target.value)} rows={3} placeholder="Patient's primary complaint in their own words" />
      </MSection>

      <MSection title="OPQRST Pain Assessment">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <MField label="Onset"><MInput value={form.pain_onset || ""} onChange={(e) => update("pain_onset", e.target.value)} placeholder="When did it start?" /></MField>
          <MField label="Provocation"><MInput value={form.pain_provocation || ""} onChange={(e) => update("pain_provocation", e.target.value)} placeholder="What makes it worse?" /></MField>
          <MField label="Quality"><MInput value={form.pain_quality || ""} onChange={(e) => update("pain_quality", e.target.value)} placeholder="Sharp, dull, burning" /></MField>
          <MField label="Radiation"><MInput value={form.pain_radiation || ""} onChange={(e) => update("pain_radiation", e.target.value)} placeholder="Does it move?" /></MField>
          <MField label="Severity (0-10)"><MInput type="number" min="0" max="10" value={form.pain_severity || ""} onChange={(e) => update("pain_severity", e.target.value)} /></MField>
          <MField label="Time"><MInput value={form.pain_time || ""} onChange={(e) => update("pain_time", e.target.value)} placeholder="How long / pattern" /></MField>
        </div>
      </MSection>
    </div>
  );
}