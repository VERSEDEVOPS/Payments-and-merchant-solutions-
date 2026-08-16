import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemedToaster } from "./components/ThemedToaster";
import { wagmiConfig } from "./lib/appkit";
import { initAnalytics } from "./lib/analytics";
import { applyTheme, readThemePreference } from "./lib/theme";
import "./styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
});

initAnalytics();
applyTheme(readThemePreference());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <ThemedToaster />
          </BrowserRouter>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  </StrictMode>,
);
