import { Palette } from "lucide-react";
import ThemeSelector from "@/components/cad/ThemeSelector";
import DiscordLinker from "@/components/cad/DiscordLinker";

export default function CADSettings() {
  return (
    <div className="space-y-6 cad-font">
      <div>
        <h1 className="text-2xl font-bold text-cad-text flex items-center gap-2"><Palette className="w-6 h-6 text-cad-accent" /> CAD Settings</h1>
        <p className="text-sm text-cad-muted mt-1">Manage your CAD appearance and Discord account link</p>
      </div>
      <DiscordLinker />
      <ThemeSelector />
    </div>
  );
}