"use client";

import { createConfig, http } from "wagmi";
import { flare, flareTestnet } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

// Coston2 testnet configuration
export const coston2 = {
  id: 114,
  name: "Coston2",
  nativeCurrency: {
    decimals: 18,
    name: "Coston2 Flare",
    symbol: "C2FLR",
  },
  rpcUrls: {
    default: { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
    public: { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Coston2 Explorer", url: "https://coston2-explorer.flare.network" },
  },
  testnet: true,
} as const;

// WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";

export const wagmiConfig = createConfig({
  chains: [coston2, flare, flareTestnet],
  connectors: [
    injected(),
    walletConnect({ 
      projectId,
      metadata: {
        name: "AeroShield",
        description: "AI-Augmented Parametric Travel Insurance on Flare Network",
        url: "https://aeroshield.io",
        icons: ["https://aeroshield.io/logo.png"],
      },
    }),
    coinbaseWallet({ 
      appName: "AeroShield",
      appLogoUrl: "https://aeroshield.io/logo.png",
    }),
  ],
  transports: {
    [coston2.id]: http(),
    [flare.id]: http(),
    [flareTestnet.id]: http(),
  },
});

// Contract addresses for different networks
export const contractAddresses = {
  // Coston2 Testnet
  114: {
    insurancePool: process.env.NEXT_PUBLIC_INSURANCE_POOL_ADDRESS || "",
    policyManager: process.env.NEXT_PUBLIC_POLICY_MANAGER_ADDRESS || "",
    claimProcessor: process.env.NEXT_PUBLIC_CLAIM_PROCESSOR_ADDRESS || "",
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
    fdc: "0x...", // Flare Data Connector
    ftso: "0x...", // FTSO v2
  },
  // Flare Mainnet
  14: {
    insurancePool: "",
    policyManager: "",
    claimProcessor: "",
    usdc: "",
    fdc: "",
    ftso: "",
  },
};

// ABI snippets for contract interactions
export const InsurancePoolABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getPoolStats",
    outputs: [
      {
        components: [
          { name: "totalDeposits", type: "uint256" },
          { name: "totalPremiums", type: "uint256" },
          { name: "totalPayouts", type: "uint256" },
          { name: "reserveRatio", type: "uint256" },
          { name: "utilizationRate", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "lpAddress", type: "address" }],
    name: "getLPInfo",
    outputs: [
      { name: "depositAmount", type: "uint256" },
      { name: "shareBalance", type: "uint256" },
      { name: "currentValue", type: "uint256" },
      { name: "earnedYield", type: "uint256" },
      { name: "claimableYield", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const PolicyManagerABI = [
  {
    inputs: [
      {
        components: [
          { name: "flightNumber", type: "string" },
          { name: "departureTime", type: "uint64" },
          { name: "arrivalTime", type: "uint64" },
          { name: "coverageAmount", type: "uint256" },
          { name: "delay1hPayout", type: "uint16" },
          { name: "delay2hPayout", type: "uint16" },
          { name: "delay4hPayout", type: "uint16" },
          { name: "cancellationPayout", type: "uint16" },
        ],
        name: "params",
        type: "tuple",
      },
      { name: "premium", type: "uint256" },
      { name: "aiRiskScore", type: "uint8" },
    ],
    name: "createPolicy",
    outputs: [{ name: "policyId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "policyId", type: "bytes32" }],
    name: "getPolicy",
    outputs: [
      {
        components: [
          { name: "policyId", type: "bytes32" },
          { name: "holder", type: "address" },
          { name: "flightNumber", type: "string" },
          { name: "departureTime", type: "uint64" },
          { name: "arrivalTime", type: "uint64" },
          { name: "coverageAmount", type: "uint256" },
          { name: "premiumPaid", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "delay1hPayout", type: "uint16" },
          { name: "delay2hPayout", type: "uint16" },
          { name: "delay4hPayout", type: "uint16" },
          { name: "cancellationPayout", type: "uint16" },
          { name: "createdAt", type: "uint256" },
          { name: "claimAmount", type: "uint256" },
          { name: "attestationId", type: "bytes32" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserPolicies",
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
