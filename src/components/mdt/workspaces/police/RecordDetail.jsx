import React from "react";
import { Panel, Field, StatusPill, Btn } from "@/components/mdt/ui/primitives";
import { Link2, Gavel, Eye, FileText } from "lucide-react";

/** Detail pane for a selected record (report, warrant, BOLO, or closed call). */
export default function RecordDetail({ record, onEdit, onDelete }) {
  const isClosedCall = record.call_type !== undefined;
  const fd = record.field_data || {};
  const flags = fd.flags || {};

  return (
    <div className="p-2 h-full overflow-auto mdt-scroll flex flex-col gap-2">
      <Panel
        title={isClosedCall ? "Closed Call" : record.report_type || (record.bolo_type ? "BOLO" : record.reason ? "Warrant" : "Record")}
        actions={record.status ? <StatusPill tone={record.status === "Draft" ? "warn" : record.status === "Active" ? "crit" : record.status === "Closed" ? "neutral" : "ok"}>{record.status}</StatusPill> : null}
        scroll={false}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 p-3">
          <Field label="Title" value={record.title || record.call_type || record.reason || record.person_name} />
          <Field label="Run #" value={record.run_number} />
          <Field label="Location" value={record.location} />
          <Field label="Filed / Issued By" value={record.filed_by_name || record.issued_by_name} />
          <Field label="Date" value={record.created_date ? new Date(record.created_date).toLocaleString() : ""} />
          {isClosedCall && <Field label="Priority" value={record.priority} />}
          {record.linked_civilian_name && <Field label="Linked Civilian" value={record.linked_civilian_name} />}
          {record.linked_vehicle_plate && <Field label="Linked Vehicle" value={record.linked_vehicle_plate} />}
          {record.bail_amount ? <Field label="Bail" value={`$${record.bail_amount}`} /> : null}
        </div>
        {(record.description || record.notes) && (
          <p className="mx-3 mb-3 border border-mdt-line bg-mdt-surface-2 px-3 py-2 text-[12.5px] text-mdt-text whitespace-pre-wrap">{record.description || record.notes}</p>
        )}
        {record.cad_notes && (
          <div className="mx-3 mb-3">
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim mb-1">CAD Notes</div>
            <p className="border border-mdt-line bg-mdt-surface-2 px-3 py-2 text-[12.5px] text-mdt-text whitespace-pre-wrap">{record.cad_notes}</p>
          </div>
        )}
        {(flags.armed || flags.violent || flags.mentally_ill) && (
          <div className="flex gap-1 px-3 pb-3">
            {flags.armed && <StatusPill tone="crit">Armed</StatusPill>}
            {flags.violent && <StatusPill tone="crit">Violent</StatusPill>}
            {flags.mentally_ill && <StatusPill tone="crit">Mentally Ill</StatusPill>}
          </div>
        )}
        {record.title && (
          <div className="flex gap-2 px-3 pb-3">
            <Btn onClick={() => onEdit(record)}>Edit Report</Btn>
            <Btn variant="danger" onClick={() => onDelete(record.id)}>Delete Report</Btn>
          </div>
        )}
      </Panel>

      {record.charges?.length > 0 && (
        <Panel title="Charges" scroll={false}>
          {record.charges.map((c, i) => <div key={i} className="px-3 py-1.5 border-b border-mdt-line last:border-b-0 text-[12.5px] text-mdt-text">{c}</div>)}
        </Panel>
      )}

      {fd.charges?.length > 0 && (
        <Panel title="Charges" scroll={false}>
          {fd.charges.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-1.5 border-b border-mdt-line last:border-b-0">
              <span className="text-[12.5px] text-mdt-text flex-1">{c.charge}</span>
              {c.charge_type && <span className="text-[11.5px] text-mdt-muted">{c.charge_type}</span>}
              {c.bond_amount > 0 && <span className="text-[11.5px] text-amber-300">${c.bond_amount}</span>}
            </div>
          ))}
        </Panel>
      )}

      {fd.civilian && (
        <Panel title="Civilian Details" scroll={false}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 p-3">
            <Field label="Name" value={[fd.civilian.first_name, fd.civilian.last_name].filter(Boolean).join(" ")} />
            <Field label="DOB" value={fd.civilian.dob} />
            <Field label="Phone" value={fd.civilian.phone} />
            <Field label="Address" value={fd.civilian.address} />
          </div>
        </Panel>
      )}

      {fd.linked_records?.length > 0 && (
        <Panel title="Linked Records" scroll={false}>
          {fd.linked_records.map((rec, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 border-b border-mdt-line last:border-b-0">
              {rec.type === "warrant" ? <Gavel className="w-3.5 h-3.5 text-red-300" /> : rec.type === "bolo" ? <Eye className="w-3.5 h-3.5 text-amber-300" /> : <FileText className="w-3.5 h-3.5 text-blue-300" />}
              <span className="text-[12.5px] text-mdt-text flex-1 truncate">{rec.title}</span>
              <span className="text-[11.5px] text-mdt-muted">{rec.type}{rec.number ? ` · ${rec.number}` : ""}</span>
            </div>
          ))}
        </Panel>
      )}

      {record.assignment_log?.length > 0 && (
        <Panel title="Call Log" scroll={false}>
          {record.assignment_log.map((entry, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-1.5 border-b border-mdt-line last:border-b-0">
              <span className="text-[11.5px] text-mdt-dim font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
              <span className="text-[12.5px] text-mdt-text">{entry.unit_name}</span>
              <span className="text-[12.5px] text-mdt-muted">{entry.action === "note" ? entry.message : entry.action}</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}