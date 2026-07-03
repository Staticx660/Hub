import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  Radio, ChevronLeft, ChevronRight, LogOut, Menu, X, Home, Building2, Shield,
  Activity, Users, Keyboard, Archive, Settings
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "Departments", path: "/cad", icon: Building2 },
  { label: "Dispatch Dashboard", path: "/dispatch-dashboard", icon: Activity },
  { label: "Department Archive", path: "/department-archive", icon: Archive },
  { label: "Keybinds", path: "/keybinds", icon: Keyboard },
  { label: "Personnel", path: "/cad-personnel", icon: Users, adminOnly: true },
  { label: "CAD Settings", path: "/cad-settings", icon: Settings, adminOnly: true },
  { label: "Admin Panel", path: "/cad/admin", icon: Shield, adminOnly: true },
];

export default function CADSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  const isActive = (path) => {
    if (path === "/cad") return location.pathname === "/cad" || location.pathname.startsWith("/cad/departments") || location.pathname === "/cad/dispatch";
    if (path === "/dispatch-dashboard") return location.pathname === "/dispatch-dashboard";
    if (path === "/department-archive") return location.pathname === "/department-archive";
    if (path === "/keybinds") return location.pathname === "/keybinds";
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">CAD</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/40 transition-all mb-2 border-b border-slate-700/30 pb-3"
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Back to Home</span>}
        </Link>
        {visibleNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/40"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-slate-900 border-r border-slate-700/50 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <div
        className={`hidden lg:flex flex-col h-screen bg-slate-900 border-r border-slate-700/50 transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}