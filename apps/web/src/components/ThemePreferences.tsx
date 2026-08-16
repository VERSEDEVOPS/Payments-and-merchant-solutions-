import * as Dialog from "@radix-ui/react-dialog";
import { Check, Monitor, Moon, Sun, X } from "lucide-react";
import { useTheme } from "./useTheme";
import type { ThemePreference } from "../lib/theme";

const choices: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof Moon;
}> = [
  { value: "dark", label: "Dark", description: "Low-light interface", icon: Moon },
  { value: "light", label: "Light", description: "Bright interface", icon: Sun },
  { value: "system", label: "System", description: "Match your device", icon: Monitor },
];

export function ThemePreferences() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const ActiveThemeIcon = resolvedTheme === "dark" ? Moon : Sun;
  const activeChoice = choices.find((choice) => choice.value === preference) ?? choices[2];

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="preferences-trigger" type="button" aria-label="Open preferences" title="Preferences">
          <ActiveThemeIcon size={16} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay preferences-overlay" />
        <Dialog.Content className="dialog-content preferences-dialog">
          <div className="preferences-topbar">
            <span className="preferences-eyebrow">
              <ActiveThemeIcon size={14} aria-hidden="true" />
              Display
            </span>
            <Dialog.Close className="preferences-close" aria-label="Close preferences">
              <X size={17} />
            </Dialog.Close>
          </div>

          <div className="preferences-heading">
            <Dialog.Title>Choose an appearance</Dialog.Title>
            <Dialog.Description>Set how VerseTip looks on this device.</Dialog.Description>
          </div>

          <section className="appearance-settings" aria-label="Appearance">
            <div className="theme-options" role="radiogroup" aria-label="Color theme">
              {choices.map((choice) => {
                const Icon = choice.icon;
                const selected = preference === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    className={`theme-option${selected ? " selected" : ""}`}
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${choice.label}: ${choice.description}`}
                    onClick={() => setPreference(choice.value)}
                  >
                    <span className="theme-option-icon"><Icon size={18} /></span>
                    <span className="theme-option-copy">
                      <strong>{choice.label}</strong>
                      <small>{choice.description}</small>
                    </span>
                    <span className="theme-option-check" aria-hidden="true">
                      {selected && <Check size={13} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="theme-status" aria-live="polite">
            <span className="theme-status-dot" aria-hidden="true" />
            <span>
              <strong>{preference === "system" ? "Following your device" : `${activeChoice.label} selected`}</strong>
              <small>VerseTip is currently using {resolvedTheme} mode.</small>
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
