import { useEffect, useState, useCallback } from "react";

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
  }, []);

  return { theme, setTheme };
}

export const CAD_THEMES = [
  { id: "dark-modern", label: "Dark Modern" },
  { id: "retro", label: "Retro Terminal" },
];