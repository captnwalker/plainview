import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyTheme,
  persistTheme,
  readStoredTheme,
  systemTheme,
  type ThemePreference,
} from "@/lib/theme.ts";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(() =>
    typeof document === "undefined"
      ? "light"
      : document.documentElement.classList.contains("dark")
        ? "dark"
        : "light",
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = readStoredTheme() ?? systemTheme();
    setTheme(next);
    applyTheme(next);
    setReady(true);
  }, []);

  function toggle() {
    const next: ThemePreference = theme === "dark" ? "light" : "dark";
    setTheme(next);
    persistTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm text-ink transition-colors duration-150 hover:border-line-strong hover:bg-canvas-elevated"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun className="size-4" strokeWidth={1.75} /> : <Moon className="size-4" strokeWidth={1.75} />}
      <span className="hidden sm:inline">{ready && theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
