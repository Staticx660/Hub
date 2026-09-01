import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  Users, Clock, CalendarDays, Shield, Flame, HeartPulse,
  Landmark, Lock, Bike, Radio, ArrowRight, Activity
} from "lucide-react";
import { Panel, StatusPill, EmptyState } from "@/components/mdt/ui/primitives";

const categoryIcons = {
  "Police & Sheriff": Shield,
  "Fire & EMS": Flame,
  "Hospitals & Medical": HeartPulse,
  "Government & State": Landmark,
  "Private Security": Lock,
  "Motorcycle Clubs": Bike,
  "Civilians": Users,
  "Communications": Radio,
  "Other": Shield,
};

export default function Dashboard() {
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loaRequests, setLoaRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

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
        <div className="w-7 h-7 border-2 border-mdt-line border-t-mdt-accent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.status === "Active").length;

  const stats = [
    { label: "Total Members", value: members.length, icon: Users },
    { label: "Active", value: activeMembers, icon: Activity },
    { label: "On Duty", value: shifts.length, icon: Clock },
    { label: "Pending LOA", value: loaRequests.length, icon: CalendarDays },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-mdt-text tracking-tight">Dashboard</h1>
          <p className="text-[11.5px] text-mdt-dim">Overview of all departments and operations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-mdt-surface border border-mdt-line px-3 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-mdt-surface-3 border border-mdt-line-2 flex-shrink-0">
              <stat.icon className="w-4 h-4 text-mdt-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-[17px] font-bold text-mdt-text leading-tight">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.08em] text-mdt-dim truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Departments */}
      <Panel
        title="Departments"
        actions={
          <Link
            to={isAdmin ? "/departments" : "/org-chart"}
            className="flex items-center gap-1 text-[11px] text-mdt-muted hover:text-mdt-text"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        }
        scroll={false}
      >
        {departments.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={Shield}
              title="No departments yet"
              hint={isAdmin ? "Create your first department from the Departments page" : undefined}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-mdt-line">
            {departments.map((dept) => {
              const Icon = categoryIcons[dept.category] || Shield;
              const deptMembers = members.filter(
                (m) => m.department_id === dept.id || (m.additional_department_ids || []).includes(dept.id)
              );
              const activeCount = deptMembers.filter((m) => m.status === "Active").length;
              return (
                <Link
                  key={dept.id}
                  to={isAdmin ? `/departments/${dept.id}` : "/org-chart"}
                  className="bg-mdt-surface hover:bg-mdt-surface-2 p-3 block"
                >
                  <div className="flex items-center gap-2.5">
                    {dept.logo_url ? (
                      <img src={dept.logo_url} alt="" className="w-8 h-8 object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 bg-mdt-surface-3 border border-mdt-line-2 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-mdt-muted" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-[12.5px] font-semibold text-mdt-text truncate">{dept.name}</h3>
                      <p className="text-[10px] uppercase tracking-[0.08em] text-mdt-dim truncate">{dept.category}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-4">
                    <div>
                      <p className="text-[13px] font-bold text-mdt-text leading-tight">{deptMembers.length}</p>
                      <p className="text-[9.5px] uppercase tracking-[0.08em] text-mdt-dim">Members</p>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-emerald-300 leading-tight">{activeCount}</p>
                      <p className="text-[9.5px] uppercase tracking-[0.08em] text-mdt-dim">Active</p>
                    </div>
                    {dept.max_slots && (
                      <div>
                        <p className="text-[13px] font-bold text-amber-300 leading-tight">
                          {dept.max_slots - deptMembers.length}
                        </p>
                        <p className="text-[9.5px] uppercase tracking-[0.08em] text-mdt-dim">Open Slots</p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Pending LOA */}
      {loaRequests.length > 0 && (
        <Panel
          title="Pending LOA Requests"
          actions={
            <Link to="/loa" className="flex items-center gap-1 text-[11px] text-mdt-muted hover:text-mdt-text">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          }
          scroll={false}
        >
          <div className="divide-y divide-mdt-line/60">
            {loaRequests.slice(0, 5).map((loa) => (
              <div key={loa.id} className="px-3 h-9 flex items-center justify-between">
                <div className="min-w-0 flex items-baseline gap-2">
                  <p className="text-[12px] font-medium text-mdt-text truncate">{loa.member_name || "Unknown"}</p>
                  <p className="text-[10.5px] text-mdt-dim">{loa.start_date} — {loa.end_date}</p>
                </div>
                <StatusPill tone="warn">Pending</StatusPill>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}