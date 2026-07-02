import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, ChevronRight, Users, Siren, Radio, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CADDepartments() {
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [accessRes, u, p, c] = await Promise.all([
        base44.functions.invoke('getUserCADDepartments', {}),
        base44.entities.CADUnit.list(),
        base44.entities.CADPersonnel.list(),
        base44.entities.ActiveCall.list(),
      ]);
      setDepartments(accessRes.data.departments || []);
      setAccessInfo(accessRes.data);
      setUnits(u); setPersonnel(p); setCalls(c);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const unitCount = (deptId) => units.filter(u => u.department_id === deptId).length;
  const personnelCount = (deptId) => personnel.filter(p => p.department_id === deptId).length;
  const activeCallCount = calls.filter(c => c.status !== "Closed").length;

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">CAD System</h1>
      <p className="text-sm text-slate-400 mb-6">Select a department to view calls, units, and personnel</p>

      {/* Departments */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Departments</h2>
      {accessInfo && !accessInfo.isAdmin && !accessInfo.hasDiscordLink && departments.some(d => d.discord_role_id) && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-400">Your Discord account isn't linked to the roster. Departments with Discord role restrictions are locked. Ask an admin to sync Discord members.</p>
        </div>
      )}
      {departments.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 mb-2">No departments yet.</p>
          <Link to="/cad/admin" className="text-cyan-400 hover:text-cyan-300 text-sm">Create departments in the Admin Panel →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => {
            const locked = !d.hasAccess;
            const cardContent = (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: (d.color || "#3b82f6") + "20" }}>
                      {d.category === "Dispatch" ? <Radio className="w-5 h-5" style={{ color: d.color || "#3b82f6" }} /> : <Building2 className="w-5 h-5" style={{ color: d.color || "#3b82f6" }} />}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${locked ? "text-slate-500" : "text-white"}`}>{d.name}</h3>
                      <span className="text-xs text-slate-500">{d.category === "Dispatch" ? "Dispatch Board" : d.category}</span>
                    </div>
                  </div>
                  {locked ? <Lock className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition-colors" />}
                </div>
                {d.description && <p className="text-sm text-slate-400 mb-4 line-clamp-2">{d.description}</p>}
                {locked ? (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Requires Discord role</p>
                ) : (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-400"><Siren className="w-4 h-4" /> {unitCount(d.id)} units</span>
                    <span className="flex items-center gap-1.5 text-slate-400"><Users className="w-4 h-4" /> {personnelCount(d.id)} personnel</span>
                  </div>
                )}
              </>
            );
            return locked ? (
              <div key={d.id} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5 opacity-60">{cardContent}</div>
            ) : (
              <Link key={d.id} to={d.category === "Dispatch" ? "/cad/dispatch" : `/cad/mdt/${d.id}`} className="group bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-900 transition-all">{cardContent}</Link>
            );
          })}
        </div>
      )}
    </div>
  );
}