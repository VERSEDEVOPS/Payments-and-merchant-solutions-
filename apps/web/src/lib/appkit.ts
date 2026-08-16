import { createAppKit } from "@reown/appkit/react";
import { polygon } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { POLYGON_RPC_URL, WALLETCONNECT_PROJECT_ID } from "./config";

const projectId = WALLETCONNECT_PROJECT_ID;
const metadata = {
  name: "VerseTip",
  description: "Support creators with fxVERSE on Polygon",
  url: typeof window === "undefined" ? "http://localhost" : window.location.origin,
  icons: [
    typeof window === "undefined"
      ? "http://localhost/versetip-mark.svg"
      : `${window.location.origin}/versetip-mark.svg`,
  ],
};
const customRpcUrls = {
  "eip155:137": [{ url: POLYGON_RPC_URL }],
};

export const wagmiAdapter = new WagmiAdapter({
  networks: [polygon],
  projectId,
  customRpcUrls,
});

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [polygon],
  defaultNetwork: polygon,
  projectId,
  metadata,
  customRpcUrls,
  features: {
    analytics: false,
    email: false,
    socials: false,
    onramp: false,
    swaps: false,
  },
  themeMode: "dark",
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export function setAppKitTheme(mode: "light" | "dark") {
  appKit.setThemeMode(mode);
}
