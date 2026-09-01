import React from "react";
import { Field, StatusPill } from "@/components/mdt/ui/primitives";

const LICENSE_TONE = { Valid: "ok", Suspended: "warn", Revoked: "crit", None: "neutral" };

function Block({ title, children, cols = 3 }) {
  return (
    <section className="border border-mdt-line bg-mdt-surface">
      <header className="h-7 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">{title}</h3>
      </header>
      <div className={`p-2.5 grid gap-2.5 ${cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}>{children}</div>
    </section>
  );
}

/** Identity readout for the selected persona — dense, no cards, no dead space. */
export default function IdentityPane({ character, fullName }) {
  const licenses = [
    { label: "Driver", status: character.drivers_license_status, extra: character.drivers_license_types },
    { label: "Weapons", status: character.weapon_license_status, extra: character.weapon_license_types },
    { label: "Pilot", status: character.pilot_license_status, extra: character.pilot_license_endorsements },
    { label: "Hunting / Fish", status: character.hunting_license_status, extra: [...(character.hunting_license_types || []), ...(character.hunting_license_stamps || [])] },
  ];

  return (
    <div className="p-2.5 space-y-2.5">
      <div className="flex items-center gap-3 border border-mdt-line bg-mdt-surface-2 p-2.5">
        {character.photo_url ? (
          <img src={character.photo_url} alt={fullName} className="w-14 h-14 object-cover border border-mdt-line-2" />
        ) : (
          <div className="w-14 h-14 border border-mdt-line-2 bg-mdt-surface-3 flex items-center justify-center text-[18px] font-bold text-mdt-dim">
            {character.first_name?.[0]}{character.last_name?.[0]}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-mdt-text truncate">{fullName}</div>
          <div className="text-[11.5px] font-mono text-mdt-dim">{character.dob} · {character.gender} · {character.phone || "no phone"}</div>
        </div>
        <div className="ml-auto flex flex-wrap gap-1 justify-end">
          {licenses.map((l) => (
            <StatusPill key={l.label} tone={LICENSE_TONE[l.status] || "neutral"}>{l.label}: {l.status || "None"}</StatusPill>
          ))}
        </div>
      </div>

      <Block title="Physical Description">
        <Field label="Height" value={character.height} />
        <Field label="Weight" value={character.weight} />
        <Field label="Hair" value={character.hair_color} />
        <Field label="Eyes" value={character.eye_color} />
        <Field label="Race" value={character.race} />
        <Field label="Skin Tone" value={character.skin_tone} />
      </Block>

      <Block title="Residence & Contact">
        <Field label="Address" value={character.address} />
        <Field label="Zip" value={character.zip_code} />
        <Field label="Phone" value={character.phone} />
        <Field label="Occupation" value={character.occupation} />
        <Field label="Emergency Contact" value={character.emergency_contact_name} />
        <Field label="Contact Phone" value={character.emergency_contact_phone} />
        <Field label="Relationship" value={character.emergency_contact_relationship} />
      </Block>

      <Block title="Medical" cols={2}>
        <Field label="Allergies" value={(character.allergies || []).join(", ")} />
        <Field label="Food Allergies" value={(character.food_allergies || []).join(", ")} />
        <Field label="Medications" value={(character.medications || []).join(", ")} />
        <Field label="History" value={(character.medical_history || []).join(", ")} />
      </Block>

      <Block title="Licensing" cols={2}>
        {licenses.map((l) => (
          <Field key={l.label} label={l.label} value={`${l.status || "None"}${(l.extra || []).length ? ` — ${(l.extra || []).join(", ")}` : ""}`} />
        ))}
        <Field label="DL Number" value={character.drivers_license_number} />
      </Block>

      {character.notes && (
        <div className="border border-mdt-line bg-mdt-surface p-2.5">
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mdt-dim mb-1">Notes</div>
          <p className="text-[12.5px] text-mdt-text whitespace-pre-wrap">{character.notes}</p>
        </div>
      )}
    </div>
  );
}