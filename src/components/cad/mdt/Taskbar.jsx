import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getBranding } from "@/hooks/useCommunityBranding";
import { useCadTheme } from "@/hooks/useCadTheme";
import { Shield, Search, FileText, Radio, Layers, Maximize, Home, UserCog, Keyboard, LogOut, ChevronUp, AlertTriangle, Users, Camera, ChevronDown, ClipboardList } from "lucide-react";
import SessionEditDialog from "@/components/cad/mdt/SessionEditDialog";

const statusOptions = [
  { value: "Available", color: "text-green-400", bg: "bg-green-500/15", dot: "bg-green-400" },
  { value: "Busy", color: "text-yellow-400", bg: "bg-yellow-500/15", dot: "bg-yellow-400" },
  { value: "On Call", color: "text-red-400", bg: "bg-red-500/15", dot: "bg-red-400" },
  { value: "Unavailable", color: "text-gray-400", bg: "bg-gray-500/15", dot: "bg-gray-400" },
];

export default function Taskbar({ activeView, setActiveView, session, departmentCategory, onStatusChange, onPanic, onClockOut, onOpenKeybinds, onSessionUpdate }) {
  const category = departmentCategory || "Police";
  const isFire = category === "Fire";
  const isMedical = category === "EMS" || isFire;
  const isDispatch = category === "Dispatch";
  const [logoMenu, setLogoMenu] = useState(false);
  const [statusMenu, setStatusMenu] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const logoRef = useRef(null);
  const statusRef = useRef(null);
  const navigate = useNavigate();
  const { theme } = useCadTheme();
  const retro = theme === "retro";

  useEffect(() => {
    const branding = getBranding();
    if (branding?.logo_url) setLogoUrl(branding.logo_url);
    else {
      base44.entities.CommunitySetting.list().then(list => {
        if (list.length > 0 && list[0].logo_url) setLogoUrl(list[0].logo_url);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (logoRef.current && !logoRef.current.contains(e.target)) setLogoMenu(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentStatus = statusOptions.find((s) => s.value === session?.status) || statusOptions[0];
  const isPanic = session?.panic_active;
  const activeGlow = "border border-green-400/50 shadow-[0_0_8px_rgba(74,222,128,0.25)]";

  const handleLogoAction = (action) => {
    setLogoMenu(false);
    switch (action) {
      case "fullscreen": document.documentElement.requestFullscreen?.(); break;
      case "home": onClockOut(); break;
      case "account": navigate("/settings"); break;
      case "keybinds": onOpenKeybinds?.(); break;
      case "logout": base44.auth.logout("/login"); break;
    }
  };

  const navButtons = isDispatch
    ? [
        { id: "lookups", label: "Lookup", icon: Search, hasDropdown: false },
        { id: "records", label: "Records", icon: FileText, hasDropdown: true },
        { id: "dispatch", label: "Call Viewer", icon: Radio, hasDropdown: false },
        { id: "groups", label: "Groups", icon: Layers, hasDropdown: false },
      ]
    : isFire
    ? [
        { id: "pcr", label: "PCR", icon: ClipboardList, hasDropdown: false },
        { id: "records", label: "Fire Reports", icon: FileText, hasDropdown: false },
        { id: "mycall", label: "My Incident", icon: Shield, hasDropdown: false },
        { id: "dispatch", label: "Fire Board", icon: Radio, hasDropdown: false },
      ]
    : isMedical
    ? [
        { id: "pcr", label: "PCR", icon: ClipboardList, hasDropdown: false },
        { id: "records", label: "Records", icon: FileText, hasDropdown: false },
        { id: "mycall", label: "My Call", icon: Shield, hasDropdown: false },
        { id: "dispatch", label: "Board", icon: Radio, hasDropdown: false },
      ]
    : [
        { id: "lookups", label: "Lookup", icon: Search, hasDropdown: false },
        { id: "records", label: "Records", icon: FileText, hasDropdown: true },
        { id: "mycall", label: "My Call", icon: Shield, hasDropdown: false },
        { id: "groups", label: "Groups", icon: Layers, hasDropdown: false },
        { id: "dispatch", label: "Self Dispatch", icon: Radio, hasDropdown: false },
      ];

  // Theme-aware class sets
  const c = {
    bar: retro
      ? `h-12 border-t border-cad-border-light bg-cad-bg-solid/95 cad-font flex items-center px-2 gap-1 ${isPanic ? "border-red-500 animate-pulse" : ""}`
      : `h-14 bg-[#131519] border-t border-[#2c2f36] flex items-center px-2 gap-1 ${isPanic ? "border-red-500 animate-pulse" : ""}`,
    logoBtn: retro
      ? "flex items-center gap-2 px-2 h-9 hover:bg-cad-surface-2/50 transition-colors"
      : "flex items-center gap-2 px-2 h-10 rounded-lg hover:bg-slate-800 transition-colors",
    menu: retro
      ? "absolute bottom-12 left-0 w-48 retro-frame shadow-xl py-1 z-50"
      : "absolute bottom-11 left-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50",
    menuItem: retro
      ? "w-full flex items-center gap-2 px-3 py-2 text-xs text-cad-muted hover:bg-cad-surface-2/50 hover:text-cad-text uppercase tracking-wider"
      : "w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700",
    menuDiv: retro ? "border-t border-cad-border my-1" : "border-t border-slate-700 my-1",
    navBtn: (active) => retro
      ? `flex items-center gap-1.5 px-3 h-9 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${active ? "text-cad-accent border-b-2 border-cad-accent" : "text-cad-muted hover:text-cad-text"}`
      : `flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${active ? `bg-slate-800 text-white ${activeGlow}` : "text-slate-400 hover:bg-slate-800 hover:text-white"}`,
    divider: retro ? "w-px h-6 bg-cad-border-light/50 mx-1" : "w-px h-7 bg-[#2c2f36] mx-1",
    statusBtn: retro
      ? `flex items-center gap-1.5 px-3 h-9 text-xs font-bold uppercase tracking-wider transition-colors border border-cad-border-light ${currentStatus.bg} ${currentStatus.color}`
      : `flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold transition-colors ${currentStatus.bg} ${currentStatus.color}`,
    statusMenu: retro
      ? "absolute bottom-12 right-0 w-44 retro-frame shadow-xl py-1 z-50"
      : "absolute bottom-11 right-0 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50",
    statusItem: retro
      ? "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-cad-surface-2/50 uppercase tracking-wider"
      : "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700",
    panic: retro
      ? `flex items-center justify-center w-10 h-9 text-xs font-bold uppercase transition-colors border border-red-500/50 ${isPanic ? "bg-red-500 text-white animate-pulse" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`
      : `flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold transition-colors ${isPanic ? "bg-red-500 text-white animate-pulse" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`,
    clockOut: retro
      ? "flex items-center gap-1.5 px-3 h-9 text-xs font-bold uppercase tracking-wider text-cad-muted hover:text-cad-text transition-colors"
      : "flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors",
    unitText: retro ? "font-bold text-cad-text text-xs hover:text-cad-accent transition-colors uppercase tracking-wider" : "font-mono font-semibold text-white text-sm hover:text-blue-400 transition-colors",
    camIcon: retro ? "text-cad-dim" : "text-slate-500",
  };

  return (
    <div className={c.bar}>
      {/* Logo */}
      <div ref={logoRef} className="relative">
        <button onClick={() => setLogoMenu(!logoMenu)} className={c.logoBtn}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
          )}
        </button>
        {logoMenu && (
          <div className={c.menu}>
            <button onClick={() => handleLogoAction("fullscreen")} className={c.menuItem}><Maximize className="w-4 h-4" /> Full Screen</button>
            <button onClick={() => handleLogoAction("home")} className={c.menuItem}><Home className="w-4 h-4" /> Back to Departments</button>
            <button onClick={() => handleLogoAction("account")} className={c.menuItem}><UserCog className="w-4 h-4" /> My Account</button>
            <button onClick={() => handleLogoAction("keybinds")} className={c.menuItem}><Keyboard className="w-4 h-4" /> Keybinds</button>
            <div className={c.menuDiv} />
            <button onClick={() => handleLogoAction("logout")} className={`${c.menuItem} text-red-400`}><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        )}
      </div>

      {/* Nav Buttons */}
      <div className="flex items-center gap-1">
        {navButtons.map((v) => (
          <div key={v.id} className="relative">
            <button onClick={() => setActiveView(v.id)} className={c.navBtn(activeView === v.id)}>
              {retro && <span className="text-cad-dim">&gt;</span>}
              <v.icon className="w-4 h-4" />
              <span className="hidden sm:block">{v.label}</span>
              {v.hasDropdown && <ChevronDown className="w-3 h-3 opacity-50" />}
            </button>
          </div>
        ))}
      </div>

      <div className={c.divider} />

      {/* Unit Info */}
      <div className="hidden md:flex items-center gap-2 px-2">
        <Camera className={`w-4 h-4 ${c.camIcon}`} />
        <button onClick={() => setEditOpen(true)} className={c.unitText}>{session?.callsign || session?.user_name}</button>
        <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
      </div>

      {/* Status Badge */}
      <div ref={statusRef} className="relative ml-auto">
        <button onClick={() => setStatusMenu(!statusMenu)} className={c.statusBtn}>
          <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
          <span className="hidden sm:block">{retro ? `[${(session?.status || "AVAILABLE").toUpperCase()}]` : (session?.status || "AVAILABLE").toUpperCase()}</span>
          <ChevronUp className="w-3 h-3" />
        </button>
        {statusMenu && (
          <div className={c.statusMenu}>
            {statusOptions.map((s) => (
              <button key={s.value} onClick={() => { onStatusChange(s.value); setStatusMenu(false); }} className={`${c.statusItem} ${s.color}`}>
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {retro ? s.value.toUpperCase() : s.value}
              </button>
            ))}
            <div className={c.menuDiv} />
            <button onClick={() => { onPanic(); setStatusMenu(false); }} className={`${c.statusItem} font-bold ${isPanic ? "bg-red-500/20 text-red-400" : "text-red-400 hover:bg-red-500/10"}`}>
              <AlertTriangle className="w-4 h-4" />
              {isPanic ? "CANCEL PANIC" : "PANIC BUTTON"}
            </button>
          </div>
        )}
      </div>

      {/* Panic Quick Button */}
      <button onClick={onPanic} className={c.panic}>
        <AlertTriangle className="w-4 h-4" />
      </button>

      {/* Clock Out */}
      <button onClick={onClockOut} className={c.clockOut}>
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:block">{retro ? "LOGOUT" : "Clock Out"}</span>
      </button>
      <SessionEditDialog open={editOpen} onOpenChange={setEditOpen} session={session} onSaved={onSessionUpdate} />
    </div>
  );
}