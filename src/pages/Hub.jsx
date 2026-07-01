import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Users, Radio, Clock, CalendarDays, FileText, Car, Shirt,
  Network, Award, ArrowRight, Shield, Activity, LayoutDashboard
} from "lucide-react";

export default function Hub() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState({ members: 0, activeShifts: 0, pendingLoa: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [mems, shifts, loa] = await Promise.all([
          base44.entities.RosterMember.list(),
          base44.entities.Shift.filter({ status: "In Progress" }),
          base44.entities.LOARequest.filter({ status: "Pending" }),
        ]);
        setStats({
          members: mems.length,
          activeShifts: shifts.length,
          pendingLoa: loa.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const primaryCards = [
    {
      title: "CAD System",
      description: "Computer-Aided Dispatch for PD, Fire & EMS, and Civilian operations",
      icon: Radio,
      path: "/cad",
      gradient: "from-cyan-500/20 to-blue-600/5 border-cyan-500/20",
      iconColor: "text-cyan-400",
    },
    {
      title: "Roster Management",
      description: "Manage members, departments, ranks, and assignments",
      icon: Users,
      path: isAdmin ? "/roster" : "/org-chart",
      gradient: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Operations Dashboard",
      description: "Overview of departments, active shifts, and pending requests",
      icon: LayoutDashboard,
      path: "/dashboard",
      gradient: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  const quickLinks = [
    { label: "Shifts", icon: Clock, path: "/shifts" },
    { label: "LOA Calendar", icon: CalendarDays, path: "/loa" },
    { label: "Org Chart", icon: Network, path: "/org-chart" },
    { label: "Certifications", icon: Award, path: "/certifications" },
    { label: "Documents", icon: FileText, path: "/documents" },
    { label: "Vehicles", icon: Car, path: "/vehicles" },
    { label: "Uniforms", icon: Shirt, path: "/uniforms" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
            <p className="text-slate-400 text-sm">Welcome back{user?.full_name ? `, ${user.full_name}` : ""}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-500">Total Members</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.members}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-500">On Duty</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.activeShifts}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-500">Pending LOA</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.pendingLoa}</p>
          </div>
        </div>
      )}

      {/* Primary Modules */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {primaryCards.map((card) => (
            <Link
              key={card.title}
              to={card.path}
              className={`bg-gradient-to-br ${card.gradient} border rounded-xl p-6 hover:scale-[1.02] transition-transform duration-150 group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center">
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white text-lg">{card.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-800/50 transition-all duration-150 flex flex-col items-center gap-2 group"
            >
              <link.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}