import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Keyboard, RotateCcw, Check } from "lucide-react";
import { DEFAULT_KEYBINDS, KEYBIND_LABELS, saveKeybinds } from "@/hooks/useKeybinds";

export default function KeybindConfig() {
  const [keybinds, setKeybinds] = useState(() => {
    try {
      const saved = localStorage.getItem("ocrp_keybinds");
      return saved ? { ...DEFAULT_KEYBINDS, ...JSON.parse(saved) } : { ...DEFAULT_KEYBINDS };
    } catch { return { ...DEFAULT_KEYBINDS }; }
  });
  const [listening, setListening] = useState(null);

  const captureKey = (action) => {
    setListening(action);
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") { setListening(null); return; }
      const newKeybinds = { ...keybinds, [action]: e.key };
      setKeybinds(newKeybinds);
      saveKeybinds(newKeybinds);
      setListening(null);
      window.removeEventListener("keydown", handler, true);
    };
    window.addEventListener("keydown", handler, true);
  };

  const reset = () => {
    setKeybinds({ ...DEFAULT_KEYBINDS });
    saveKeybinds({ ...DEFAULT_KEYBINDS });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Keyboard className="w-6 h-6 text-cyan-400" /> Keybind Configuration</h1>
        <p className="text-sm text-slate-400 mt-1">Customize your keyboard shortcuts for the MDT. Click a key to rebind it, then press any key.</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="space-y-2 max-w-2xl">
          {Object.entries(KEYBIND_LABELS).map(([action, label]) => (
            <div key={action} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3">
              <span className="text-sm text-slate-300">{label}</span>
              <button
                onClick={() => captureKey(action)}
                className={`min-w-[90px] px-4 py-2 rounded-md text-sm font-mono font-bold text-center transition-colors ${
                  listening === action ? "bg-cyan-500 text-white animate-pulse" : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                {listening === action ? "Press key..." : keybinds[action] || "—"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={reset} variant="outline" className="border-slate-700 text-slate-300 gap-2"><RotateCcw className="w-4 h-4" /> Reset to Defaults</Button>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-2">Tips</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>• Keybinds are saved to your browser and apply only to this device.</li>
          <li>• Shortcuts are disabled while typing in input fields.</li>
          <li>• Modifier keys (Ctrl, Alt, Cmd) are ignored to prevent conflicts.</li>
          <li>• Press Escape while capturing to cancel without changing the keybind.</li>
        </ul>
      </div>
    </div>
  );
}