/**
 * UI theme system — purely visual. Each theme is a set of HSL token values
 * that override the design tokens defined in src/index.css. No backend,
 * data, or layout behavior changes between themes.
 */

const STORAGE_KEY = "cad_ui_theme";

export const THEMES = [
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Flat graphite workstation with a single teal accent.",
    swatch: ["#1a1e1f", "#2b3132", "#14b8a6"],
    radius: "0.125rem",
    tokens: {
      bg: "200 9% 11%",
      surface: "203 9% 15%",
      "surface-2": "200 9% 18%",
      "surface-3": "202 9% 22%",
      "surface-4": "202 9% 27%",
      line: "202 9% 25%",
      "line-2": "202 9% 32%",
      text: "204 17% 89%",
      muted: "204 10% 72%",
      dim: "204 8% 55%",
      accent: "173 80% 40%",
    },
  },
  {
    id: "la",
    name: "LA Style",
    description: "Deep midnight navy with a bright patrol-blue accent.",
    swatch: ["#0d1526", "#1b2740", "#3b82f6"],
    radius: "0.375rem",
    tokens: {
      bg: "220 45% 8%",
      surface: "220 38% 12%",
      "surface-2": "220 34% 16%",
      "surface-3": "220 30% 21%",
      "surface-4": "220 28% 27%",
      line: "220 28% 24%",
      "line-2": "220 26% 33%",
      text: "213 32% 93%",
      muted: "215 20% 76%",
      dim: "215 16% 58%",
      accent: "217 91% 60%",
    },
  },
  {
    id: "pa",
    name: "PA Style",
    description: "Charcoal state-trooper look with a gold accent.",
    swatch: ["#16181c", "#2a2d34", "#d4a017"],
    radius: "0rem",
    tokens: {
      bg: "225 8% 10%",
      surface: "225 8% 14%",
      "surface-2": "225 8% 17%",
      "surface-3": "225 7% 21%",
      "surface-4": "225 7% 26%",
      line: "225 7% 24%",
      "line-2": "225 7% 31%",
      text: "40 12% 91%",
      muted: "40 8% 74%",
      dim: "40 6% 56%",
      accent: "42 82% 46%",
    },
  },
];

export const DEFAULT_THEME_ID = "enterprise";

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function getStoredThemeId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

/** Writes a theme's tokens onto :root so every mdt-* / cad-* class follows it. */
export function applyTheme(id) {
  const theme = getTheme(id);
  const root = document.documentElement;
  const t = theme.tokens;

  // MDT design language tokens
  Object.entries(t).forEach(([key, value]) => {
    root.style.setProperty(`--mdt-${key}`, value);
  });

  // CAD tokens mirror the same palette so legacy CAD surfaces stay in sync
  root.style.setProperty("--cad-bg", t.bg);
  root.style.setProperty("--cad-bg-solid", t.bg);
  root.style.setProperty("--cad-surface", t.surface);
  root.style.setProperty("--cad-surface-2", t["surface-2"]);
  root.style.setProperty("--cad-surface-3", t["surface-3"]);
  root.style.setProperty("--cad-border", t.line);
  root.style.setProperty("--cad-border-light", t["line-2"]);
  root.style.setProperty("--cad-text", t.text);
  root.style.setProperty("--cad-text-muted", t.muted);
  root.style.setProperty("--cad-text-dim", t.dim);
  root.style.setProperty("--cad-accent", t.accent);
  root.style.setProperty("--cad-accent-soft", t.accent);
  root.style.setProperty("--cad-radius", theme.radius);

  return theme;
}

export function setStoredTheme(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch { /* storage unavailable */ }
  applyTheme(id);
  window.dispatchEvent(new CustomEvent("cad-theme-change", { detail: id }));
}