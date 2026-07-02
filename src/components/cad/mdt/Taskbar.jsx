import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Shield, Search, FileText, Radio, Layers, Maximize, Home, UserCog, Keyboard, LogOut, ChevronUp, AlertTriangle } from "lucide-react";

const statusOptions = [
  { value: "Available", color: "text-green-400", bg: "bg-green-500/15", dot: "bg-green-400" },
  { value: "Busy", color: "text-yellow-400", bg: "bg-yellow-500/15", dot: "bg-yellow-400" },
  { value: "On Call", color: "text-red-400", bg: "bg-red-500/15", dot: "bg-red-400" },
  { value: "Unavailable", color: "text-gray-400", bg: "bg-gray-500/15", dot: "bg-gray-400" },
];

export default function Taskbar({ activeView, setActiveView, session, onStatusChange, onPanic, onClockOut }) {
  const [logoMenu, setLogoMenu] = useState(false);
  const [statusMenu, setStatusMenu] = useState(false);
  const logoRef = useRef(null);
  const statusRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (logoRef.current && !logoRef.current.contains(e.target)) setLogoMenu(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const views = [
    { id: "dispatch", label: "Dispatch", icon: Radio },
    { id: "lookups", label: "Lookups", icon: Search },
    { id: "records", label: "Records", icon: FileText },
    { id: "mycall", label: "My Call", icon: Shield },
    { id: "groups", label: "Groups", icon: Layers },
  ];

  const currentStatus = statusOptions.find((s) => s.value === session?.status) || statusOptions[0];
  const isPanic = session?.panic_active;

  const handleLogoAction = (action) => {
    setLogoMenu(false);
    switch (action) {
      case "fullscreen": document.documentElement.requestFullscreen?.(); break;
      case "home": navigate("/"); break;
      case "account": navigate("/settings"); break;
      case "keybinds": break;
      case "logout": base44.auth.logout("/login"); break;
    }
  };

  return (
    <div className={`h-14 bg-slate-900/95 backdrop-blur border-t flex items-center px-2 gap-1 ${isPanic ? "border-red-500 animate-pulse" : "border-slate-700/50"}`}>
      <div ref={logoRef} className="relative">
        <button onClick={() => setLogoMenu(!logoMenu)} className="flex items-center gap-2 px-2.5 h-10 rounded-lg hover:bg-slate-800 transition-colors">
          <img src="https://media.base44.com/images/public/6a441f279b9d3cd678958799/5a43a1b46_OCRP20.png" alt="OCRP" className="w-8 h-8 rounded object-cover" />
          <span className="font-bold text-white text-sm hidden sm:block">OCRP</span>
        </button>
        {logoMenu && (
          <div className="absolute bottom-12 left-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
            <button onClick={() => handleLogoAction("fullscreen")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><Maximize className="w-4 h-4" /> Full Screen</button>
            <button onClick={() => handleLogoAction("home")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><Home className="w-4 h-4" /> Community Home</button>
            <button onClick={() => handleLogoAction("account")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><UserCog className="w-4 h-4" /> My Account</button>
            <button onClick={() => handleLogoAction("keybinds")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"><Keyboard className="w-4 h-4" /> Keybinds</button>
            <div className="border-t border-slate-700 my-1" />
            <button onClick={() => handleLogoAction("logout")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        )}
      </div>

      <div className="w-px h-8 bg-slate-700 mx-1" />

      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {views.map((v) => (
          <button key={v.id} onClick={() => setActiveView(v.id)} className={`flex items-center gap-2 px-3 h-10 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeView === v.id ? "bg-blue-500/20 text-blue-400 shadow-inner shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <v.icon className="w-4 h-4" />
            <span className="hidden sm:block">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-2 px-3 text-sm border-l border-slate-700">
        {session?.rank && <span className="text-slate-500">{session.rank}</span>}
        <span className="font-mono font-semibold text-white">{session?.callsign || session?.user_name}</span>
      </div>

      <div ref={statusRef} className="relative">
        <button onClick={() => setStatusMenu(!statusMenu)} className={`flex items-center gap-2 px-3 h-10 rounded-lg text-sm font-medium transition-colors ${currentStatus.bg} ${currentStatus.color}`}>
          <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
          <span className="hidden sm:block">{session?.status || "Available"}</span>
          <ChevronUp className="w-3 h-3" />
        </button>
        {statusMenu && (
          <div className="absolute bottom-12 right-0 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
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

      <button onClick={onPanic} className={`flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-bold transition-colors ${isPanic ? "bg-red-500 text-white animate-pulse" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
        <AlertTriangle className="w-4 h-4" />
        <span className="hidden sm:block">{isPanic ? "CANCEL" : "PANIC"}</span>
      </button>

      <button onClick={onClockOut} className="flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:block">Clock Out</span>
      </button>
    </div>
  );
}