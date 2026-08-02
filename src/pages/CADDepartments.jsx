import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, AlertCircle, MessageCircle, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCadTheme } from "@/hooks/useCadTheme";
import RetroDepartmentList from "@/components/cad/retro/RetroDepartmentList";
import { ConsolePanel, ConsoleBtn, ConsoleEmpty } from "@/components/cad/console/ConsoleUI";
import DepartmentCard from "@/components/cad/home/DepartmentCard";

export default function CADDepartments() {
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState(null);
  const [community, setCommunity] = useState(null);
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
      setDepartments(accessRes.data.departments || []);
      setAccessInfo(accessRes.data);
      setUnits(u); setPersonnel(p); setCalls(c);
      if (cs.length > 0) setCommunity(cs[0]);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const { theme } = useCadTheme();
  const unitCount = (deptId) => units.filter(u => u.department_id === deptId).length;
  const personnelCount = (deptId) => personnel.filter(p => p.department_id === deptId).length;

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cad-border border-t-cad-accent rounded-full animate-spin" /></div>;

  if (theme === "retro") return <RetroDepartmentList departments={departments} units={units} personnel={personnel} community={community} />;

  const activeCalls = calls.filter(c => c.status !== "Closed");
  const availableUnits = units.filter(u => u.status === "Available");
  const showDiscordWarning = accessInfo && !accessInfo.isAdmin && !accessInfo.hasDiscordLink && departments.some(d => d.discord_role_id);

  const stats = [
    { label: "Departments", value: departments.length },
    { label: "Active Calls", value: activeCalls.length },
    { label: "Units Available", value: `${availableUnits.length}/${units.length}` },
    { label: "Personnel", value: personnel.length },
  ];

  return (
    <div className="cad-font space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-cad-text mb-1 tracking-tight">
            {community?.community_name ? `${community.community_name} CAD` : "CAD System"}
          </h1>
          <p className="text-[13px] text-cad-muted">Select a department to view calls, units, and personnel</p>
        </div>
        {community && (community.discord_invite_url || community.website_url) && (
          <div className="flex items-center gap-2">
            {community.discord_invite_url && (
              <a href={community.discord_invite_url} target="_blank" rel="noopener noreferrer">
                <ConsoleBtn variant="active" icon={MessageCircle}>Discord</ConsoleBtn>
              </a>
            )}
            {community.website_url && (
              <a href={community.website_url} target="_blank" rel="noopener noreferrer">
                <ConsoleBtn icon={Globe}>Website</ConsoleBtn>
              </a>
            )}
          </div>
        )}
      </div>

      <ConsolePanel title="System Status" scroll={false}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-cad-border/50">
          {stats.map(s => (
            <div key={s.label} className="px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-cad-dim">{s.label}</div>
              <div className="text-xl font-bold text-cad-text">{s.value}</div>
            </div>
          ))}
        </div>
      </ConsolePanel>

      {showDiscordWarning && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-[var(--cad-radius)] p-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-amber-300">Your Discord account isn't linked to the roster. Departments with Discord role restrictions are locked. Ask an admin to sync Discord members.</p>
        </div>
      )}

      <ConsolePanel title="Departments" subtitle={`${departments.length} total`} scroll={false} bodyClassName="p-3">
        {departments.length === 0 ? (
          <ConsoleEmpty
            icon={Building2}
            title="No departments yet"
            hint="Departments are created in the Admin Panel"
            action={<Link to="/cad/admin"><ConsoleBtn variant="primary">Open Admin Panel</ConsoleBtn></Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((d) => (
              <DepartmentCard key={d.id} dept={d} unitCount={unitCount(d.id)} personnelCount={personnelCount(d.id)} />
            ))}
          </div>
        )}
      </ConsolePanel>
    </div>
  );
}