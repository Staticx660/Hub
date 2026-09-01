import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Siren, Users, Layers, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const unitStatusColors = { "Available": "bg-green-500/15 text-green-400", "On Call": "bg-red-500/15 text-red-400", "Transporting": "bg-yellow-500/15 text-yellow-400", "Out of Service": "bg-gray-500/15 text-gray-400", "Off Duty": "bg-slate-700 text-slate-400" };
const priorityColors = { "1 - High": "bg-red-500/15 text-red-400 border-red-500/30", "2 - Medium": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", "3 - Low": "bg-blue-500/15 text-blue-400 border-blue-500/30" };

export default function CADDepartmentDetail() {
  const { id } = useParams();
  const [dept, setDept] = useState(null);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [calls, setCalls] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [d, allUnits, rosterRes, allCalls, allGroups] = await Promise.all([
        base44.entities.CADDepartment.get(id),
        base44.entities.CADUnit.list(),
        base44.functions.invoke('listCADRoster', {}),
        base44.entities.ActiveCall.list("-created_date"),
        base44.entities.CADUnitGroup.list(),
      ]);
      setDept(d);
      setUnits(allUnits.filter(u => u.department_id === id));
      setPersonnel((rosterRes.data.personnel || []).filter(p => p.department_id === id || (p.additional_department_ids || []).includes(id)));
      setCalls(allCalls.filter(c => c.department_id === id && c.status !== "Closed"));
      setGroups(allGroups.filter(g => g.department_id === id));
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cad-border border-t-cad-accent rounded-full animate-spin" /></div>;
  if (!dept) return <div className="text-center py-16"><p className="text-cad-muted">Department not found.</p><Link to="/cad"><Button variant="outline" className="mt-4 border-cad-border text-cad-muted">Back to Departments</Button></Link></div>;

  const unitName = (uid) => units.find(u => u.id === uid)?.name || "Unknown";

  return (
    <div className="cad-font">
      <Link to="/cad" className="inline-flex items-center gap-2 text-sm text-cad-muted hover:text-cad-text transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Departments
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: (dept.color || "#3b82f6") + "20", boxShadow: `0 0 24px ${(dept.color || "#3b82f6")}20` }}>
          <Building2 className="w-7 h-7" style={{ color: dept.color || "#3b82f6" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-cad-text">{dept.name}</h1>
          <div className="flex items-center gap-3 text-sm text-cad-muted">
            <span>{dept.category}</span>
            {!dept.is_active && <span className="text-red-400">Inactive</span>}
          </div>
        </div>
      </div>

      {dept.description && <p className="text-sm text-cad-muted mb-6 max-w-2xl">{dept.description}</p>}

      <Tabs defaultValue="calls">
        <TabsList className="bg-cad-surface/60 border border-cad-border/50">
          <TabsTrigger value="calls" className="data-[state=active]:bg-cad-surface-2 text-cad-muted data-[state=active]:text-cad-text">Active Calls ({calls.length})</TabsTrigger>
          <TabsTrigger value="units" className="data-[state=active]:bg-cad-surface-2 text-cad-muted data-[state=active]:text-cad-text">Units ({units.length})</TabsTrigger>
          <TabsTrigger value="personnel" className="data-[state=active]:bg-cad-surface-2 text-cad-muted data-[state=active]:text-cad-text">Personnel ({personnel.length})</TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-cad-surface-2 text-cad-muted data-[state=active]:text-cad-text">Preset Groups ({groups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="mt-4">
          {calls.length === 0 ? (
            <div className="text-center py-12 cad-card rounded-2xl"><Siren className="w-12 h-12 mx-auto mb-3 text-cad-dim" /><p className="text-cad-dim">No active calls for this department</p></div>
          ) : (
            <div className="space-y-3">
              {calls.map(c => (
                <div key={c.id} className="cad-card rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${priorityColors[c.priority] || priorityColors["3 - Low"]}`}>{c.priority}</span>
                      <div>
                        <h3 className="font-semibold text-cad-text">{c.call_type}</h3>
                        <p className="text-xs text-cad-dim flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</p>
                      </div>
                    </div>
                  </div>
                  {c.description && <p className="text-sm text-cad-muted mb-2">{c.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {(c.assigned_unit_ids || []).map(uid => <span key={uid} className="text-xs px-2 py-0.5 rounded-full bg-cad-surface-3/60 text-cad-muted">{unitName(uid)}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="units" className="mt-4">
          {units.length === 0 ? (
            <div className="text-center py-12 cad-card rounded-2xl"><Siren className="w-12 h-12 mx-auto mb-3 text-cad-dim" /><p className="text-cad-dim">No units assigned to this department</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {units.map(u => (
                <div key={u.id} className="cad-card rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div><h3 className="font-semibold text-cad-text">{u.name}</h3><p className="text-xs text-cad-dim">{u.callsign || "No callsign"}</p></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${unitStatusColors[u.status] || unitStatusColors["Off Duty"]}`}>{u.status}</span>
                  </div>
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-cad-surface-3/60 text-cad-muted mb-1">{u.unit_type}</span>
                  {u.personnel_names?.length > 0 && <p className="text-xs text-cad-dim mt-1">Crew: {u.personnel_names.join(", ")}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="personnel" className="mt-4">
          {personnel.length === 0 ? (
            <div className="text-center py-12 cad-card rounded-2xl"><Users className="w-12 h-12 mx-auto mb-3 text-cad-dim" /><p className="text-cad-dim">No personnel in this department</p></div>
          ) : (
            <div className="overflow-x-auto cad-card rounded-2xl">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-cad-dim border-b border-cad-border/50"><th className="p-3">Name</th><th className="p-3">Rank</th><th className="p-3">Badge</th><th className="p-3">Callsign</th><th className="p-3">Status</th></tr></thead>
                <tbody>
                  {personnel.map(p => (
                    <tr key={p.id} className="border-b border-cad-border/30">
                      <td className="p-3 text-cad-text font-medium">{p.name}</td>
                      <td className="p-3 text-cad-muted">{p.rank || "—"}</td>
                      <td className="p-3 text-cad-muted">{p.badge_number || "—"}</td>
                      <td className="p-3 text-cad-muted">{p.callsign || "—"}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "Available" ? "bg-green-500/15 text-green-400" : p.status === "On Duty" ? "bg-blue-500/15 text-blue-400" : "bg-slate-700 text-slate-400"}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          {groups.length === 0 ? (
            <div className="text-center py-12 cad-card rounded-2xl"><Layers className="w-12 h-12 mx-auto mb-3 text-cad-dim" /><p className="text-cad-dim">No preset groups for this department</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map(g => (
                <div key={g.id} className="cad-card rounded-2xl p-4">
                  <h3 className="font-semibold text-cad-text mb-1">{g.name}</h3>
                  {g.description && <p className="text-sm text-cad-muted mb-2">{g.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {(g.unit_ids || []).map(uid => <span key={uid} className="text-xs px-2 py-0.5 rounded-full bg-cad-surface-3/60 text-cad-muted">{unitName(uid)}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}