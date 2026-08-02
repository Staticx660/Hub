import { Palette } from "lucide-react";
import ThemeSelector from "@/components/cad/ThemeSelector";
import DiscordLinker from "@/components/cad/DiscordLinker";

export default function CADSettings() {
  return (
    <div className="mdt space-y-2.5 text-mdt-text">
      <div className="flex items-center gap-2 h-9 px-2.5 border border-mdt-line bg-mdt-surface-2">
        <Palette className="w-4 h-4 text-mdt-dim" />
        <span className="text-[12.5px] font-semibold">CAD Settings</span>
        <span className="text-[11px] text-mdt-dim truncate">Appearance and Discord account link</span>
      </div>
      <DiscordLinker />
      <ThemeSelector />
    </div>
  );
}