import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, AlertCircle, Lock, LogIn, Shield, Flame, HeartPulse, Radio, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Btn, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";
import DataTable from "@/components/mdt/ui/DataTable";
import { terminalRoute } from "@/components/cad/home/terminalRoute";

const CAT_ICON = { Police: Shield, Fire: Flame, EMS: HeartPulse, Dispatch: Radio, Civilian: User };

export default function CADDepartments() {
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState(null);
  const [community, setCommunity] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [accessRes, u, rosterRes, c, cs] = await Promise.all([
        base44.functions.invoke('getUserCADDepartments', {}),
        base44.entities.CADUnit.list(),
        base44.functions.invoke('listCADRoster', {}),
        base44.entities.ActiveCall.list(),
        base44.entities.CommunitySetting.list().catch(() => []),
      ]);
      setDepartments(accessRes.data.departments || []);
      setAccessInfo(accessRes.data);
      setUnits(u); setPersonnel(rosterRes.data.personnel || []); setCalls(c);
      if (cs.length > 0) setCommunity(cs[0]);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);


  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }


  const openCalls = calls.filter(c => c.status !== "Closed");
  const showDiscordWarning = accessInfo && !accessInfo.isAdmin && !accessInfo.hasDiscordLink && departments.some(d => d.discord_role_id);

  const board = (d) => { if (d.hasAccess !== false) navigate(terminalRoute(d)); };

  const columns = [
    {
      key: "name", label: "Terminal",
      render: (d) => {
        const Icon = CAT_ICON[d.category] || Building2;
        return (
          <span className="flex items-center gap-2 min-w-0">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: d.color || "#14b8a6" }} />
            <span className={`truncate ${d.hasAccess === false ? "text-mdt-dim" : "text-mdt-text"}`}>{d.name}</span>
          </span>
        );
      },
    },
    { key: "category", label: "Service", width: 120 },
    {
      key: "calls", label: "Open", width: 70, align: "right", mono: true,
      sortValue: (d) => openCalls.filter(c => c.department_id === d.id).length,
      render: (d) => {
        const n = openCalls.filter(c => c.department_id === d.id).length;
        return <span className={n ? "text-amber-300" : "text-mdt-dim"}>{n}</span>;
      },
    },
    {
      key: "p1", label: "P1", width: 60, align: "right", mono: true,
      sortValue: (d) => openCalls.filter(c => c.department_id === d.id && c.priority?.startsWith("1")).length,
      render: (d) => {
        const n = openCalls.filter(c => c.department_id === d.id && c.priority?.startsWith("1")).length;
        return <span className={n ? "text-red-300" : "text-mdt-dim"}>{n}</span>;
      },
    },
    {
      key: "units", label: "Units", width: 90, align: "right", mono: true,
      sortValue: (d) => units.filter(u => u.department_id === d.id).length,
      render: (d) => {
        const all = units.filter(u => u.department_id === d.id);
        const avail = all.filter(u => u.status === "Available").length;
        return <span className={avail ? "text-emerald-300" : "text-mdt-dim"}>{avail}/{all.length}</span>;
      },
    },
    {
      key: "personnel", label: "Personnel", width: 90, align: "right", mono: true,
      sortValue: (d) => personnel.filter(p => p.department_id === d.id || (p.additional_department_ids || []).includes(d.id)).length,
      render: (d) => personnel.filter(p => p.department_id === d.id || (p.additional_department_ids || []).includes(d.id)).length,
    },
    {
      key: "access", label: "Access", width: 110, sortable: false,
      render: (d) => d.hasAccess === false ? <StatusPill tone="crit">Locked</StatusPill> : <StatusPill tone="ok">Cleared</StatusPill>,
    },
    {
      key: "action", label: "", width: 108, sortable: false, align: "right",
      render: (d) => d.hasAccess === false
        ? <span className="inline-flex items-center gap-1 text-[11px] text-mdt-dim"><Lock className="w-3 h-3" /> No Role</span>
        : <Btn variant="primary" icon={LogIn} onClick={(e) => { e.stopPropagation(); board(d); }}>Board</Btn>,
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 h-10 px-3 border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
        <span className="text-[12.5px] font-semibold truncate">
          {community?.community_name ? `${community.community_name} — Operations` : "CAD Operations"}
        </span>
        <span className="ml-auto text-[11px] font-mono text-mdt-dim whitespace-nowrap">
          {openCalls.length} OPEN · {openCalls.filter(c => c.priority?.startsWith("1")).length} P1 · {units.filter(u => u.status === "Available").length}/{units.length} UNITS
        </span>
        <Link to="/cad/admin"><Btn>Admin</Btn></Link>
      </div>

      {showDiscordWarning && (
        <div className="flex items-center gap-2 px-3 h-8 bg-amber-500/10 border-b border-amber-500/30 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-[11.5px] text-amber-300 truncate">Discord account not linked — role-restricted terminals are locked. Ask an admin to sync Discord members.</p>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto mdt-scroll">
        {departments.length === 0 ? (
          <EmptyState icon={Building2} title="No terminals configured" hint="Departments are created in the Admin Panel" />
        ) : (
          <DataTable
            columns={columns}
            rows={departments}
            onRowDoubleClick={board}
            rowTone={(d) => d.color || undefined}
            emptyMessage="No terminals"
          />
        )}
      </div>
    </div>
  );
}