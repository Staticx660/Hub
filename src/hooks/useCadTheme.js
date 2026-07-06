import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "rpc-cad-theme";
const DEFAULT_THEME = "dark-modern";
const VALID_THEMES = ["dark-modern", "retro"];

let currentTheme = null;
const listeners = new Set();

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_THEMES.includes(stored)) return stored;
  } catch (e) {}
  return DEFAULT_THEME;
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-cad-theme", theme);
}

// Initialize immediately on module load to prevent flash
if (typeof window !== "undefined" && !currentTheme) {
  currentTheme = getStoredTheme();
  applyTheme(currentTheme);
}

export function useCadTheme() {
  const [theme, setThemeState] = useState(currentTheme || getStoredTheme());

  useEffect(() => {
    if (!currentTheme) {
      currentTheme = getStoredTheme();
      applyTheme(currentTheme);
    }
    const listener = (t) => setThemeState(t);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    currentTheme = newTheme;
    applyTheme(newTheme);
    try { localStorage.setItem(STORAGE_KEY, newTheme); } catch (e) {}
    listeners.forEach(fn => fn(newTheme));
    // Persist to user profile so it's per-account, not per-browser
    try { base44.auth.updateMe({ cad_theme: newTheme }); } catch (e) {}
  }, []);

  return { theme, setTheme };
}

// Called after login to load the user's saved theme from their profile
export function syncThemeFromUser(user) {
  if (!user || !user.cad_theme || !VALID_THEMES.includes(user.cad_theme)) return;
  if (currentTheme === user.cad_theme) return;
  currentTheme = user.cad_theme;
  applyTheme(user.cad_theme);
  try { localStorage.setItem(STORAGE_KEY, user.cad_theme); } catch (e) {}
  listeners.forEach(fn => fn(user.cad_theme));
}

export const CAD_THEMES = [
  { id: "dark-modern", label: "Dark Modern" },
  { id: "retro", label: "Retro Terminal" },
];