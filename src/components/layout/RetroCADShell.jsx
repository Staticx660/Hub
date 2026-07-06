import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useCommunityBranding } from "@/hooks/useCommunityBranding";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "DEPARTMENTS", path: "/cad" },
  { label: "KEYBINDS", path: "/keybinds" },
  { label: "SETTINGS", path: "/cad-settings", adminOnly: true },
  { label: "ADMIN", path: "/cad/admin", adminOnly: true },
];

export default function RetroCADShell() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { branding } = useCommunityBranding();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const communityName = branding?.community_name || "CAD";
  const visibleNav = navItems.filter(i => !i.adminOnly || isAdmin);

  const isActive = (path) => {
    if (path === "/cad") return location.pathname === "/cad" || location.pathname.startsWith("/cad/departments") || location.pathname === "/cad/dispatch";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => base44.auth.logout("/login");
  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });

  return (
    <div className="flex flex-col h-screen cad-gradient-bg cad-font retro-shell">
      <div className="retro-status-bar flex items-center justify-between px-4 py-1.5 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-cad-accent font-bold tracking-wider">[ SYS:ONLINE ]</span>
          <span className="text-cad-muted">{communityName.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-4 text-cad-muted">
          <span>USR:{user?.full_name?.toUpperCase()?.slice(0, 12) || "---"}</span>
          <span className="text-cad-accent tabular-nums">{timeStr}</span>
        </div>
      </div>

      <div className="border-b border-cad-border-light/50 px-4 py-1.5 flex items-center gap-1 text-xs flex-wrap">
        <Link to="/" className="retro-nav-link text-cad-dim hover:text-cad-text">&lsaquo; HOME</Link>
        <span className="text-cad-dim mx-0.5">|</span>
        {visibleNav.map((item, i) => (
          <React.Fragment key={item.path}>
            {i > 0 && <span className="text-cad-dim mx-0.5">|</span>}
            <Link
              to={item.path}
              className={`retro-nav-link ${isActive(item.path) ? "text-cad-accent" : "text-cad-muted hover:text-cad-text"}`}
            >
              &gt; {item.label}
            </Link>
          </React.Fragment>
        ))}
        <button onClick={handleLogout} className="retro-nav-link text-cad-muted hover:text-red-400 ml-auto">
          &gt; LOGOUT
        </button>
      </div>

      <main className="flex-1 overflow-y-auto cad-scroll">
        <div className="retro-flow p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}