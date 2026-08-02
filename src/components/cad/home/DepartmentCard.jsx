import React from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight, Users, Siren, Radio, Lock, Flame, Ambulance } from "lucide-react";
import { Tag } from "@/components/cad/console/ConsoleUI";

function DeptIcon({ category, color }) {
  const Icon = category === "Dispatch" ? Radio : category === "Fire" ? Flame : category === "EMS" ? Ambulance : Building2;
  return <Icon className="w-5 h-5" style={{ color }} />;
}

function routeFor(d) {
  if (d.category === "Civilian") return `/cad/civilian/${d.id}`;
  if (["Dispatch", "Fire", "EMS"].includes(d.category)) return `/cad/board/${d.id}`;
  return `/cad/mdt/${d.id}`;
}

export default function DepartmentCard({ dept, unitCount, personnelCount }) {
  const locked = !dept.hasAccess;
  const color = dept.color || "#3b82f6";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[var(--cad-radius)] flex items-center justify-center flex-shrink-0" style={{ background: color + "1f", border: `1px solid ${color}33` }}>
            <DeptIcon category={dept.category} color={color} />
          </div>
          <div className="min-w-0">
            <h3 className={`font-semibold truncate ${locked ? "text-cad-dim" : "text-cad-text"}`}>{dept.name}</h3>
            <span className="text-[11px] uppercase tracking-[0.1em] text-cad-dim">{dept.category === "Dispatch" ? "Dispatch Board" : dept.category}</span>
          </div>
        </div>
        {locked ? <Lock className="w-4 h-4 text-cad-dim flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-cad-dim group-hover:text-cad-accent transition-colors flex-shrink-0" />}
      </div>

      {dept.description && <p className="text-[12.5px] text-cad-muted mb-3 line-clamp-2">{dept.description}</p>}

      {locked ? (
        <Tag tone="warn"><Lock className="w-3 h-3" /> Requires Discord role</Tag>
      ) : (
        <div className="flex items-center gap-4 text-[12.5px] text-cad-muted">
          <span className="flex items-center gap-1.5"><Siren className="w-3.5 h-3.5" /> {unitCount} units</span>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {personnelCount} personnel</span>
        </div>
      )}
    </>
  );

  const base = "cad-glass border border-cad-border/60 rounded-[var(--cad-radius)] p-4 block";
  return locked ? (
    <div className={`${base} opacity-60`}>{body}</div>
  ) : (
    <Link to={routeFor(dept)} className={`group ${base} cad-card-hover`}>{body}</Link>
  );
}