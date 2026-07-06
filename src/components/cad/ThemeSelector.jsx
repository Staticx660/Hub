import React from "react";
import { useCadTheme } from "@/hooks/useCadTheme";
import { Palette, Check, Moon, Terminal } from "lucide-react";

const THEMES = [
  {
    id: "dark-modern",
    label: "Dark Modern",
    description: "Sleek glassmorphism with vibrant accents",
    icon: Moon,
    preview: { bg: "#0a0e1a", surface: "#161b2e", accent: "#06b6d4", text: "#e2e8f0" },
  },
  {
    id: "retro",
    label: "Retro Terminal",
    description: "Classic CRT terminal with amber glow",
    icon: Terminal,
    preview: { bg: "#0d100a", surface: "#16190f", accent: "#f59e0b", text: "#a3b18a" },
  },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useCadTheme();

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <Palette className="w-4 h-4 text-purple-400" /> CAD Theme
      </h2>
      <p className="text-sm text-slate-400 mb-4">Choose the visual style for your CAD system</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                active ? "border-cyan-500 shadow-lg shadow-cyan-500/10" : "border-slate-700 hover:border-slate-600"
              }`}
              style={{
                background: t.preview.bg,
                fontFamily: t.id === "retro" ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: t.preview.accent + "20" }}>
                  <t.icon className="w-4 h-4" style={{ color: t.preview.accent }} />
                </div>
                <span className="font-semibold text-sm" style={{ color: t.preview.text }}>{t.label}</span>
                {active && (
                  <span className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: t.preview.accent + "20", color: t.preview.accent }}>
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <div className="rounded-lg p-3 mb-2" style={{ background: t.preview.surface }}>
                <div className="h-1.5 rounded-full mb-2" style={{ background: t.preview.accent, width: "40%" }} />
                <div className="h-1 rounded-full mb-1.5" style={{ background: t.preview.text + "20" }} />
                <div className="h-1 rounded-full" style={{ background: t.preview.text + "10", width: "70%" }} />
              </div>
              <p className="text-xs" style={{ color: t.preview.text + "80" }}>{t.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}