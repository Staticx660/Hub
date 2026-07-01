import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Network, ChevronDown, ChevronRight, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OrgChart() {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [m, d] = await Promise.all([
          base44.entities.RosterMember.list(),
          base44.entities.Department.list(),
        ]);
        setMembers(m);
        setDepartments(d);
        // Auto-expand all ranks
        const exp = {};
        d.forEach(dept => {
          (dept.ranks || []).forEach(r => { exp[`${dept.id}-${r.name}`] = true; });
        });
        setExpanded(exp);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredDepts = selectedDept === "all" ? departments : departments.filter(d => d.id === selectedDept);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Org Chart</h1>
          <p className="text-sm text-slate-400 mt-1">Chain of command and hierarchy</p>
        </div>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredDepts.map((dept) => {
        const deptMembers = members.filter(m => m.department_id === dept.id || (m.additional_department_ids || []).includes(dept.id));
        const ranks = (dept.ranks || []).sort((a, b) => b.level - a.level);

        return (
          <div key={dept.id} className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/30">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                {dept.name}
              </h2>
            </div>
            <div className="p-4 space-y-1">
              {ranks.map((rank) => {
                const key = `${dept.id}-${rank.name}`;
                const rankMembers = deptMembers.filter(m => m.rank === rank.name);
                const isExpanded = expanded[key];

                return (
                  <div key={key} style={{ marginLeft: `${(10 - rank.level) * 16}px` }}>
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors w-full text-left"
                    >
                      {rankMembers.length > 0 ? (
                        isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <div className="w-3.5" />
                      )}
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: rank.color || "#64748B" }} />
                      <span className="text-sm font-medium text-white">{rank.name}</span>
                      <span className="text-xs text-slate-500 ml-1">({rankMembers.length})</span>
                    </button>
                    {isExpanded && rankMembers.length > 0 && (
                      <div className="ml-8 space-y-1 pb-1">
                        {rankMembers.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 py-1.5 px-3 rounded text-sm">
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                              {m.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="text-slate-300">{m.name}</span>
                            {m.badge_number && <span className="text-xs text-slate-500">#{m.badge_number}</span>}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto ${
                              m.status === "Active" ? "bg-emerald-500/10 text-emerald-400" :
                              m.status === "On LOA" ? "bg-amber-500/10 text-amber-400" :
                              "bg-slate-500/10 text-slate-400"
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {ranks.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No ranks configured for this department</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}