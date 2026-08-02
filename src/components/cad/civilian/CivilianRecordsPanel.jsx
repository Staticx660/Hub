import React from "react";
import { ConsolePanel, ConsoleEmpty, Tag } from "@/components/cad/console/ConsoleUI";
import ConsoleTable from "@/components/cad/console/ConsoleTable";
import { FileText } from "lucide-react";

export default function CivilianRecordsPanel({ fullName, warrants, bolos, reports }) {
  if (warrants.length === 0 && bolos.length === 0 && reports.length === 0) {
    return (
      <ConsolePanel title={`Records · ${fullName}`}>
        <ConsoleEmpty icon={FileText} title="No records found" hint="Warrants, BOLOs and reports will appear here" />
      </ConsolePanel>
    );
  }

  return (
    <div className="space-y-3">
      {warrants.length > 0 && (
        <ConsolePanel title="Warrants" subtitle={`${warrants.length} on file`}>
          <ConsoleTable
            rows={warrants}
            columns={[
              { key: "reason", label: "Reason" },
              { key: "charges", label: "Charges", render: (w) => w.charges?.join(", ") || "—" },
              { key: "bail_amount", label: "Bail", width: 110, align: "right", render: (w) => (w.bail_amount ? `$${w.bail_amount}` : "—") },
              { key: "status", label: "Status", width: 110, render: (w) => <Tag tone={w.status === "Active" ? "crit" : "neutral"}>{w.status}</Tag> },
            ]}
          />
        </ConsolePanel>
      )}

      {bolos.length > 0 && (
        <ConsolePanel title="BOLOs" subtitle={`${bolos.length} on file`}>
          <ConsoleTable
            rows={bolos}
            columns={[
              { key: "title", label: "Title", width: 240 },
              { key: "description", label: "Description" },
            ]}
          />
        </ConsolePanel>
      )}

      {reports.length > 0 && (
        <ConsolePanel title="Reports" subtitle={`${reports.length} on file`}>
          <ConsoleTable
            rows={reports}
            columns={[
              { key: "title", label: "Title" },
              { key: "report_type", label: "Type", width: 170 },
              { key: "status", label: "Status", width: 110, render: (r) => <Tag tone="info">{r.status}</Tag> },
            ]}
          />
        </ConsolePanel>
      )}
    </div>
  );
}