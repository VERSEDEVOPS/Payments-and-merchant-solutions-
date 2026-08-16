import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyTheme,
  getSystemPrefersDark,
  persistThemePreference,
  readThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "../lib/theme";
import { setAppKitTheme } from "../lib/appkit";
import { ThemeContext, type ThemeContextValue } from "./theme-context";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(preference, getSystemPrefersDark()),
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => setResolvedTheme(applyTheme(preference));

    syncTheme();
    if (preference === "system") media.addEventListener("change", syncTheme);

    return () => media.removeEventListener("change", syncTheme);
  }, [preference]);

  useEffect(() => {
    setAppKitTheme(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference(nextPreference) {
        persistThemePreference(nextPreference);
        setPreferenceState(nextPreference);
      },
    }),
    [preference, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
