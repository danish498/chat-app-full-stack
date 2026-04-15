export type AccentTheme = {
  id: string;
  label: string;
  previewHex: string;
  // HSL triples WITHOUT the `hsl()` wrapper, compatible with shadcn CSS vars
  primary: string;
  primaryForeground: string;
  ring: string;
  accent: string;
  accentForeground: string;
};

const STORAGE_KEY = "accentThemeId";

export const ACCENT_THEMES: AccentTheme[] = [
  {
    id: "teal",
    label: "Teal",
    previewHex: "#14b8a6",
    primary: "174 100% 33%",
    primaryForeground: "0 0% 100%",
    ring: "174 100% 33%",
    accent: "174 100% 33%",
    accentForeground: "0 0% 100%",
  },
  {
    id: "indigo",
    label: "Indigo",
    previewHex: "#6366f1",
    primary: "239 84% 67%",
    primaryForeground: "0 0% 100%",
    ring: "239 84% 67%",
    accent: "239 84% 67%",
    accentForeground: "0 0% 100%",
  },
  {
    id: "rose",
    label: "Rose",
    previewHex: "#f43f5e",
    primary: "346 89% 60%",
    primaryForeground: "0 0% 100%",
    ring: "346 89% 60%",
    accent: "346 89% 60%",
    accentForeground: "0 0% 100%",
  },
  {
    id: "amber",
    label: "Amber",
    previewHex: "#f59e0b",
    primary: "38 92% 50%",
    primaryForeground: "240 10% 3.9%",
    ring: "38 92% 50%",
    accent: "38 92% 50%",
    accentForeground: "240 10% 3.9%",
  },
  {
    id: "lime",
    label: "Lime",
    previewHex: "#84cc16",
    primary: "84 81% 44%",
    primaryForeground: "240 10% 3.9%",
    ring: "84 81% 44%",
    accent: "84 81% 44%",
    accentForeground: "240 10% 3.9%",
  },
];

export function getStoredAccentThemeId(): string {
  if (typeof window === "undefined") return "teal";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v && ACCENT_THEMES.some((t) => t.id === v) ? v : "teal";
}

export function storeAccentThemeId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
}

export function applyAccentTheme(id: string) {
  if (typeof window === "undefined") return;
  const theme = ACCENT_THEMES.find((t) => t.id === id) ?? ACCENT_THEMES[0];
  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", theme.primaryForeground);
  root.style.setProperty("--ring", theme.ring);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-foreground", theme.accentForeground);
}

