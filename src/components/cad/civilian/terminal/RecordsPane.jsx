import React from "react";
import { StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import DataTable from "@/components/mdt/ui/DataTable";
import { ShieldAlert } from "lucide-react";

function Section({ title, count, children }) {
  return (
    <section className="border border-mdt-line bg-mdt-surface">
      <header className="h-7 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">{title}</h3>
        <span className="ml-auto text-[10px] text-mdt-dim">{count}</span>
      </header>
      {children}
    </section>
  );
}

/** What the state has on file for this persona. */
export default function RecordsPane({ fullName, warrants, bolos, reports }) {
  const total = warrants.length + bolos.length + reports.length;

  return (
    <div className="p-2.5 space-y-2.5">
      <div className="flex items-center gap-2 border border-mdt-line bg-mdt-surface-2 px-2.5 h-9">
        <ShieldAlert className={`w-3.5 h-3.5 ${warrants.some(w => w.status === "Active") ? "text-red-400" : "text-mdt-dim"}`} />
        <span className="text-[12.5px] text-mdt-text truncate">{fullName}</span>
        <span className="ml-auto">
          {warrants.some(w => w.status === "Active")
            ? <StatusPill tone="crit">Active Warrant</StatusPill>
            : <StatusPill tone="ok">No Active Warrants</StatusPill>}
        </span>
      </div>

      {total === 0 && <EmptyState icon={ShieldAlert} title="Nothing on file" hint="No warrants, BOLOs, or reports linked to this persona" />}

      {warrants.length > 0 && (
        <Section title="Warrants" count={warrants.length}>
          <DataTable
            columns={[
              { key: "reason", label: "Reason" },
              { key: "charges", label: "Charges", render: (w) => (w.charges || []).join(", ") || "—" },
              { key: "bail_amount", label: "Bail", width: 90, align: "right", mono: true, render: (w) => (w.bail_amount ? `$${w.bail_amount}` : "—") },
              { key: "status", label: "Status", width: 84, render: (w) => <StatusPill tone={w.status === "Active" ? "crit" : "neutral"}>{w.status}</StatusPill> },
            ]}
            rows={warrants}
          />
        </Section>
      )}

      {bolos.length > 0 && (
        <Section title="BOLOs" count={bolos.length}>
          <DataTable
            columns={[
              { key: "title", label: "Title", render: (b) => b.title || b.bolo_type || "BOLO" },
              { key: "description", label: "Description" },
              { key: "status", label: "Status", width: 84, render: (b) => <StatusPill tone={b.status === "Active" ? "warn" : "neutral"}>{b.status || "—"}</StatusPill> },
            ]}
            rows={bolos}
          />
        </Section>
      )}

      {reports.length > 0 && (
        <Section title="Reports" count={reports.length}>
          <DataTable
            columns={[
              { key: "title", label: "Title" },
              { key: "report_type", label: "Type", width: 150 },
              { key: "filed_by_name", label: "Filed By", width: 150, render: (r) => r.filed_by_name || "—" },
              { key: "created_date", label: "Date", width: 110, mono: true, render: (r) => new Date(r.created_date).toLocaleDateString() },
            ]}
            rows={reports}
          />
        </Section>
      )}
    </div>
  );
}