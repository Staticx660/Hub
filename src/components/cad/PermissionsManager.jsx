import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ShieldCheck, ShieldAlert, Loader2, Search, Crown, Eye } from "lucide-react";

export default function PermissionsManager() {
  const [personnel, setPersonnel] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const { toast } = useToast();

  const load = async () => {
    try {
      const [p, d] = await Promise.all([
        base44.entities.CADPersonnel.list(),
        base44.entities.CADDepartment.list(),
      ]);
      setPersonnel(p);
      setDepartments(d);
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
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filtered = personnel.filter((p) => {
    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.callsign?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept === "all" || p.department_id === filterDept || (p.additional_department_ids || []).includes(filterDept);
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-cad-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-5 h-5 text-cad-accent" />
          <h2 className="text-lg font-semibold text-cad-text">Role Permissions</h2>
        </div>
        <p className="text-sm text-cad-muted">
          Grant CAD-level supervisor or admin permissions to personnel. Platform admins always have full access.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cad-dim" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or callsign..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-cad-surface/80 border border-cad-border/50 rounded-lg text-cad-text placeholder:text-cad-dim focus:outline-none focus:border-cad-accent/50"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2 text-sm bg-cad-surface/80 border border-cad-border/50 rounded-lg text-cad-text focus:outline-none focus:border-cad-accent/50"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((p) => {
          const isUpdating = updatingIds.has(p.id);
          return (
            <div
              key={p.id}
              className="cad-card p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-cad-text truncate">{p.name}</p>
                  <p className="text-xs text-cad-dim">
                    {p.rank || "No rank"} · {p.callsign || "No callsign"}
                  </p>
                  <p className="text-xs text-cad-muted mt-0.5">{deptName(p.department_id)}</p>
                </div>
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-cad-accent flex-shrink-0" />}
              </div>

              <div className="flex flex-col gap-2">
                <PermissionToggle
                  icon={Eye}
                  label="Supervisor"
                  description="Can manage groups, units & view personnel"
                  enabled={p.is_supervisor}
                  onChange={() => toggleFlag(p.id, "is_supervisor", p.is_supervisor)}
                  color="emerald"
                />
                <PermissionToggle
                  icon={Crown}
                  label="CAD Admin"
                  description="Full access to all CAD admin sections"
                  enabled={p.is_cad_admin}
                  onChange={() => toggleFlag(p.id, "is_cad_admin", p.is_cad_admin)}
                  color="blue"
                />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-cad-dim">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No personnel found.</p>
        </div>
      )}
    </div>
  );
}

function PermissionToggle({ icon: Icon, label, description, enabled, onChange, color }) {
  const colorMap = {
    emerald: { on: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
    blue: { on: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
        enabled
          ? c.on
          : "bg-cad-surface-2/30 border-cad-border/30 text-cad-muted hover:border-cad-border-light/50"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] opacity-70 truncate">{description}</p>
      </div>
      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${enabled ? `${c.dot} border-transparent` : "border-cad-border-light"}`}>
        {enabled && <span className="w-1.5 h-1.5 rounded-full bg-cad-bg-solid" />}
      </span>
    </button>
  );
}