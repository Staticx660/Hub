import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const statusColors = {
  "Active": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "On LOA": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Suspended": "bg-red-500/10 text-red-400 border-red-500/20",
  "Inactive": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Terminated": "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function Roster() {
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [m, d] = await Promise.all([
          base44.entities.RosterMember.list(),
          base44.entities.Department.list(),
        ]);
        setMembers(m);
        setDepartments(d);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || "Unknown";

  const filtered = members.filter(m => {
    const matchSearch = !search || 
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.badge_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.callsign?.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "all" || m.department_id === filterDept;
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  }).sort((a, b) => (b.rank_level || 0) - (a.rank_level || 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Full Roster</h1>
        <p className="text-sm text-slate-400 mt-1">View all members across departments</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white"
          />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            {["Active", "On LOA", "Suspended", "Inactive", "Terminated"].map(s => (
              <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Member</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Department</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Rank</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Badge</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Discord</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                        {m.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{m.name}</p>
                        {m.callsign && <p className="text-xs text-slate-500">{m.callsign}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link to={`/departments/${m.department_id}`} className="text-sm text-blue-400 hover:text-blue-300">
                      {getDeptName(m.department_id)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">{m.rank || "—"}</td>
                  <td className="px-5 py-3 text-sm text-slate-400">{m.badge_number || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[m.status] || statusColors["Inactive"]}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">{m.discord_username || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}