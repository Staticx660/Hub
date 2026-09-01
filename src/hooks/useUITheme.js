import { useEffect, useState } from "react";
import { applyTheme, getStoredThemeId, setStoredTheme } from "@/lib/themes";

/** Applies the user's saved UI theme and keeps it in sync across the app. */
export function useUITheme() {
  const [themeId, setThemeId] = useState(getStoredThemeId);

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  useEffect(() => {
    const onChange = (e) => setThemeId(e.detail);
    window.addEventListener("cad-theme-change", onChange);
    return () => window.removeEventListener("cad-theme-change", onChange);
  }, []);

  return { themeId, setTheme: setStoredTheme };
}