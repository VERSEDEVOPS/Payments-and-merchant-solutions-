import { Toaster } from "sonner";
import { useTheme } from "./useTheme";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} position="bottom-right" />;
}
