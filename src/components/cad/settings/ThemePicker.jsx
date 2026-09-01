import React from "react";
import { Check } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { useUITheme } from "@/hooks/useUITheme";
import { Panel } from "@/components/mdt/ui/primitives";

/** Visual theme selector — changes look only, never data or behavior. */
export default function ThemePicker() {
  const { themeId, setTheme } = useUITheme();

  return (
    <Panel title="Interface Theme & Layout" scroll={false}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-mdt-line">
        {THEMES.map((theme) => {
          const on = theme.id === themeId;
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`text-left p-3 bg-mdt-surface hover:bg-mdt-surface-2 ${on ? "outline outline-1 -outline-offset-1 outline-mdt-accent" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-mdt-text">{theme.name}</span>
                {on && <Check className="w-3.5 h-3.5 text-mdt-accent flex-shrink-0" />}
              </div>
              <div className="flex gap-1 mt-2">
                {theme.swatch.map((c) => (
                  <span key={c} className="w-6 h-4 border border-mdt-line-2" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-[10.5px] text-mdt-dim mt-2 leading-snug">{theme.description}</p>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}