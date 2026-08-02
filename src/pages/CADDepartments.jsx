import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCadTheme } from "@/hooks/useCadTheme";
import RetroDepartmentList from "@/components/cad/retro/RetroDepartmentList";
import { Btn, EmptyState } from "@/components/mdt/ui/primitives";
import SignOnRail from "@/components/cad/home/SignOnRail";
import SignOnDetail from "@/components/cad/home/SignOnDetail";

export default function CADDepartments() {
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState(null);
  const [community, setCommunity] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [accessRes, u, p, c, cs] = await Promise.all([
        base44.functions.invoke('getUserCADDepartments', {}),
        base44.entities.CADUnit.list(),
        base44.entities.CADPersonnel.list(),
        base44.entities.ActiveCall.list(),
        base44.entities.CommunitySetting.list().catch(() => []),
      ]);
      const depts = accessRes.data.departments || [];
      setDepartments(depts);
      setAccessInfo(accessRes.data);
      setUnits(u); setPersonnel(p); setCalls(c);
      setSelectedId((prev) => prev || (depts.find(d => d.hasAccess !== false) || depts[0])?.id || null);
      if (cs.length > 0) setCommunity(cs[0]);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const { theme } = useCadTheme();
  const unitCount = (deptId) => units.filter(u => u.department_id === deptId).length;
  const availableCount = (deptId) => units.filter(u => u.department_id === deptId && u.status === "Available").length;

  if (loading) {
    return <div className="mdt h-full min-h-[60vh] bg-mdt-bg flex items-center justify-center"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  if (theme === "retro") return <RetroDepartmentList departments={departments} units={units} personnel={personnel} community={community} />;

  const showDiscordWarning = accessInfo && !accessInfo.isAdmin && !accessInfo.hasDiscordLink && departments.some(d => d.discord_role_id);
  const selected = departments.find(d => d.id === selectedId) || null;
  const activeCalls = calls.filter(c => c.status !== "Closed");

  if (departments.length === 0) {
    return (
      <div className="mdt h-full min-h-[60vh] bg-mdt-bg border border-mdt-line flex items-center justify-center">
        <EmptyState icon={Building2} title="No departments configured" hint="Departments are created in the Admin Panel" />
      </div>
    );
  }

  return (
    <div className="mdt flex flex-col h-[calc(100vh-96px)] min-h-[520px] bg-mdt-bg border border-mdt-line text-mdt-text">
      <div className="flex items-center gap-3 h-10 px-3 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
        <span className="text-[12.5px] font-semibold text-mdt-text truncate">
          {community?.community_name ? `${community.community_name} — Terminal Selection` : "Terminal Selection"}
        </span>
        <span className="ml-auto text-[11px] font-mono text-mdt-dim">
          {activeCalls.length} OPEN CALLS · {units.filter(u => u.status === "Available").length}/{units.length} UNITS AVAILABLE
        </span>
        <Link to="/cad/admin"><Btn>Admin Panel</Btn></Link>
      </div>

      {showDiscordWarning && (
        <div className="flex items-center gap-2 px-3 h-8 bg-amber-500/10 border-b border-amber-500/30 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-[11.5px] text-amber-300 truncate">Discord account not linked — departments with role restrictions are locked. Ask an admin to sync Discord members.</p>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        <SignOnRail
          departments={departments}
          selectedId={selectedId}
          onSelect={setSelectedId}
          unitCount={unitCount}
          availableCount={availableCount}
        />
        <SignOnDetail dept={selected} units={units} personnel={personnel} calls={calls} community={community} />
      </div>
    </div>
  );
}