import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet } from "viem/chains";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID;

if (!walletConnectProjectId) {
  throw new Error(
    "NEXT_PUBLIC_WALLET_CONNECT_ID is not set. Please add it to your .env.local file."
  );
}

export const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: walletConnectProjectId,
  chains: [mainnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
