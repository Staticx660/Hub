import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Keyboard, RotateCcw, Check } from "lucide-react";
import { DEFAULT_KEYBINDS, KEYBIND_LABELS, saveKeybinds } from "@/hooks/useKeybinds";

export default function KeybindsDialog({ open, onOpenChange, keybinds, setKeybinds }) {
  const [listening, setListening] = useState(null);

  const captureKey = (action) => {
    setListening(action);
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setListening(null);
        return;
      }
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) setListening(null); onOpenChange(v); }}>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2"><Keyboard className="w-5 h-5" /> Keybinds</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-400 mb-2">Click a key to rebind it, then press any key. Changes save automatically.</p>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {Object.entries(KEYBIND_LABELS).map(([action, label]) => (
            <div key={action} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-300">{label}</span>
              <button
                onClick={() => captureKey(action)}
                className={`min-w-[80px] px-3 py-1.5 rounded-md text-sm font-mono font-bold text-center transition-colors ${
                  listening === action
                    ? "bg-blue-500 text-white animate-pulse"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                {listening === action ? "Press key..." : keybinds[action] || "—"}
              </button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={reset} className="border-slate-700 text-slate-300 gap-2"><RotateCcw className="w-4 h-4" /> Reset to Defaults</Button>
          <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-700 gap-2"><Check className="w-4 h-4" /> Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}