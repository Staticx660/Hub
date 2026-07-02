import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  Users, Radio, Shield, LogOut, Settings as SettingsIcon, ChevronRight, Home
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
      description: "Manage departments, members, shifts, LOA, vehicles, and more",
      icon: Users,
      path: "/dashboard",
      accent: "blue",
    },
    {
      title: "CAD System",
      description: "Computer-Aided Dispatch for all emergency services",
      icon: Radio,
      path: "/cad",
      accent: "cyan",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">RPCommand</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
              Welcome back, {user?.full_name?.split(" ")[0] || "Operator"}
            </h1>
            <p className="text-slate-400 text-lg">Select a system to continue</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
            {modules.map((mod) => (
              <Link
                key={mod.title}
                to={mod.path}
                className="group relative bg-slate-900/60 border border-slate-800 rounded-2xl p-8 hover:border-slate-600 hover:bg-slate-900 transition-all duration-200 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${mod.accent === "blue" ? "from-blue-500/10" : "from-cyan-500/10"} to-transparent rounded-bl-full`} />
                <div className="relative">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${mod.accent === "blue" ? "bg-blue-500/15" : "bg-cyan-500/15"}`}>
                    <mod.icon className={`w-7 h-7 ${mod.accent === "blue" ? "text-blue-400" : "text-cyan-400"}`} />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-1">{mod.title}</h2>
                  <p className="text-sm text-slate-400 mb-6">{mod.description}</p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${mod.accent === "blue" ? "text-blue-400" : "text-cyan-400"} group-hover:gap-2 transition-all`}>
                    Enter <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-80 flex-shrink-0 border-l border-slate-800 bg-slate-900/40 flex flex-col">
        <div className="p-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
            <Home className="w-3.5 h-3.5" />
            Home
          </span>
        </div>

        <div className="flex-1 flex items-center px-6">
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {(user?.full_name || "U")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{user?.full_name || "User"}</h3>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
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

        <div className="p-6 space-y-2">
          {isAdmin && (
            <Link
              to="/settings"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium border border-slate-700/50"
            >
              <span className="flex items-center gap-3">
                <SettingsIcon className="w-4 h-4" />
                Admin Settings
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium w-full border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
}