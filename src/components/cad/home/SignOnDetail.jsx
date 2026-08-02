import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock, LogIn, MessageCircle, Globe, MonitorPlay } from "lucide-react";
import { Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";

const terminalRoute = (d) =>
  d.category === "Fire" ? `/cad/fire/${d.id}`
  : d.category === "EMS" ? `/cad/ems/${d.id}`
  : d.category === "Civilian" ? `/cad/civilian/${d.id}`
  : d.category === "Dispatch" ? `/cad/dispatch`
  : `/cad/mdt/${d.id}`;

const TERMINAL_LABEL = {
  Police: "Patrol MDT — calls, lookups, records",
  Fire: "Fire Operations Board — apparatus & incidents",
  EMS: "EMS Operations Board — apparatus & patient care",
  Dispatch: "Dispatch Workstation — queue, incidents, units",
  Civilian: "Civilian Device — identity, DMV, 911",
};

function Readout({ label, value, tone }) {
  return (
    <div className="border border-mdt-line bg-mdt-surface px-2.5 py-2">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mdt-dim">{label}</div>
      <div className={`text-[19px] font-bold leading-tight ${tone || "text-mdt-text"}`}>{value}</div>
    </div>
  );
}

export default function SignOnDetail({ dept, units, personnel, calls, community }) {
  const navigate = useNavigate();

  if (!dept) {
    return (
      <div className="flex-1 min-w-0 bg-mdt-bg flex items-center justify-center">
        <EmptyState icon={MonitorPlay} title="Select a terminal to board" hint="Your assigned services are listed on the left" />
      </div>
    );
  }

  const locked = dept.hasAccess === false;
  const deptUnits = units.filter((u) => u.department_id === dept.id);
  const deptCalls = calls.filter((c) => c.department_id === dept.id && c.status !== "Closed");
  const deptPersonnel = personnel.filter((p) => p.department_id === dept.id || (p.additional_department_ids || []).includes(dept.id));
  const available = deptUnits.filter((u) => u.status === "Available").length;

  return (
    <div className="flex-1 min-w-0 bg-mdt-bg overflow-auto mdt-scroll">
      <div className="flex items-center gap-2.5 px-3 h-12 border-b border-mdt-line bg-mdt-surface-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: dept.color || "#14b8a6" }} />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-mdt-text truncate leading-tight">{dept.name}</div>
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-mdt-dim">{dept.category}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {locked ? <StatusPill tone="crit">Access Locked</StatusPill> : <StatusPill tone="ok">Cleared</StatusPill>}
        </div>
      </div>

      <div className="p-3 space-y-3 max-w-3xl">
        <div className="border border-mdt-line bg-mdt-surface">
          <div className="px-2.5 py-2 border-b border-mdt-line text-[11.5px] text-mdt-muted">
            {TERMINAL_LABEL[dept.category] || "Department terminal"}
          </div>
          <div className="p-2.5 flex items-center gap-2">
            {locked ? (
              <div className="flex items-center gap-2 text-[12px] text-mdt-dim">
                <Lock className="w-3.5 h-3.5" /> You need the Discord role or an admin assignment to board this terminal.
              </div>
            ) : (
              <Btn variant="primary" icon={LogIn} onClick={() => navigate(terminalRoute(dept))}>Board Terminal</Btn>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Readout label="Open Calls" value={deptCalls.length} tone={deptCalls.length ? "text-amber-300" : undefined} />
          <Readout label="Units" value={`${available}/${deptUnits.length}`} tone={available ? "text-emerald-300" : "text-red-300"} />
          <Readout label="Personnel" value={deptPersonnel.length} />
          <Readout label="Priority 1" value={deptCalls.filter((c) => c.priority?.startsWith("1")).length} tone="text-red-300" />
        </div>

        {dept.description && (
          <div className="border border-mdt-line bg-mdt-surface p-2.5 text-[12.5px] text-mdt-muted whitespace-pre-wrap">{dept.description}</div>
        )}

        {community && (community.discord_invite_url || community.website_url) && (
          <div className="flex items-center gap-2">
            {community.discord_invite_url && (
              <a href={community.discord_invite_url} target="_blank" rel="noopener noreferrer"><Btn icon={MessageCircle}>Discord</Btn></a>
            )}
            {community.website_url && (
              <a href={community.website_url} target="_blank" rel="noopener noreferrer"><Btn icon={Globe}>Website</Btn></a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}