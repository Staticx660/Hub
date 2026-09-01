import React from "react";
import MDTShell from "@/components/mdt/shell/MDTShell";
import MetroShell from "@/components/mdt/shell/MetroShell";
import KeystoneShell from "@/components/mdt/shell/KeystoneShell";
import { useUITheme } from "@/hooks/useUITheme";
import { getTheme, THEMES } from "@/lib/themes";

const SHELLS = {
  enterprise: MDTShell,
  metro: MetroShell,
  keystone: KeystoneShell,
};

/**
 * Renders the workspace chrome for the user's selected theme. Every shell
 * takes identical props, so pages stay layout-agnostic. A "Theme" menu group
 * is appended so units can switch look & layout without clocking out.
 */
export default function WorkspaceShell({ menus, ...props }) {
  const { themeId, setTheme } = useUITheme();
  const Shell = SHELLS[getTheme(themeId).layout] || MDTShell;

  const themeMenu = {
    label: "Theme",
    items: THEMES.map((t) => ({
      label: `${t.id === themeId ? "✓ " : ""}${t.name}`,
      disabled: t.id === themeId,
      onSelect: () => setTheme(t.id),
    })),
  };

  const withTheme = typeof menus === "function"
    ? (ctx) => [...menus(ctx), themeMenu]
    : [...(menus || []), themeMenu];

  return <Shell {...props} menus={withTheme} />;
}