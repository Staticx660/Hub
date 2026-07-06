import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, ChevronRight, Users, Siren, Radio, Lock, AlertCircle, Flame, Ambulance, MessageCircle, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCadTheme } from "@/hooks/useCadTheme";
import RetroDepartmentList from "@/components/cad/retro/RetroDepartmentList";

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

  const isRetro = theme === "retro";
  if (isRetro) return <RetroDepartmentList departments={departments} units={units} personnel={personnel} community={community} />;

  return (
    <div className="cad-font">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-cad-text mb-1 tracking-tight">
            {community?.community_name ? `${community.community_name} CAD` : "CAD System"}
          </h1>
          <p className="text-sm text-cad-muted">Select a department to view calls, units, and personnel</p>
        </div>
        {community && (community.discord_invite_url || community.website_url) && (
          <div className="flex items-center gap-2">
            {community.discord_invite_url && (
              <a href={community.discord_invite_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cad-accent/10 text-cad-accent hover:bg-cad-accent/20 text-sm font-medium transition-all">
                <MessageCircle className="w-4 h-4" /> Discord
              </a>
            )}
            {community.website_url && (
              <a href={community.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cad-surface-2/60 text-cad-muted hover:text-cad-text text-sm font-medium transition-all border border-cad-border/50">
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
          </div>
        )}
      </div>

      <h2 className="text-xs font-semibold text-cad-dim uppercase tracking-wider mb-4">Departments</h2>
      {accessInfo && !accessInfo.isAdmin && !accessInfo.hasDiscordLink && departments.some(d => d.discord_role_id) && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-400">Your Discord account isn't linked to the roster. Departments with Discord role restrictions are locked. Ask an admin to sync Discord members.</p>
        </div>
      )}
      {departments.length === 0 ? (
        <div className="text-center py-16 cad-card rounded-2xl">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-cad-dim" />
          <p className="text-cad-muted mb-2">No departments yet.</p>
          <Link to="/cad/admin" className="text-cad-accent hover:text-cad-accent/80 text-sm">Create departments in the Admin Panel →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => {
            const locked = !d.hasAccess;
            const cardContent = (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: (d.color || "#3b82f6") + "20", boxShadow: `0 0 16px ${(d.color || "#3b82f6")}20` }}>
                      {d.category === "Dispatch" ? <Radio className="w-5 h-5" style={{ color: d.color || "#3b82f6" }} /> : d.category === "Fire" ? <Flame className="w-5 h-5" style={{ color: d.color || "#ef4444" }} /> : d.category === "EMS" ? <Ambulance className="w-5 h-5" style={{ color: d.color || "#22c55e" }} /> : <Building2 className="w-5 h-5" style={{ color: d.color || "#3b82f6" }} />}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${locked ? "text-cad-dim" : "text-cad-text"}`}>{d.name}</h3>
                      <span className="text-xs text-cad-dim">{d.category === "Dispatch" ? "Dispatch Board" : d.category}</span>
                    </div>
                  </div>
                  {locked ? <Lock className="w-5 h-5 text-cad-dim" /> : <ChevronRight className="w-5 h-5 text-cad-dim group-hover:text-cad-accent transition-colors" />}
                </div>
                {d.description && <p className="text-sm text-cad-muted mb-4 line-clamp-2">{d.description}</p>}
                {locked ? (
                  <p className="text-xs text-cad-dim flex items-center gap-1.5"><Lock className="w-3 h-3" /> Requires Discord role</p>
                ) : (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-cad-muted"><Siren className="w-4 h-4" /> {unitCount(d.id)} units</span>
                    <span className="flex items-center gap-1.5 text-cad-muted"><Users className="w-4 h-4" /> {personnelCount(d.id)} personnel</span>
                  </div>
                )}
              </>
            );
            return locked ? (
              <div key={d.id} className="cad-card rounded-2xl p-5 opacity-60">{cardContent}</div>
            ) : (
              <Link key={d.id} to={d.category === "Civilian" ? `/cad/civilian/${d.id}` : ["Dispatch", "Fire", "EMS"].includes(d.category) ? `/cad/board/${d.id}` : `/cad/mdt/${d.id}`} className="group cad-card cad-card-hover rounded-2xl p-5">{cardContent}</Link>
            );
          })}
        </div>
      )}
    </div>
  );
}