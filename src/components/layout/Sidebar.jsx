import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Clock, CalendarDays, Network, Award,
  FileText, Car, Shirt, Settings, ChevronLeft, ChevronRight,
  Shield, LogOut, Menu, X, Home } from
"lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const sections = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Shifts", path: "/shifts", icon: Clock },
      { label: "LOA Calendar", path: "/loa", icon: CalendarDays },
      { label: "Org Chart", path: "/org-chart", icon: Network },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Certifications", path: "/certifications", icon: Award },
      { label: "Documents", path: "/documents", icon: FileText },
      { label: "Vehicles", path: "/vehicles", icon: Car },
      { label: "Uniforms", path: "/uniforms", icon: Shirt },
    ],
  },
  {
    title: "Management",
    adminOnly: true,
    items: [
      { label: "Departments", path: "/departments", icon: Shield },
      { label: "Roster", path: "/roster", icon: Users },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { isPlatformAdmin, isCADAdmin, isSupervisor } = useUserPermissions();
  const canAdmin = isPlatformAdmin || isCADAdmin || isSupervisor;
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  const visibleSections = sections.filter((s) => !s.adminOnly || isAdmin);

  const navRow = (item) => {
    const on = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-2 px-2.5 h-7 text-[12px] border-b border-mdt-line/60 ${
          on
            ? "bg-mdt-accent/15 text-mdt-text"
            : "text-mdt-muted hover:bg-mdt-surface-3/60 hover:text-mdt-text"
        }`}
        style={{ boxShadow: on ? "inset 2px 0 0 hsl(var(--mdt-accent))" : undefined }}
      >
        <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-11 px-3 flex items-center justify-between border-b border-mdt-line bg-mdt-surface-2 flex-shrink-0">
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold leading-tight truncate">OCRP Roster</div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-mdt-dim truncate">Personnel · Operations</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded-sm text-mdt-dim hover:bg-mdt-surface-3 hover:text-mdt-text flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      <nav className="flex-1 min-h-0 overflow-auto mdt-scroll">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          title={collapsed ? "Home" : undefined}
          className="flex items-center gap-2 px-2.5 h-7 text-[12px] text-mdt-muted hover:bg-mdt-surface-3/60 hover:text-mdt-text border-b border-mdt-line"
        >
          <Home className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Back to Home</span>}
        </Link>
        {visibleSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="h-6 px-2.5 flex items-center text-[10px] font-semibold uppercase tracking-[0.1em] text-mdt-dim bg-mdt-surface-3">
                {section.title}
              </p>
            )}
            {section.items.map(navRow)}
          </div>
        ))}
      </nav>

      <div className="border-t border-mdt-line flex-shrink-0">
        {canAdmin && (
          <Link
            to="/cad/admin"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Admin Console" : undefined}
            className="flex items-center gap-2 px-2.5 h-8 text-[11.5px] text-mdt-muted hover:text-mdt-text hover:bg-mdt-surface-3/60 border-b border-mdt-line/60"
          >
            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span>Admin Console</span>}
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 h-8 text-[11.5px] text-mdt-muted hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-8 h-8 flex items-center justify-center bg-mdt-surface-2 border border-mdt-line rounded-sm text-mdt-text"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 mdt">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full bg-mdt-surface border-r border-mdt-line text-mdt-text">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 z-10 text-mdt-dim hover:text-mdt-text"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex flex-col h-screen bg-mdt-surface border-r border-mdt-line text-mdt-text transition-all duration-150 flex-shrink-0 ${
          collapsed ? "w-11" : "w-[188px] xl:w-[212px]"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}