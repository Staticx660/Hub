import React from "react";
import { Panel, Field, StatusPill, Btn } from "@/components/mdt/ui/primitives";
import { Gavel, Eye, Car, Crosshair, FileText } from "lucide-react";

const LICENSE_FIELDS = [
  { field: "drivers_license_status", label: "Driver's License" },
  { field: "weapon_license_status", label: "Weapon License" },
  { field: "pilot_license_status", label: "Pilot License" },
  { field: "hunting_license_status", label: "DCNR / Fish & Game" },
];
const LIC_TONE = { Valid: "ok", Suspended: "crit", Revoked: "crit", None: "neutral" };

function Row({ children }) {
  return <div className="border-b border-mdt-line px-3 py-2 last:border-b-0">{children}</div>;
}
function Chips({ label, items, tone = "info" }) {
  if (!items?.length) return null;
  return (
    <div className="flex items-start gap-2 px-3 py-1.5">
      <span className="w-[150px] flex-shrink-0 text-[12.5px] text-mdt-muted">{label}:</span>
      <div className="flex flex-wrap gap-1">{items.map((t) => <StatusPill key={t} tone={tone}>{t}</StatusPill>)}</div>
    </div>
  );
}

/** Detail pane for a selected lookup record (person / vehicle / firearm). */
export default function LookupDetail({ selected, warrants, bolos, vehicles, firearms, reports, vehiclePriors, onSetLicense, onSuspendAll, onLookupOwner }) {
  const { type, data } = selected;

  if (type === "person") {
    return (
      <div className="flex flex-col gap-2 p-2 overflow-auto mdt-scroll h-full">
        <Panel title="Subject" scroll={false}>
          <div className="flex gap-3 p-3">
            {data.photo_url && <img src={data.photo_url} alt="" className="w-16 h-20 object-cover border border-mdt-line" />}
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 flex-1">
              <Field label="Name" value={`${data.first_name} ${data.middle_name || ""} ${data.last_name}`.replace(/\s+/g, " ")} />
              <Field label="DOB" value={data.dob} />
              <Field label="Gender" value={data.gender} />
              <Field label="Race" value={data.race} />
              <Field label="Height / Weight" value={[data.height, data.weight].filter(Boolean).join(" · ")} />
              <Field label="Hair / Eyes" value={[data.hair_color, data.eye_color].filter(Boolean).join(" · ")} />
              <Field label="Address" value={[data.address, data.zip_code].filter(Boolean).join(", ")} />
              <Field label="Phone" value={data.phone} />
              <Field label="Occupation" value={data.occupation} />
            </div>
          </div>
        </Panel>

        <Panel title="Licenses" actions={<Btn variant="danger" onClick={onSuspendAll}>Suspend All</Btn>} scroll={false}>
          {LICENSE_FIELDS.map((l) => (
            <Row key={l.field}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12.5px] text-mdt-text">{l.label}</span>
                <div className="flex items-center gap-2">
                  <StatusPill tone={LIC_TONE[data[l.field]] || "neutral"}>{data[l.field] || "None"}</StatusPill>
                  {data[l.field] === "Valid"
                    ? <Btn variant="danger" onClick={() => onSetLicense(l.field, "Suspended")}>Suspend</Btn>
                    : <span className="text-[11px] text-mdt-dim">view only</span>}
                </div>
              </div>
            </Row>
          ))}
          <Chips label="DL Types" items={data.drivers_license_types} />
          <Chips label="Pilot Endorsements" items={data.pilot_license_endorsements} />
          <Chips label="Weapon Types" items={data.weapon_license_types} />
          <Chips label="DCNR Types" items={data.hunting_license_types} tone="ok" />
          <Chips label="DCNR Stamps" items={data.hunting_license_stamps} tone="ok" />
        </Panel>

        {warrants.length > 0 && (
          <Panel title={`Active Warrants (${warrants.length})`} scroll={false}>
            {warrants.map((w) => (
              <Row key={w.id}>
                <div className="flex items-center gap-2 mb-0.5"><Gavel className="w-3.5 h-3.5 text-red-300" /><span className="text-[12.5px] text-mdt-text">{w.reason}</span></div>
                {w.charges?.length > 0 && <p className="text-[11.5px] text-mdt-muted">Charges: {w.charges.join(", ")}</p>}
                {w.bail_amount ? <p className="text-[11.5px] text-amber-300">Bail: ${w.bail_amount}</p> : null}
              </Row>
            ))}
          </Panel>
        )}

        {bolos.length > 0 && (
          <Panel title={`BOLOs (${bolos.length})`} scroll={false}>
            {bolos.map((b) => (
              <Row key={b.id}>
                <div className="flex items-center gap-2 mb-0.5"><Eye className="w-3.5 h-3.5 text-amber-300" /><span className="text-[12.5px] text-mdt-text">{b.title}</span></div>
                <p className="text-[11.5px] text-mdt-muted">{b.description}</p>
                {b.last_seen_location && <p className="text-[11.5px] text-mdt-dim">Last seen: {b.last_seen_location}</p>}
              </Row>
            ))}
          </Panel>
        )}

        {vehicles.length > 0 && (
          <Panel title={`Registered Vehicles (${vehicles.length})`} scroll={false}>
            {vehicles.map((v) => (
              <Row key={v.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] text-mdt-text"><Car className="w-3.5 h-3.5 inline mr-1.5 text-mdt-dim" /><span className="font-mono">{v.plate}</span> · {v.model} · {v.color}</span>
                  <div className="flex gap-1">
                    {v.is_stolen && <StatusPill tone="crit">Stolen</StatusPill>}
                    <StatusPill tone={v.registration_status === "Valid" ? "ok" : "crit"}>Reg {v.registration_status}</StatusPill>
                  </div>
                </div>
              </Row>
            ))}
          </Panel>
        )}

        {firearms.length > 0 && (
          <Panel title={`Registered Firearms (${firearms.length})`} scroll={false}>
            {firearms.map((f) => (
              <Row key={f.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] text-mdt-text"><Crosshair className="w-3.5 h-3.5 inline mr-1.5 text-mdt-dim" /><span className="font-mono">{f.serial_number}</span> · {f.model} · {f.caliber}</span>
                  <div className="flex gap-1">
                    <StatusPill tone={f.is_registered ? "ok" : "crit"}>{f.is_registered ? "Registered" : "Unregistered"}</StatusPill>
                    {f.is_stolen && <StatusPill tone="crit">Stolen</StatusPill>}
                  </div>
                </div>
              </Row>
            ))}
          </Panel>
        )}

        {reports.length > 0 && (
          <Panel title={`Report History (${reports.length})`} scroll={false}>
            {reports.map((r) => (
              <Row key={r.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] text-mdt-text"><FileText className="w-3.5 h-3.5 inline mr-1.5 text-mdt-dim" />{r.title}</span>
                  <StatusPill tone={r.status === "Filed" ? "ok" : "warn"}>{r.status}</StatusPill>
                </div>
                <p className="text-[11.5px] text-mdt-muted">{r.report_type} · {r.run_number || "no run #"}</p>
              </Row>
            ))}
          </Panel>
        )}

        {(data.allergies?.length > 0 || data.medications?.length > 0 || data.medical_history?.length > 0) && (
          <Panel title="Medical Information" scroll={false}>
            <Chips label="Allergies" items={data.allergies} tone="warn" />
            <Chips label="Medications" items={data.medications} />
            <Chips label="History" items={data.medical_history} />
          </Panel>
        )}

        {data.notes && (
          <Panel title="Notes" scroll={false}>
            <p className="px-3 py-2 text-[12.5px] text-mdt-text whitespace-pre-wrap">{data.notes}</p>
          </Panel>
        )}
      </div>
    );
  }

  if (type === "vehicle") {
    return (
      <div className="flex flex-col gap-2 p-2 overflow-auto mdt-scroll h-full">
        <Panel title="Vehicle" scroll={false}>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 p-3">
            <Field label="Plate" value={data.plate} />
            <Field label="Vehicle" value={[data.year, data.make, data.model].filter(Boolean).join(" ")} />
            <Field label="Color / Type" value={[data.color, data.type].filter(Boolean).join(" · ")} />
            <div>
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">Owner</div>
              <button onClick={() => onLookupOwner(data.owner_name)} className="text-[12.5px] text-mdt-accent hover:underline">{data.owner_name || "Unknown"}</button>
            </div>
            <Field label="Registration" value={data.registration_status} />
            <Field label="Insurance" value={data.insurance_status} />
          </div>
          <div className="flex gap-1 px-3 pb-3">
            {data.is_stolen && <StatusPill tone="crit">Reported Stolen</StatusPill>}
            <StatusPill tone={data.registration_status === "Valid" ? "ok" : "crit"}>Reg {data.registration_status}</StatusPill>
            <StatusPill tone={data.insurance_status === "Valid" ? "ok" : "crit"}>Ins {data.insurance_status}</StatusPill>
          </div>
          {data.notes && <p className="px-3 pb-3 text-[12.5px] text-mdt-muted whitespace-pre-wrap">{data.notes}</p>}
        </Panel>

        {vehiclePriors.bolos.length > 0 && (
          <Panel title={`BOLOs (${vehiclePriors.bolos.length})`} scroll={false}>
            {vehiclePriors.bolos.map((b) => (
              <Row key={b.id}>
                <div className="flex items-center gap-2 mb-0.5"><Eye className="w-3.5 h-3.5 text-amber-300" /><span className="text-[12.5px] text-mdt-text">{b.title}</span></div>
                <p className="text-[11.5px] text-mdt-muted">{b.description}</p>
              </Row>
            ))}
          </Panel>
        )}

        {vehiclePriors.reports.length > 0 && (
          <Panel title={`Report Priors (${vehiclePriors.reports.length})`} scroll={false}>
            {vehiclePriors.reports.map((r) => (
              <Row key={r.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] text-mdt-text">{r.title}</span>
                  <StatusPill tone={r.status === "Filed" ? "ok" : "warn"}>{r.status}</StatusPill>
                </div>
                <p className="text-[11.5px] text-mdt-muted">{r.report_type} · {r.run_number || "no run #"}</p>
              </Row>
            ))}
          </Panel>
        )}
      </div>
    );
  }

  return (
    <div className="p-2 h-full overflow-auto mdt-scroll">
      <Panel title="Firearm" scroll={false}>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 p-3">
          <Field label="Serial" value={data.serial_number} />
          <Field label="Model" value={data.model} />
          <Field label="Caliber" value={data.caliber} />
          <Field label="Manufacturer" value={data.manufacturer} />
          <Field label="Owner" value={data.owner_name} />
          <Field label="Registered" value={data.is_registered ? "Yes" : "No"} />
        </div>
        <div className="flex gap-1 px-3 pb-3">
          <StatusPill tone={data.is_registered ? "ok" : "crit"}>{data.is_registered ? "Registered" : "Unregistered"}</StatusPill>
          {data.is_stolen && <StatusPill tone="crit">Stolen</StatusPill>}
        </div>
        {data.notes && <p className="px-3 pb-3 text-[12.5px] text-mdt-muted whitespace-pre-wrap">{data.notes}</p>}
      </Panel>
    </div>
  );
}