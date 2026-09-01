import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Network, ChevronDown, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";

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
    return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" /></div>;
  }

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredDepts = selectedDept === "all" ? departments : departments.filter(d => d.id === selectedDept);

  const statusTone = (s) => (s === "Active" ? "ok" : s === "On LOA" ? "warn" : "neutral");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-mdt-text tracking-tight">Org Chart</h1>
          <p className="text-[11.5px] text-mdt-dim">Chain of command and hierarchy</p>
        </div>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-48 h-8 rounded-sm bg-mdt-surface-2 border-mdt-line-2 text-mdt-text text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-mdt-surface-2 border-mdt-line-2 text-mdt-text rounded-sm">
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredDepts.map((dept) => {
        const deptMembers = members.filter(m => m.department_id === dept.id || (m.additional_department_ids || []).includes(dept.id));
        const ranks = (dept.ranks || []).sort((a, b) => b.level - a.level);

        return (
          <Panel key={dept.id} title={dept.name} scroll={false}>
            <div className="p-2">
              {ranks.map((rank) => {
                const key = `${dept.id}-${rank.name}`;
                const rankMembers = deptMembers.filter(m => m.rank === rank.name);
                const isExpanded = expanded[key];

                return (
                  <div key={key} style={{ marginLeft: `${(10 - rank.level) * 14}px` }}>
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex items-center gap-2 h-7 px-2 hover:bg-mdt-surface-2 w-full text-left border-b border-mdt-line/40"
                    >
                      {rankMembers.length > 0 ? (
                        isExpanded ? <ChevronDown className="w-3 h-3 text-mdt-dim" /> : <ChevronRight className="w-3 h-3 text-mdt-dim" />
                      ) : (
                        <div className="w-3" />
                      )}
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: rank.color || "#64748B" }} />
                      <span className="text-[12px] font-medium text-mdt-text">{rank.name}</span>
                      <span className="text-[10.5px] text-mdt-dim">({rankMembers.length})</span>
                    </button>
                    {isExpanded && rankMembers.length > 0 && (
                      <div className="ml-7">
                        {rankMembers.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 h-7 px-2 text-[12px] border-b border-mdt-line/40">
                            <div className="w-5 h-5 bg-mdt-surface-3 border border-mdt-line-2 flex items-center justify-center text-[9px] font-bold text-mdt-muted flex-shrink-0">
                              {m.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="text-mdt-muted truncate">{m.name}</span>
                            {m.badge_number && <span className="text-[10.5px] text-mdt-dim">#{m.badge_number}</span>}
                            <span className="ml-auto"><StatusPill tone={statusTone(m.status)}>{m.status}</StatusPill></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {ranks.length === 0 && (
                <div className="py-2"><EmptyState icon={Network} title="No ranks configured for this department" /></div>
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}