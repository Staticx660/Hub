import React, { useState } from "react";
import { Panel, Btn, StatusPill } from "@/components/mdt/ui/primitives";
import DataTable from "@/components/mdt/ui/DataTable";
import { Plus } from "lucide-react";

const TABS = ["Pending", "Active", "All"];

export default function CallQueuePane({ calls, selectedId, onSelect, deptName, onNewCall }) {
  const [tab, setTab] = useState("All");
  const rows = tab === "All" ? calls : calls.filter((c) => c.status === tab);

  const columns = [
    { key: "priority", label: "P", width: 42, render: (c) => <span className={`font-mono font-bold ${c.priority?.startsWith("1") ? "text-red-400" : c.priority?.startsWith("2") ? "text-amber-300" : "text-blue-300"}`}>{c.priority?.[0] || "-"}</span> },
    { key: "run_number", label: "Run #", width: 92, mono: true, render: (c) => c.run_number || c.id.slice(-6).toUpperCase() },
    { key: "call_type", label: "Type" },
    { key: "location", label: "Location" },
    { key: "department_id", label: "Agency", width: 130, render: (c) => deptName(c.department_id) },
    { key: "units", label: "U", width: 40, align: "right", sortable: false, render: (c) => (c.assigned_unit_ids || []).length },
    { key: "status", label: "Status", width: 74, render: (c) => <StatusPill tone={c.status === "Pending" ? "warn" : "ok"}>{c.status}</StatusPill> },
  ];

  return (
    <Panel
      title="Call Queue"
      className="min-w-0"
      actions={<Btn variant="primary" icon={Plus} onClick={onNewCall}>New Call</Btn>}
      bodyClassName=""
    >
      <div className="flex items-center gap-0 h-7 px-1.5 border-b border-mdt-line bg-mdt-surface-2 sticky top-0 z-20">
        {TABS.map((t) => {
          const count = t === "All" ? calls.length : calls.filter((c) => c.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-5 px-2 text-[11.5px] font-medium border-b-2 ${tab === t ? "border-mdt-accent text-mdt-text" : "border-transparent text-mdt-dim hover:text-mdt-text"}`}
            >
              {t} <span className="text-mdt-dim">({count})</span>
            </button>
          );
        })}
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        selectedKey={selectedId}
        onRowClick={(c) => onSelect(c.id)}
        rowTone={(c) => (c.priority?.startsWith("1") ? "#ef4444" : c.priority?.startsWith("2") ? "#f59e0b" : "#3b82f6")}
        emptyMessage="Queue clear — no calls"
      />
    </Panel>
  );
}