import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { 
  Users, Clock, CalendarDays, Shield, Flame, HeartPulse, 
  Landmark, Lock, Bike, TrendingUp, AlertCircle, ArrowRight, Activity
} from "lucide-react";

const categoryIcons = {
  "Police & Sheriff": Shield,
  "Fire & EMS": Flame,
  "Hospitals & Medical": HeartPulse,
  "Government & State": Landmark,
  "Private Security": Lock,
  "Motorcycle Clubs": Bike,
  "Other": Shield,
};

const categoryColors = {
  "Police & Sheriff": "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  "Fire & EMS": "from-red-500/20 to-red-600/5 border-red-500/20",
  "Hospitals & Medical": "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
  "Government & State": "from-amber-500/20 to-amber-600/5 border-amber-500/20",
  "Private Security": "from-purple-500/20 to-purple-600/5 border-purple-500/20",
  "Motorcycle Clubs": "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  "Other": "from-slate-500/20 to-slate-600/5 border-slate-500/20",
};

const categoryIconColors = {
  "Police & Sheriff": "text-blue-400",
  "Fire & EMS": "text-red-400",
  "Hospitals & Medical": "text-emerald-400",
  "Government & State": "text-amber-400",
  "Private Security": "text-purple-400",
  "Motorcycle Clubs": "text-orange-400",
  "Other": "text-slate-400",
};

export default function Dashboard() {
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loaRequests, setLoaRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [depts, mems, sh, loa] = await Promise.all([
          base44.entities.Department.list(),
          base44.entities.RosterMember.list(),
          base44.entities.Shift.filter({ status: "In Progress" }),
          base44.entities.LOARequest.filter({ status: "Pending" }),
        ]);
        setDepartments(depts);
        setMembers(mems);
        setShifts(sh);
        setLoaRequests(loa);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeMembers = members.filter(m => m.status === "Active").length;
  const onLoa = members.filter(m => m.status === "On LOA").length;

  const stats = [
    { label: "Total Members", value: members.length, icon: Users, color: "text-blue-400" },
    { label: "Active", value: activeMembers, icon: Activity, color: "text-emerald-400" },
    { label: "On Duty", value: shifts.length, icon: Clock, color: "text-amber-400" },
    { label: "Pending LOA", value: loaRequests.length, icon: CalendarDays, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-1">Overview of all departments and operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Departments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Departments</h2>
          <Link to="/departments" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {departments.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center">
            <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No departments yet</p>
            <Link to="/departments" className="text-sm text-blue-400 hover:text-blue-300">
              Create your first department →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const Icon = categoryIcons[dept.category] || Shield;
              const deptMembers = members.filter(m => m.department_id === dept.id);
              const activeCount = deptMembers.filter(m => m.status === "Active").length;
              return (
                <Link
                  key={dept.id}
                  to={`/departments/${dept.id}`}
                  className={`bg-gradient-to-br ${categoryColors[dept.category] || categoryColors["Other"]} border rounded-xl p-5 hover:scale-[1.02] transition-transform duration-150`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {dept.logo_url ? (
                        <img src={dept.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center">
                          <Icon className={`w-5 h-5 ${categoryIconColors[dept.category] || "text-slate-400"}`} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-white">{dept.name}</h3>
                        <p className="text-xs text-slate-400">{dept.category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div>
                      <p className="text-lg font-bold text-white">{deptMembers.length}</p>
                      <p className="text-xs text-slate-500">Members</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-400">{activeCount}</p>
                      <p className="text-xs text-slate-500">Active</p>
                    </div>
                    {dept.max_slots && (
                      <div>
                        <p className="text-lg font-bold text-amber-400">{dept.max_slots - deptMembers.length}</p>
                        <p className="text-xs text-slate-500">Open Slots</p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending LOA */}
      {loaRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-amber-400" />
              Pending LOA Requests
            </h2>
            <Link to="/loa" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl divide-y divide-slate-800">
            {loaRequests.slice(0, 5).map((loa) => (
              <div key={loa.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{loa.member_name || "Unknown"}</p>
                  <p className="text-xs text-slate-500">{loa.start_date} — {loa.end_date}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}