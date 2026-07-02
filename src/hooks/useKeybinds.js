import { useEffect } from "react";

const STORAGE_KEY = "ocrp_keybinds";

export const DEFAULT_KEYBINDS = {
  view_dispatch: "F1",
  view_lookups: "F2",
  view_records: "F3",
  view_mycall: "F4",
  view_groups: "F5",
  status_available: "1",
  status_busy: "2",
  status_oncall: "3",
  status_unavailable: "4",
  panic: "p",
};

export const KEYBIND_LABELS = {
  view_dispatch: "Dispatch View",
  view_lookups: "Lookups View",
  view_records: "Records View",
  view_mycall: "My Call View",
  view_groups: "Groups View",
  status_available: "Status: Available",
  status_busy: "Status: Busy",
  status_oncall: "Status: On Call",
  status_unavailable: "Status: Unavailable",
  panic: "Panic Button",
};

export function loadKeybinds() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_KEYBINDS, ...JSON.parse(saved) } : { ...DEFAULT_KEYBINDS };
  } catch {
    return { ...DEFAULT_KEYBINDS };
  }
}

export function saveKeybinds(keybinds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keybinds));
}

export function useKeybinds(keybinds, handlers) {
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      for (const [action, bind] of Object.entries(keybinds)) {
        if (bind && bind.toLowerCase() === key.toLowerCase()) {
          e.preventDefault();
          handlers[action]?.();
          break;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keybinds, handlers]);
}