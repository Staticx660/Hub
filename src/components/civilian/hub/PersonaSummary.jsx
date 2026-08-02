import React from "react";
import { Pencil, MonitorPlay, AlertTriangle, IdCard } from "lucide-react";
import { Btn, Field, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";

const TONE = { Valid: "ok", Suspended: "warn", Revoked: "crit", None: "neutral" };

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

export default function PersonaSummary({ character, warrants, onEdit, onOpenTerminal }) {
  if (!character) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <EmptyState icon={IdCard} title="No identity selected" hint="Pick an identity on the left or create a new one" />
      </div>
    );
  }

  const fullName = `${character.first_name} ${character.middle_name ? character.middle_name + " " : ""}${character.last_name}`;
  const licenses = [
    { label: "Driver", status: character.drivers_license_status },
    { label: "Weapons", status: character.weapon_license_status },
    { label: "Pilot", status: character.pilot_license_status },
    { label: "Hunting", status: character.hunting_license_status },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-auto mdt-scroll">
      <div className="flex items-center gap-3 h-12 px-3 border-b border-mdt-line bg-mdt-surface-2">
        <span className="text-[14px] font-semibold truncate">{fullName}</span>
        {warrants.length > 0 && <StatusPill tone="crit">{warrants.length} Active Warrant{warrants.length > 1 ? "s" : ""}</StatusPill>}
        <div className="ml-auto flex items-center gap-1.5">
          <Btn icon={Pencil} onClick={onEdit}>Edit</Btn>
          <Btn variant="primary" icon={MonitorPlay} onClick={onOpenTerminal}>Open Civilian Terminal</Btn>
        </div>
      </div>

      <div className="p-2.5 space-y-2.5">
        <div className="flex items-center gap-3 border border-mdt-line bg-mdt-surface p-2.5">
          {character.photo_url ? (
            <img src={character.photo_url} alt="" className="w-14 h-14 object-cover border border-mdt-line-2" />
          ) : (
            <div className="w-14 h-14 border border-mdt-line-2 bg-mdt-surface-3 flex items-center justify-center text-[17px] font-bold text-mdt-dim">
              {character.first_name?.[0]}{character.last_name?.[0]}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[11.5px] font-mono text-mdt-dim">{character.dob} · {character.gender} · {character.phone || "no phone"}</div>
            <div className="text-[12.5px] text-mdt-text truncate">{character.occupation || "No occupation"}</div>
            <div className="text-[11.5px] text-mdt-muted truncate">{character.address || "No address on file"}</div>
          </div>
          <div className="ml-auto flex flex-wrap gap-1 justify-end">
            {licenses.map((l) => <StatusPill key={l.label} tone={TONE[l.status] || "neutral"}>{l.label}: {l.status || "None"}</StatusPill>)}
          </div>
        </div>

        <Block title="Description">
          <Field label="Height" value={character.height} />
          <Field label="Weight" value={character.weight} />
          <Field label="Hair" value={character.hair_color} />
          <Field label="Eyes" value={character.eye_color} />
          <Field label="Race" value={character.race} />
          <Field label="Zip" value={character.zip_code} />
        </Block>

        <Block title="Medical" cols={2}>
          <Field label="Allergies" value={(character.allergies || []).join(", ")} />
          <Field label="Medications" value={(character.medications || []).join(", ")} />
          <Field label="History" value={(character.medical_history || []).join(", ")} />
          <Field label="Emergency Contact" value={character.emergency_contact_name ? `${character.emergency_contact_name} · ${character.emergency_contact_phone || "—"}` : ""} />
        </Block>

        <section className="border border-mdt-line bg-mdt-surface">
          <header className="h-7 px-2.5 flex items-center gap-1.5 border-b border-mdt-line bg-mdt-surface-2">
            <AlertTriangle className={`w-3 h-3 ${warrants.length ? "text-red-400" : "text-mdt-dim"}`} />
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">Active Warrants</h3>
            <span className="ml-auto text-[10px] font-mono text-mdt-dim">{warrants.length}</span>
          </header>
          {warrants.length === 0 ? (
            <p className="p-2.5 text-[12px] text-mdt-dim">No active warrants on file.</p>
          ) : (
            <table className="w-full border-collapse text-[12px]">
              <tbody>
                {warrants.map((w) => (
                  <tr key={w.id} className="border-b border-mdt-line/60">
                    <td className="px-2 h-7 text-mdt-text truncate">{w.reason}</td>
                    <td className="px-2 h-7 text-mdt-muted truncate">{(w.charges || []).join(", ") || "—"}</td>
                    <td className="px-2 h-7 font-mono text-right text-amber-300 w-[90px]">{w.bail_amount ? `$${w.bail_amount}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}