import { useState } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { DEFAULT_KEYBINDS, KEYBIND_LABELS, saveKeybinds } from "@/hooks/useKeybinds";
import { Btn, Panel } from "@/components/mdt/ui/primitives";

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
    <div className="mdt space-y-2.5 text-mdt-text">
      <div className="flex items-center gap-2 h-9 px-2.5 border border-mdt-line bg-mdt-surface-2">
        <Keyboard className="w-4 h-4 text-mdt-dim" />
        <span className="text-[12.5px] font-semibold">Keybind Configuration</span>
        <span className="text-[11px] text-mdt-dim truncate">Click a binding, then press any key</span>
        <Btn icon={RotateCcw} className="ml-auto" onClick={reset}>Reset Defaults</Btn>
      </div>

      <Panel title="Bindings" scroll={false}>
        <div className="divide-y divide-mdt-line/60">
          {Object.entries(KEYBIND_LABELS).map(([action, label]) => (
            <div key={action} className="flex items-center gap-2 h-8 px-2.5">
              <span className="text-[12px] text-mdt-muted truncate">{label}</span>
              <button
                onClick={() => captureKey(action)}
                className={`ml-auto min-w-[76px] h-6 px-2 rounded-sm border text-[11.5px] font-mono font-semibold ${
                  listening === action
                    ? "bg-mdt-accent text-white border-mdt-accent animate-pulse"
                    : "bg-mdt-surface-3 text-mdt-text border-mdt-line-2 hover:bg-mdt-surface-4"
                }`}
              >
                {listening === action ? "Press key…" : keybinds[action] || "—"}
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Notes" scroll={false}>
        <ul className="p-2.5 space-y-1 text-[11.5px] text-mdt-dim">
          <li>Keybinds are stored on this device only.</li>
          <li>Shortcuts are disabled while typing in input fields.</li>
          <li>Modifier keys (Ctrl, Alt, Cmd) are ignored to prevent conflicts.</li>
          <li>Press Escape while capturing to cancel.</li>
        </ul>
      </Panel>
    </div>
  );
}