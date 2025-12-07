"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { useState, type ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";

// Define Flare Coston2 Testnet
const flareCoston2 = defineChain({
  id: 114,
  name: "Flare Coston2",
  nativeCurrency: {
    name: "Coston2 Flare",
    symbol: "C2FLR",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Coston2 Explorer", url: "https://coston2-explorer.flare.network" },
  },
  testnet: true,
});

// Define Flare Mainnet
const flare = defineChain({
  id: 14,
  name: "Flare",
  nativeCurrency: {
    name: "Flare",
    symbol: "FLR",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://flare-api.flare.network/ext/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Flare Explorer", url: "https://flare-explorer.flare.network" },
  },
});

// Wagmi config for Flare Network
const config = createConfig({
  chains: [flareCoston2, flare],
  transports: {
    [flareCoston2.id]: http("https://coston2-api.flare.network/ext/C/rpc"),
    [flare.id]: http("https://flare-api.flare.network/ext/C/rpc"),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#E8356D",
            accentColorForeground: "white",
            borderRadius: "large",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
