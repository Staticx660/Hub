import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, ChevronRight, Users, Siren } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CADDepartments() {
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [d, u, p] = await Promise.all([
        base44.entities.CADDepartment.list(),
        base44.entities.CADUnit.list(),
        base44.entities.CADPersonnel.list(),
      ]);
      setDepartments(d); setUnits(u); setPersonnel(p);
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const unitCount = (deptId) => units.filter(u => u.department_id === deptId).length;
  const personnelCount = (deptId) => personnel.filter(p => p.department_id === deptId).length;

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">CAD Departments</h1>
      <p className="text-sm text-slate-400 mb-6">Click a department to view its units, personnel, and active calls</p>
      {departments.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 mb-2">No departments yet.</p>
          <Link to="/cad/admin" className="text-cyan-400 hover:text-cyan-300 text-sm">Create departments in the Admin Panel →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <Link key={d.id} to={`/cad/departments/${d.id}`} className="group bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-900 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: (d.color || "#3b82f6") + "20" }}>
                    <Building2 className="w-5 h-5" style={{ color: d.color || "#3b82f6" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{d.name}</h3>
                    <span className="text-xs text-slate-500">{d.category}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
              {d.description && <p className="text-sm text-slate-400 mb-4 line-clamp-2">{d.description}</p>}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-slate-400"><Siren className="w-4 h-4" /> {unitCount(d.id)} units</span>
                <span className="flex items-center gap-1.5 text-slate-400"><Users className="w-4 h-4" /> {personnelCount(d.id)} personnel</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}