import React from "react";
import { useCadTheme } from "@/hooks/useCadTheme";
import { Check, Moon, Terminal } from "lucide-react";
import { Panel, StatusPill } from "@/components/mdt/ui/primitives";

const THEMES = [
  { id: "dark-modern", label: "Enterprise Graphite", description: "Flat, dense operational interface", icon: Moon, accent: "#2ab5a4", bg: "#1a1d1f", surface: "#232729" },
  { id: "retro", label: "Retro Terminal", description: "Classic CRT terminal with amber glow", icon: Terminal, accent: "#f59e0b", bg: "#0d100a", surface: "#16190f" },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useCadTheme();

  return (
    <Panel title="CAD Theme" scroll={false}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-mdt-line">
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`text-left p-2.5 bg-mdt-surface hover:bg-mdt-surface-2 ${active ? "bg-mdt-surface-2" : ""}`}
              style={active ? { boxShadow: "inset 2px 0 0 hsl(var(--mdt-accent))" } : undefined}
            >
              <div className="flex items-center gap-2">
                <t.icon className="w-3.5 h-3.5 text-mdt-dim" />
                <span className="text-[12.5px] font-semibold text-mdt-text">{t.label}</span>
                {active && <StatusPill tone="ok" className="ml-auto"><Check className="w-2.5 h-2.5" /> Active</StatusPill>}
              </div>
              <div className="mt-2 border border-mdt-line" style={{ background: t.bg }}>
                <div className="h-4 border-b" style={{ background: t.surface, borderColor: "rgba(255,255,255,0.07)" }} />
                <div className="p-2 space-y-1">
                  <div className="h-1" style={{ background: t.accent, width: "40%" }} />
                  <div className="h-1" style={{ background: "rgba(255,255,255,0.15)" }} />
                  <div className="h-1" style={{ background: "rgba(255,255,255,0.09)", width: "70%" }} />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-mdt-dim">{t.description}</p>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}