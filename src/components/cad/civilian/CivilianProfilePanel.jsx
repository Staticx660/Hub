import React from "react";
import { ConsolePanel, ConsoleField } from "@/components/cad/console/ConsoleUI";

function calculateAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : "";
}

export default function CivilianProfilePanel({ character, fullName }) {
  const c = character;
  const hasMedical = c.allergies?.length || c.medications?.length || c.medical_history?.length || c.food_allergies?.length;

  return (
    <div className="space-y-3">
      <ConsolePanel title="Identity" scroll={false}>
        <div className="p-3 flex items-start gap-4">
          <div className="w-24 h-24 rounded-[var(--cad-radius)] bg-cad-surface-2 border border-cad-border overflow-hidden flex items-center justify-center flex-shrink-0">
            {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-cad-dim">{c.first_name?.[0] || "?"}</span>}
          </div>
          <div className="min-w-0 space-y-2">
            <div>
              <h2 className="text-xl font-bold text-cad-text truncate">{fullName}</h2>
              <p className="text-[13px] text-cad-muted">{calculateAge(c.dob)} years old · {c.gender}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ConsoleField label="Occupation" value={c.occupation} />
              <ConsoleField label="Phone" value={c.phone} />
              <ConsoleField label="Address" value={c.address ? `${c.address}${c.zip_code ? ` ${c.zip_code}` : ""}` : ""} />
            </div>
          </div>
        </div>
      </ConsolePanel>

      <ConsolePanel title="Physical Description" scroll={false}>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ConsoleField label="Hair" value={c.hair_color} />
          <ConsoleField label="Eyes" value={c.eye_color} />
          <ConsoleField label="Height" value={c.height} />
          <ConsoleField label="Weight" value={c.weight} />
          <ConsoleField label="Race" value={c.race} />
          <ConsoleField label="Skin Tone" value={c.skin_tone} />
          <ConsoleField label="DOB" value={c.dob} />
          <ConsoleField label="Zip" value={c.zip_code} />
        </div>
      </ConsolePanel>

      {hasMedical && (
        <ConsolePanel title="Medical" scroll={false}>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ConsoleField label="Allergies" value={c.allergies?.join(", ")} />
            <ConsoleField label="Medications" value={c.medications?.join(", ")} />
            <ConsoleField label="History" value={c.medical_history?.join(", ")} />
            <ConsoleField label="Food Allergies" value={c.food_allergies?.join(", ")} />
          </div>
        </ConsolePanel>
      )}

      {(c.emergency_contact_name || c.emergency_contact_phone) && (
        <ConsolePanel title="Emergency Contact" scroll={false}>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ConsoleField label="Name" value={c.emergency_contact_name} />
            <ConsoleField label="Relationship" value={c.emergency_contact_relationship} />
            <ConsoleField label="Phone" value={c.emergency_contact_phone} />
          </div>
        </ConsolePanel>
      )}
    </div>
  );
}