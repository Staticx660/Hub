import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useToast } from "@/components/ui/use-toast";
import DataTable from "@/components/mdt/ui/DataTable";
import { Panel, StatusPill, Btn, EmptyState } from "@/components/mdt/ui/primitives";
import { Truck, Plus, Trash2, Loader2, Users } from "lucide-react";

const INPUT = "h-7 px-2 bg-mdt-surface border border-mdt-line-2 text-[12.5px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const TONE = { Available: "ok", Busy: "warn", "On Call": "info", Unavailable: "neutral", "Off Duty": "neutral", Panic: "crit" };

/** Apparatus / crew board for Fire & EMS operations. */
export default function ApparatusWorkspace({ department, session }) {
  const { isPlatformAdmin, isCADAdmin, isSupervisor } = useUserPermissions();
  const canManage = isPlatformAdmin || isCADAdmin || isSupervisor;
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState("");

  const isFireEMS = department?.category === "Fire" || department?.category === "EMS";
  const label = isFireEMS ? "Apparatus" : "Group";

  const load = async () => {
    try {
      const [g, s] = await Promise.all([
        base44.entities.CADUnitGroup.filter({ department_id: department.id }),
        base44.entities.CADSession.filter({ department_id: department.id, is_active: true }),
      ]);
      setGroups(g);
      setSessions(s);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => {
    let timer;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(load, 600); };
    load();
    const u1 = base44.entities.CADUnitGroup.subscribe(debounced);
    const u2 = base44.entities.CADSession.subscribe(debounced);
    return () => { u1(); u2(); clearTimeout(timer); };
  }, []);

  const crewOf = (g) => sessions.filter((s) => s.group_id === g.id || g.unit_ids?.includes(s.id));

  const create = async () => {
    if (!newName.trim()) return;
    try {
      await base44.entities.CADUnitGroup.create({
        name: newName.trim(),
        department_id: department.id,
        unit_ids: isFireEMS ? [] : session?.id ? [session.id] : [],
      });
      setNewName("");
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const disband = async (id) => {
    if (!confirm(`Disband this ${label.toLowerCase()}?`)) return;
    try {
      await base44.entities.CADUnitGroup.delete(id);
      if (selectedId === id) setSelectedId(null);
      load();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const columns = [
    { key: "name", label: label, width: 200 },
    { key: "crew", label: "Crew", width: 90, render: (r) => { const c = crewOf(r).length; const min = r.min_seats || 0; const max = r.max_seats || 0; const under = min > 0 && c < min; return <span className={under ? "text-amber-300" : ""}>{c}{max ? `/${max}` : ""}{under ? " ⚠" : ""}</span>; } },
    { key: "status", label: "Status", width: 120, render: (r) => <StatusPill tone={TONE[r.status] || "neutral"}>{r.status || "Off Duty"}</StatusPill> },
    { key: "description", label: "Notes" },
    ...(canManage ? [{ key: "actions", label: "", width: 40, sortable: false, render: (r) => <button onClick={(e) => { e.stopPropagation(); disband(r.id); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button> }] : []),
  ];

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-mdt-dim animate-spin" /></div>;

  const selected = groups.find((g) => g.id === selectedId);
  const crew = selected ? crewOf(selected) : [];

  return (
    <>
      <div className="flex items-center gap-2 h-9 px-3 border-b border-mdt-line bg-mdt-bg flex-shrink-0">
        <span className="text-[12px] uppercase tracking-[0.06em] text-mdt-muted">{label} Board</span>
        <span className="text-[12.5px] text-mdt-muted">{groups.length} in service</span>
        <div className="flex-1" />
        {canManage && (
          <>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder={isFireEMS ? "Engine 1, Truck 2…" : "New group name"} className={`${INPUT} w-52`} />
            <Btn variant="primary" icon={Plus} onClick={create} disabled={!newName.trim()}>Create {label}</Btn>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 overflow-auto mdt-scroll border-r border-mdt-line">
          <DataTable
            columns={columns}
            rows={groups}
            selectedKey={selectedId}
            onRowClick={(r) => setSelectedId(r.id)}
            sort={{ key: "name", dir: "asc" }}
            emptyMessage={`No ${label.toLowerCase()} in service`}
          />
        </div>
        <div className="w-[320px] flex-shrink-0 flex flex-col min-h-0">
          {!selected ? (
            <EmptyState icon={Truck} title={`Select ${label.toLowerCase()}`} hint="Choose a row to view its crew" />
          ) : (
            <Panel title={`${selected.name} — Crew (${crew.length})`} scroll>
              {crew.length === 0 ? (
                <p className="px-3 py-2 text-[12px] text-mdt-dim">No crew assigned</p>
              ) : crew.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 border-b border-mdt-line last:border-b-0">
                  <Users className="w-3 h-3 text-mdt-dim flex-shrink-0" />
                  <span className="text-[12.5px] font-mono text-mdt-text">{m.callsign || "—"}</span>
                  <span className="text-[12.5px] text-mdt-muted flex-1 truncate">{m.user_name}</span>
                  <StatusPill tone={TONE[m.status] || "neutral"}>{m.status}</StatusPill>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}