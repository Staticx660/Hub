import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ShieldAlert, Loader2, Search, Crown, Eye } from "lucide-react";
import { Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";

const input = "h-7 px-2 bg-mdt-bg border border-mdt-line-2 text-[12px] text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";
const cap = "text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim";

export default function PermissionsManager() {
  const [personnel, setPersonnel] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [guildIds, setGuildIds] = useState(null);
  const [purging, setPurging] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [p, d, dm] = await Promise.all([
        base44.entities.CADPersonnel.list(),
        base44.entities.CADDepartment.list(),
        base44.functions.invoke('getDiscordMembers', {}).catch(() => null),
      ]);
      setPersonnel(p);
      setDepartments(d);
      const list = dm?.data?.members || dm?.members;
      if (Array.isArray(list)) setGuildIds(new Set(list.map((m) => m.discord_id)));
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find((d) => d.id === id)?.name || "Unassigned";

  const toggleFlag = async (id, field, currentValue) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await base44.entities.CADPersonnel.update(id, { [field]: !currentValue });
      setPersonnel((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: !currentValue } : p)));
      toast({
        title: `${field === "is_supervisor" ? "Supervisor" : "CAD Admin"} ${!currentValue ? "granted" : "revoked"}`,
        duration: 2000,
      });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUpdatingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const updateDepts = async (id, data) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await base44.entities.CADPersonnel.update(id, data);
      setPersonnel((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
      toast({ title: "Department updated", duration: 2000 });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUpdatingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const toggleAdditionalDept = (p, deptId) => {
    const current = p.additional_department_ids || [];
    const newAdditional = current.includes(deptId) ? current.filter((d) => d !== deptId) : [...current, deptId];
    updateDepts(p.id, { additional_department_ids: newAdditional });
  };

  // Role permissions are backed by Identifiers/Discord: anyone whose Discord account
  // is no longer in the guild is not shown here.
  const departed = guildIds ? personnel.filter((p) => p.discord_id && !guildIds.has(p.discord_id)) : [];
  const active = guildIds ? personnel.filter((p) => !p.discord_id || guildIds.has(p.discord_id)) : personnel;

  const purgeDeparted = async () => {
    if (!window.confirm(`Remove ${departed.length} personnel record(s) for members who left Discord?`)) return;
    setPurging(true);
    try {
      for (const p of departed) await base44.entities.CADPersonnel.delete(p.id);
      setPersonnel((prev) => prev.filter((p) => !departed.some((d) => d.id === p.id)));
      toast({ title: `Removed ${departed.length} departed member(s)` });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setPurging(false); }
  };

  const filtered = active.filter((p) => {
    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.callsign?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept === "all" || p.department_id === filterDept || (p.additional_department_ids || []).includes(filterDept);
    return matchesSearch && matchesDept;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-mdt-accent" /></div>;

  const selected = filtered.find((p) => p.id === selectedId) || null;

  return (
    <div className="flex h-full min-h-0 border border-mdt-line bg-mdt-surface">
      <div className="w-[320px] flex-shrink-0 border-r border-mdt-line flex flex-col min-h-0">
        <div className="flex items-center gap-1.5 p-2 border-b border-mdt-line bg-mdt-surface-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mdt-dim" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or callsign" className={`${input} w-full pl-7`} />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={input}>
            <option value="all">All Depts</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        {departed.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-amber-500/30 bg-amber-500/10">
            <span className="text-[11px] text-amber-200 flex-1">{departed.length} record(s) left Discord — hidden</span>
            <Btn variant="danger" disabled={purging} onClick={purgeDeparted}>{purging ? "Removing…" : "Purge"}</Btn>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
          {filtered.length === 0 && <EmptyState icon={ShieldAlert} title="No personnel found" />}
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-2 h-8 flex items-center gap-2 border-b border-mdt-line/60 ${selectedId === p.id ? "bg-mdt-accent/15" : "hover:bg-mdt-surface-3/60"}`}
              style={{ boxShadow: selectedId === p.id ? "inset 2px 0 0 hsl(var(--mdt-accent))" : undefined }}>
              <span className="min-w-0">
                <span className="block text-[12px] text-mdt-text truncate">{p.name}</span>
                <span className="block text-[10.5px] text-mdt-dim truncate">{deptName(p.department_id)}</span>
              </span>
              <span className="ml-auto flex gap-1">
                {p.is_cad_admin && <StatusPill tone="info">A</StatusPill>}
                {p.is_supervisor && <StatusPill tone="ok">S</StatusPill>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-auto mdt-scroll">
        {!selected ? (
          <EmptyState icon={ShieldAlert} title="No personnel selected" hint="Pick a member to manage permissions" />
        ) : (
          <>
            <div className="h-9 px-2.5 flex items-center gap-2 border-b border-mdt-line bg-mdt-surface-2">
              <span className="text-[12.5px] font-semibold truncate">{selected.name}</span>
              <span className="text-[11px] font-mono text-mdt-dim truncate">{selected.rank || "No rank"} · {selected.callsign || "No callsign"}</span>
              {updatingIds.has(selected.id) && <Loader2 className="w-3.5 h-3.5 animate-spin text-mdt-accent ml-auto" />}
            </div>

            <div className="p-2.5 space-y-2.5">
              <section className="border border-mdt-line">
                <header className="h-7 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2"><span className={cap}>Permission Flags</span></header>
                <div className="p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-mdt-dim" />
                    <span className="text-[12px]">Supervisor — manage groups, units & personnel</span>
                    <Btn className="ml-auto" variant={selected.is_supervisor ? "primary" : "default"} onClick={() => toggleFlag(selected.id, "is_supervisor", selected.is_supervisor)}>
                      {selected.is_supervisor ? "Granted" : "Grant"}
                    </Btn>
                  </div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-mdt-dim" />
                    <span className="text-[12px]">CAD Admin — full admin console access</span>
                    <Btn className="ml-auto" variant={selected.is_cad_admin ? "primary" : "default"} onClick={() => toggleFlag(selected.id, "is_cad_admin", selected.is_cad_admin)}>
                      {selected.is_cad_admin ? "Granted" : "Grant"}
                    </Btn>
                  </div>
                </div>
              </section>

              <section className="border border-mdt-line">
                <header className="h-7 px-2.5 flex items-center border-b border-mdt-line bg-mdt-surface-2"><span className={cap}>Department Assignment</span></header>
                <div className="p-2.5 space-y-2">
                  <div>
                    <label className={`${cap} block mb-1`}>Primary Department</label>
                    <select value={selected.department_id || ""} onChange={(e) => updateDepts(selected.id, { department_id: e.target.value })} className={`${input} w-full`}>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`${cap} block mb-1`}>Additional Departments</label>
                    <div className="flex flex-wrap gap-1">
                      {departments.filter((d) => d.id !== selected.department_id).map((d) => {
                        const on = (selected.additional_department_ids || []).includes(d.id);
                        return (
                          <button key={d.id} onClick={() => toggleAdditionalDept(selected, d.id)}
                            className={`h-6 px-2 rounded-sm border text-[11px] ${on ? "bg-mdt-accent/15 border-mdt-accent/40 text-mdt-text" : "bg-mdt-surface-3 border-mdt-line-2 text-mdt-muted hover:text-mdt-text"}`}>
                            {d.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}