import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

// Use a valid dummy private key for local development (32 bytes hex)
const DUMMY_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const PRIVATE_KEY = process.env.PRIVATE_KEY || DUMMY_KEY;
const COSTON2_RPC = process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
const FLARE_RPC = process.env.FLARE_RPC_URL || "https://flare-api.flare.network/ext/C/rpc";
const FLARESCAN_API_KEY = process.env.FLARESCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.25",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    coston2: {
      url: COSTON2_RPC,
      chainId: 114,
      accounts: [PRIVATE_KEY],
      gasPrice: 25000000000, // 25 gwei
    },
    flare: {
      url: FLARE_RPC,
      chainId: 14,
      accounts: [PRIVATE_KEY],
      gasPrice: 25000000000, // 25 gwei
    },
  },
  etherscan: {
    apiKey: {
      coston2: FLARESCAN_API_KEY,
      flare: FLARESCAN_API_KEY,
    },
    customChains: [
      {
        network: "coston2",
        chainId: 114,
        urls: {
          apiURL: "https://coston2-explorer.flare.network/api",
          browserURL: "https://coston2-explorer.flare.network",
        },
      },
      {
        network: "flare",
        chainId: 14,
        urls: {
          apiURL: "https://flare-explorer.flare.network/api",
          browserURL: "https://flare-explorer.flare.network",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 25,
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
