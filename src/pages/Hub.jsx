import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  Radio, Users, LayoutDashboard, Clock, CalendarDays,
  Network, Award, FileText, Car, Shirt, Shield, LogOut, Settings as SettingsIcon
} from "lucide-react";

export default function Hub() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const quickAccess = [
    { label: "CAD", icon: Radio, path: "/cad", color: "text-cyan-400" },
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", color: "text-emerald-400" },
    ...(isAdmin ? [{ label: "Roster", icon: Users, path: "/roster", color: "text-blue-400" }] : []),
    { label: "Shifts", icon: Clock, path: "/shifts", color: "text-amber-400" },
    { label: "LOA", icon: CalendarDays, path: "/loa", color: "text-purple-400" },
    { label: "Org Chart", icon: Network, path: "/org-chart", color: "text-teal-400" },
    { label: "Certs", icon: Award, path: "/certifications", color: "text-orange-400" },
    { label: "Docs", icon: FileText, path: "/documents", color: "text-sky-400" },
    { label: "Vehicles", icon: Car, path: "/vehicles", color: "text-red-400" },
    { label: "Uniforms", icon: Shirt, path: "/uniforms", color: "text-pink-400" },
  ];

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  return (
    <div className="flex gap-6">
      {/* Quick Access Bar - Left */}
      <div className="w-48 flex-shrink-0">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Quick Access</h2>
        <div className="space-y-1">
          {quickAccess.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-150 group"
            >
              <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* User Settings - Main */}
      <div className="flex-1 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">User Settings</h1>
            <p className="text-slate-400 text-sm">Manage your account and preferences</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Shield className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{user?.full_name || "User"}</h3>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${
                isAdmin
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-slate-700/50 text-slate-400 border-slate-600/50"
              }`}>
                {isAdmin ? "Administrator" : "Member"}
              </span>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">Account Email</span>
              <span className="text-sm text-white">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">Role</span>
              <span className="text-sm text-white capitalize">{user?.role || "user"}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
            {isAdmin && (
              <Link
                to="/settings"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
              >
                <SettingsIcon className="w-4 h-4" />
                Admin Settings
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}