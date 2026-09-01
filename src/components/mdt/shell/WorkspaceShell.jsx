import React from "react";
import MDTShell from "@/components/mdt/shell/MDTShell";
import MetroShell from "@/components/mdt/shell/MetroShell";
import KeystoneShell from "@/components/mdt/shell/KeystoneShell";
import { useUITheme } from "@/hooks/useUITheme";
import { getTheme } from "@/lib/themes";

const SHELLS = {
  enterprise: MDTShell,
  metro: MetroShell,
  keystone: KeystoneShell,
};

/**
 * Renders the workspace chrome for the user's selected theme. Every shell
 * takes identical props, so pages stay layout-agnostic.
 */
export default function WorkspaceShell(props) {
  const { themeId } = useUITheme();
  const Shell = SHELLS[getTheme(themeId).layout] || MDTShell;
  return <Shell {...props} />;
}