import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  Users, Radio, Shield, LogOut, Settings as SettingsIcon, ArrowRight
} from "lucide-react";

export default function Landing() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  const modules = [
    {
      title: "Roster System",
      description: "Dashboard, departments, members, shifts, LOA, and more",
      icon: Users,
      path: "/dashboard",
      gradient: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
      iconColor: "text-blue-400",
    },
    {
      title: "CAD System",
      description: "Computer-Aided Dispatch for PD, Fire & EMS, and Civilians",
      icon: Radio,
      path: "/cad",
      gradient: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30",
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left: Module Selection */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">OCRP Command</h1>
            <p className="text-slate-400 text-sm">Select a system to enter</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
          {modules.map((mod) => (
            <Link
              key={mod.title}
              to={mod.path}
              className={`bg-gradient-to-br ${mod.gradient} border rounded-2xl p-8 hover:scale-[1.03] transition-transform duration-150 group`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-xl bg-slate-800/80 flex items-center justify-center">
                  <mod.icon className={`w-7 h-7 ${mod.iconColor}`} />
                </div>
                <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
              <h2 className="text-xl font-semibold text-white">{mod.title}</h2>
              <p className="text-sm text-slate-400 mt-1">{mod.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Right: Home & Settings Panel */}
      <div className="w-80 flex-shrink-0 border-l border-slate-800 bg-slate-900/50 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <span className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-sm font-medium border border-blue-500/20">
            Home
          </span>
          {isAdmin && (
            <Link
              to="/settings"
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-sm font-medium hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Settings
            </Link>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Shield className="w-7 h-7 text-slate-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{user?.full_name || "User"}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
              isAdmin
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-slate-700/50 text-slate-400 border-slate-600/50"
            }`}>
              {isAdmin ? "Administrator" : "Member"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {isAdmin && (
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium w-full"
            >
              <SettingsIcon className="w-4 h-4" />
              Admin Settings
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium w-full border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}