import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Clock, CalendarDays, Network, Award,
  FileText, Car, Shirt, Settings, ChevronLeft, ChevronRight,
  Shield, Flame, HeartPulse, Landmark, Lock, Bike, LogOut, Menu, X, RefreshCw, Home, Radio
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Departments", path: "/departments", icon: Shield, adminOnly: true },
  { label: "Roster", path: "/roster", icon: Users, adminOnly: true },
  { label: "Shifts", path: "/shifts", icon: Clock },
  { label: "LOA Calendar", path: "/loa", icon: CalendarDays },
  { label: "Org Chart", path: "/org-chart", icon: Network },
  { label: "Certifications", path: "/certifications", icon: Award },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Vehicles", path: "/vehicles", icon: Car },
  { label: "Uniforms", path: "/uniforms", icon: Shirt },
  { label: "Discord Sync", path: "/discord-sync", icon: RefreshCw, adminOnly: true },
  { label: "CAD Admin", path: "/cad/admin", icon: Radio, adminOnly: true },
  { label: "CAD Settings", path: "/cad-settings", icon: Settings, adminOnly: true },
  { label: "Settings", path: "/settings", icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { branding } = useCommunityBranding();
  const logoUrl = branding?.logo_url || "";
  const communityName = branding?.community_name || "Roster";

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const logoEl = logoUrl ? (
    <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover ring-1 ring-cad-border/50 flex-shrink-0" />
  ) : (
    <div className="w-9 h-9 bg-cad-accent rounded-xl flex items-center justify-center shadow-lg shadow-cad-accent/20 flex-shrink-0">
      <Shield className="w-5 h-5 text-white" />
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full cad-font">
      <div className="p-4 border-b border-cad-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {logoEl}
            {!collapsed && <span className="font-bold text-cad-text text-lg tracking-tight truncate">{communityName}</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-cad-surface-2/50 text-cad-muted hover:text-cad-text transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto cad-scroll">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-cad-muted hover:text-cad-text hover:bg-cad-surface-2/40 transition-all mb-2 border-b border-cad-border/30 pb-3"
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-cad-accent/15 text-cad-accent border border-cad-accent/20 shadow-sm shadow-cad-accent/10"
                  : "text-cad-muted hover:text-cad-text hover:bg-cad-surface-2/40 border border-transparent"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-cad-border/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-cad-muted hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-cad-surface rounded-lg text-cad-text shadow-lg border border-cad-border/50"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full cad-glass-strong border-r border-cad-border/50 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-cad-muted hover:text-cad-text z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <div
        className={`hidden lg:flex flex-col h-screen cad-glass border-r border-cad-border/50 transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}