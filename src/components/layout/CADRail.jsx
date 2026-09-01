import React from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";
import { Building2, Keyboard, Settings, HelpCircle, Shield, Home, LogOut, Radio } from "lucide-react";

const ITEMS = [
  { label: "Terminals", path: "/cad", icon: Building2 },
  { label: "Keybinds", path: "/keybinds", icon: Keyboard },
  { label: "Settings", path: "/cad-settings", icon: Settings },
  { label: "Help", path: "/help", icon: HelpCircle },
  { label: "Admin", path: "/cad/admin", icon: Shield, supervisorOrAbove: true },
];

/** Flat operational rail — no glass, no rounded cards, icon + label, fixed width. */
export default function CADRail() {
  const location = useLocation();
  const { isPlatformAdmin, isCADAdmin, isSupervisor } = useUserPermissions();
  const canSee = isPlatformAdmin || isCADAdmin || isSupervisor;
  const { branding } = useCommunityBranding();

  const isActive = (path) =>
    path === "/cad" ? location.pathname === "/cad" || location.pathname.startsWith("/cad/departments") : location.pathname.startsWith(path);

  return (
    <aside className="w-[52px] sm:w-[168px] flex-shrink-0 flex flex-col bg-mdt-surface border-r border-mdt-line">
      <div className="h-10 flex items-center gap-2 px-2.5 border-b border-mdt-line bg-mdt-surface-2">
        {branding?.logo_url ? (
          <img src={branding.logo_url} alt="" className="w-5 h-5 object-cover flex-shrink-0" />
        ) : (
          <Radio className="w-4 h-4 text-mdt-accent flex-shrink-0" />
        )}
        <span className="hidden sm:block text-[11px] font-semibold uppercase tracking-[0.1em] text-mdt-muted truncate">
          {branding?.community_name || "CAD"}
        </span>
      </div>

      <nav className="flex-1 min-h-0 overflow-auto mdt-scroll py-1">
        {ITEMS.filter((i) => !i.supervisorOrAbove || canSee).map((i) => (
          <Link
            key={i.path}
            to={i.path}
            className={`flex items-center gap-2 h-8 px-2.5 text-[12px] border-l-2 ${
              isActive(i.path)
                ? "border-mdt-accent bg-mdt-surface-3 text-mdt-text"
                : "border-transparent text-mdt-muted hover:bg-mdt-surface-3/60 hover:text-mdt-text"
            }`}
          >
            <i.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:block truncate">{i.label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-mdt-line">
        <Link to="/" className="flex items-center gap-2 h-8 px-2.5 text-[12px] text-mdt-muted hover:bg-mdt-surface-3/60 hover:text-mdt-text">
          <Home className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:block">Back to Home</span>
        </Link>
        <button
          onClick={() => base44.auth.logout("/login")}
          className="w-full flex items-center gap-2 h-8 px-2.5 text-[12px] text-mdt-muted hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:block">Sign Off</span>
        </button>
      </div>
    </aside>
  );
}