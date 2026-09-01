import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { MSection } from "@/components/mdt/ui/formFields";
import { Btn } from "@/components/mdt/ui/primitives";
import { Save, Loader2 } from "lucide-react";

const INPUT = "w-48 h-7 px-2 bg-mdt-bg border text-[11.5px] font-mono text-mdt-text placeholder:text-mdt-dim focus:outline-none focus:border-mdt-accent";

/** Maps Discord roles (member / supervisor / LOA) onto roster departments. */
export default function DiscordRoleMappings({ roles = [] }) {
  const { toast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [maps, setMaps] = useState({ member: {}, supervisor: {}, loa: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const depts = await base44.entities.Department.list();
      const member = {}, supervisor = {}, loa = {};
      for (const d of depts) {
        if (d.discord_role_id) member[d.id] = d.discord_role_id;
        if (d.discord_supervisor_role_id) supervisor[d.id] = d.discord_supervisor_role_id;
        if (d.loa_discord_role_id) loa[d.id] = d.loa_discord_role_id;
      }
      setDepartments(depts);
      setMaps({ member, supervisor, loa });
      setLoading(false);
    })();
  }, []);

  const set = (kind, deptId, value) => setMaps((m) => ({ ...m, [kind]: { ...m[kind], [deptId]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      for (const d of departments) {
        const updates = {};
        const member = maps.member[d.id] || "";
        const sup = maps.supervisor[d.id] || "";
        const loa = maps.loa[d.id] || "";
        if ((d.discord_role_id || "") !== member) updates.discord_role_id = member;
        if ((d.discord_supervisor_role_id || "") !== sup) updates.discord_supervisor_role_id = sup;
        if ((d.loa_discord_role_id || "") !== loa) updates.loa_discord_role_id = loa;
        if (Object.keys(updates).length) await base44.entities.Department.update(d.id, updates);
      }
      toast({ title: "Saved", description: "Department role mappings updated." });
    } catch (e) { toast({ title: "Error saving", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) return <MSection title="Role Mapping"><Loader2 className="w-4 h-4 animate-spin text-mdt-accent" /></MSection>;

  return (
    <MSection
      title="Role Mapping"
      actions={<Btn variant="primary" icon={saving ? Loader2 : Save} disabled={saving} onClick={save}>Save Mappings</Btn>}
    >
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2.5 gap-y-1.5 items-center">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim">Department</span>
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-mdt-dim w-48">Member Role ID</span>
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-amber-400/80 w-48">Supervisor Role ID</span>
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-cyan-400/80 w-48">LOA Role ID</span>
        {departments.map((d) => (
          <React.Fragment key={d.id}>
            <div className="min-w-0 border-t border-mdt-line pt-1.5">
              <p className="text-[12.5px] text-mdt-text truncate">{d.name}</p>
              <p className="text-[10.5px] text-mdt-dim">{d.category}</p>
            </div>
            <input value={maps.member[d.id] || ""} onChange={(e) => set("member", d.id, e.target.value)} placeholder="Member Role ID" className={`${INPUT} border-mdt-line-2`} />
            <input value={maps.supervisor[d.id] || ""} onChange={(e) => set("supervisor", d.id, e.target.value)} placeholder="Supervisor Role ID" className={`${INPUT} border-amber-700/50`} />
            <input value={maps.loa[d.id] || ""} onChange={(e) => set("loa", d.id, e.target.value)} placeholder="LOA Role ID" className={`${INPUT} border-cyan-700/50`} />
          </React.Fragment>
        ))}
      </div>
      {departments.length === 0 && <p className="text-[12px] text-mdt-muted py-3 text-center">No departments yet — create departments first.</p>}
      {roles.length > 0 && (
        <p className="text-[10.5px] text-mdt-dim mt-2 pt-2 border-t border-mdt-line">
          Role IDs are listed in the “Available Roles” section below.
        </p>
      )}
    </MSection>
  );
}