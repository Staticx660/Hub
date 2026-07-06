import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getBranding } from "@/hooks/useCommunityBranding";
import { Shield, Search, FileText, Radio, Layers, Maximize, Home, UserCog, Keyboard, LogOut, ChevronUp, AlertTriangle, Users, Archive, Camera, ChevronDown, ClipboardList } from "lucide-react";

const statusOptions = [
  { value: "Available", color: "text-green-400", bg: "bg-green-500/15", dot: "bg-green-400" },
  { value: "Busy", color: "text-yellow-400", bg: "bg-yellow-500/15", dot: "bg-yellow-400" },
  { value: "On Call", color: "text-red-400", bg: "bg-red-500/15", dot: "bg-red-400" },
  { value: "Unavailable", color: "text-gray-400", bg: "bg-gray-500/15", dot: "bg-gray-400" },
];

export default function Taskbar({ activeView, setActiveView, session, departmentCategory, onStatusChange, onPanic, onClockOut, onOpenKeybinds }) {
  const category = departmentCategory || "Police";
  const isFire = category === "Fire";
  const isMedical = category === "EMS" || isFire;
  const isDispatch = category === "Dispatch";
  const [logoMenu, setLogoMenu] = useState(false);
  const [statusMenu, setStatusMenu] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const logoRef = useRef(null);
  const statusRef = useRef(null);
  const navigate = useNavigate();

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
        { id: "lookups", label: "Lookup", icon: Search, hasDropdown: true },
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
        { id: "lookups", label: "Lookup", icon: Search, hasDropdown: true },
        { id: "records", label: "Records", icon: FileText, hasDropdown: true },
        { id: "mycall", label: "My Call", icon: Shield, hasDropdown: false },
        { id: "groups", label: "Groups", icon: Layers, hasDropdown: false },
        { id: "dispatch", label: "Self Dispatch", icon: Radio, hasDropdown: false },
      ];

  const lookupTypes = [
    { label: "Person", icon: Users },
    { label: "Vehicle", icon: Radio },
    { label: "Firearm", icon: Shield },
  ];

  return (
    <div className={`h-14 bg-[#131519] border-t border-[#2c2f36] flex items-center px-2 gap-1 ${isPanic ? "border-red-500 animate-pulse" : ""}`}>
      {/* Logo */}
      <div ref={logoRef} className="relative">
        <button onClick={() => setLogoMenu(!logoMenu)} className="flex items-center gap-2 px-2 h-10 rounded-lg hover:bg-slate-800 transition-colors">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
          )}
        </button>
        {logoMenu && (
          <div className="absolute bottom-11 left-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
            <button onClick={() => handleLogoAction("fullscreen")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><Maximize className="w-4 h-4" /> Full Screen</button>
            <button onClick={() => handleLogoAction("home")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><Home className="w-4 h-4" /> Back to Departments</button>
            <button onClick={() => handleLogoAction("account")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><UserCog className="w-4 h-4" /> My Account</button>
            <button onClick={() => handleLogoAction("keybinds")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><Keyboard className="w-4 h-4" /> Keybinds</button>
            <button onClick={() => navigate("/my-records")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><FileText className="w-4 h-4" /> My Records</button>
            <button onClick={() => navigate("/civilian-dashboard")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><Users className="w-4 h-4" /> Civilian Dashboard</button>
            <button onClick={() => navigate("/department-archive")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><Archive className="w-4 h-4" /> Department Archive</button>
            <div className="border-t border-slate-700 my-1" />
            <button onClick={() => handleLogoAction("logout")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        )}
      </div>

      {/* Nav Buttons */}
      <div className="flex items-center gap-1">
        {navButtons.map((v) => (
          <div key={v.id} className="relative">
            <button onClick={() => setActiveView(v.id)} className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeView === v.id ? `bg-slate-800 text-white ${activeGlow}` : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <v.icon className="w-4 h-4" />
              <span className="hidden sm:block">{v.label}</span>
              {v.hasDropdown && <ChevronDown className="w-3 h-3 opacity-50" />}
            </button>
            {v.id === "lookups" && v.hasDropdown && activeView === "lookups" && (
              <div className="absolute bottom-11 left-0 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                {lookupTypes.map(lt => (
                  <button key={lt.label} onClick={() => setActiveView("lookups")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><lt.icon className="w-3.5 h-3.5" /> {lt.label}</button>
                ))}
              </div>
            )}
          </div>
        ))}

      </div>

      <div className="w-px h-7 bg-[#2c2f36] mx-1" />

      {/* Unit Info */}
      <div className="hidden md:flex items-center gap-2 px-2">
        <Camera className="w-4 h-4 text-slate-500" />
        <span className="font-mono font-semibold text-white text-sm">{session?.callsign || session?.user_name}</span>
        <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
      </div>

      {/* Status Badge */}
      <div ref={statusRef} className="relative">
        <button onClick={() => setStatusMenu(!statusMenu)} className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold transition-colors ${currentStatus.bg} ${currentStatus.color}`}>
          <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
          <span className="hidden sm:block">{(session?.status || "AVAILABLE").toUpperCase()}</span>
          <ChevronUp className="w-3 h-3" />
        </button>
        {statusMenu && (
          <div className="absolute bottom-11 right-0 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
            {statusOptions.map((s) => (
              <button key={s.value} onClick={() => { onStatusChange(s.value); setStatusMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700 ${s.color}`}>
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.value}
              </button>
            ))}
            <div className="border-t border-slate-700 my-1" />
            <button onClick={() => { onPanic(); setStatusMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-bold ${isPanic ? "bg-red-500/20 text-red-400" : "text-red-400 hover:bg-red-500/10"}`}>
              <AlertTriangle className="w-4 h-4" />
              {isPanic ? "CANCEL PANIC" : "PANIC BUTTON"}
            </button>
          </div>
        )}
      </div>

      {/* Panic Quick Button */}
      <button onClick={onPanic} className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold transition-colors ${isPanic ? "bg-red-500 text-white animate-pulse" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
        <AlertTriangle className="w-4 h-4" />
      </button>

      {/* Clock Out */}
      <button onClick={onClockOut} className="flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:block">Clock Out</span>
      </button>
    </div>
  );
}