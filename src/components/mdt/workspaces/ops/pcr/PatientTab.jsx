import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MField, MInput, MSelect, MSection, MChips } from "@/components/mdt/ui/formFields";

const calcAge = (dob) => {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return String(age);
};

export default function PatientTab({ form, update }) {
  const [civilians, setCivilians] = useState([]);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => { base44.entities.Civilian.list("-created_date", 300).then(setCivilians).catch(() => {}); }, []);

  const results = search.length >= 2
    ? civilians.filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const selectCivilian = (c) => {
    update("patient_civilian_id", c.id);
    update("patient_name", `${c.last_name}, ${c.first_name}`);
    update("patient_dob", c.dob || "");
    update("patient_age", c.dob ? calcAge(c.dob) : "");
    update("patient_gender", c.gender || "Unknown");
    update("patient_race", c.race || "");
    update("patient_address", c.address || "");
    update("patient_phone", c.phone || "");
    update("allergies", c.allergies || []);
    update("food_allergies", c.food_allergies || []);
    update("medications", c.medications || []);
    update("medical_history", c.medical_history || []);
    setSearch(`${c.last_name}, ${c.first_name}`);
    setShowResults(false);
  };

  return (
    <div className="max-w-4xl space-y-2.5">
      <MSection title="Patient Lookup">
        <div className="relative">
          <MInput value={search} onChange={(e) => { setSearch(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} placeholder="Search civilian records to auto-fill…" />
          {showResults && results.length > 0 && (
            <div className="absolute z-30 mt-1 w-full border border-mdt-line-2 bg-mdt-surface shadow-lg max-h-56 overflow-auto mdt-scroll">
              {results.map((c) => (
                <button key={c.id} type="button" onClick={() => selectCivilian(c)} className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left border-b border-mdt-line last:border-b-0 hover:bg-mdt-surface-3">
                  <span className="text-[12.5px] text-mdt-text">{c.last_name}, {c.first_name}</span>
                  <span className="text-[11px] text-mdt-dim">{c.dob ? new Date(c.dob).toLocaleDateString() : "No DOB"} · {c.gender || "Unknown"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-[11px] text-mdt-dim mt-1.5">Selecting a patient imports allergies, medications and history.</p>
      </MSection>

      <MSection title="Demographics">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <MField label="Patient Name *" className="col-span-2"><MInput value={form.patient_name || ""} onChange={(e) => update("patient_name", e.target.value)} placeholder="Last, First" /></MField>
          <MField label="Date of Birth"><MInput type="date" value={form.patient_dob || ""} onChange={(e) => update("patient_dob", e.target.value)} /></MField>
          <MField label="Age"><MInput value={form.patient_age || ""} onChange={(e) => update("patient_age", e.target.value)} placeholder="Auto from DOB" /></MField>
          <MField label="Gender"><MSelect value={form.patient_gender || "Unknown"} onChange={(e) => update("patient_gender", e.target.value)} options={["Male", "Female", "Other", "Unknown"]} /></MField>
          <MField label="Race"><MInput value={form.patient_race || ""} onChange={(e) => update("patient_race", e.target.value)} /></MField>
          <MField label="Blood Type"><MSelect value={form.blood_type || "Unknown"} onChange={(e) => update("blood_type", e.target.value)} options={["Unknown", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]} /></MField>
          <MField label="Phone"><MInput value={form.patient_phone || ""} onChange={(e) => update("patient_phone", e.target.value)} /></MField>
          <MField label="Home Address (Billing)" className="col-span-2 md:col-span-3"><MInput value={form.patient_address || ""} onChange={(e) => update("patient_address", e.target.value)} /></MField>
          <MField label="Incident / Scene Location" className="col-span-2 md:col-span-3"><MInput value={form.incident_location || ""} onChange={(e) => update("incident_location", e.target.value)} placeholder="Where the call occurred" /></MField>
          <MField label="Pickup Location (Billing)" className="col-span-2 md:col-span-3"><MInput value={form.pickup_location || ""} onChange={(e) => update("pickup_location", e.target.value)} placeholder="May differ from scene" /></MField>
        </div>
      </MSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <MSection title="Allergies">
          <MField label="Drug / Environmental"><MChips values={form.allergies || []} onChange={(v) => update("allergies", v)} placeholder="Penicillin, Latex…" /></MField>
          <div className="mt-2"><MField label="Food"><MChips values={form.food_allergies || []} onChange={(v) => update("food_allergies", v)} placeholder="Peanuts, Shellfish…" /></MField></div>
        </MSection>
        <MSection title="Current Medications">
          <MChips values={form.medications || []} onChange={(v) => update("medications", v)} placeholder="Aspirin, Metformin…" />
        </MSection>
        <MSection title="Past Medical History" className="md:col-span-2">
          <MChips values={form.medical_history || []} onChange={(v) => update("medical_history", v)} placeholder="HTN, DM, Asthma…" />
        </MSection>
      </div>
    </div>
  );
}