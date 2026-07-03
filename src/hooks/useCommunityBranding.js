import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

function hexToHsl(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

let cached = null;

export function useCommunityBranding() {
  useEffect(() => {
    const apply = async () => {
      try {
        if (cached) { applyBranding(cached); return; }
        const list = await base44.entities.CommunitySetting.list();
        if (list.length > 0) {
          cached = list[0];
          applyBranding(cached);
        }
      } catch (e) { /* silent */ }
    };
    apply();
  }, []);
}

function applyBranding(setting) {
  const root = document.documentElement;
  if (setting.accent_color) {
    const hsl = hexToHsl(setting.accent_color);
    root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty("--primary-foreground", "0 0% 100%");
    root.style.setProperty("--ring", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty("--community-accent", setting.accent_color);
  }
  if (setting.community_name) {
    document.title = `${setting.community_name} — CAD System`;
  }
}

export function getBranding() { return cached; }