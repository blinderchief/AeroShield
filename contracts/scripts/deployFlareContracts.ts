import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy Flare-specific contracts (FTSOv2Consumer, FDCFlightVerifier)
 * This script can be run independently or as part of the main deployment
 */

interface FlareDeploymentAddresses {
  network: string;
  chainId: number;
  deployer: string;
  deployedAt: string;
  contracts: {
    ftsoV2Consumer: string;
    fdcFlightVerifier: string;
  };
  systemContracts: {
    contractRegistry: string;
    fdcHub: string;
  };
}

// Flare Network System Contract Addresses
const SYSTEM_CONTRACTS = {
  // Coston2 Testnet
  114: {
    ContractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
    FdcHub: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b",
  },
  // Flare Mainnet
  14: {
    ContractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
    FdcHub: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b",
  },
};

async function main() {
  console.log("🌐 Deploying Flare-specific contracts...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log(`📍 Network: ${network.name} (Chain ID: ${chainId})`);
  console.log(`👛 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} FLR\n`);

  // Verify we're on a Flare network
  if (chainId !== 114 && chainId !== 14 && chainId !== 31337) {
    console.log("⚠️  Warning: Not on a Flare network. Contract functionality may be limited.\n");
  }

  const systemAddresses = SYSTEM_CONTRACTS[chainId as keyof typeof SYSTEM_CONTRACTS] || SYSTEM_CONTRACTS[114];

  const addresses: FlareDeploymentAddresses = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      ftsoV2Consumer: "",
      fdcFlightVerifier: "",
    },
    systemContracts: systemAddresses,
  };

  // Deploy FTSOv2Consumer
  console.log("📦 Deploying FTSOv2Consumer...");
  const FTSOv2Consumer = await ethers.getContractFactory("FTSOv2Consumer");
  const ftsoV2Consumer = await FTSOv2Consumer.deploy();
  await ftsoV2Consumer.waitForDeployment();
  addresses.contracts.ftsoV2Consumer = await ftsoV2Consumer.getAddress();
  console.log(`  ✅ FTSOv2Consumer deployed: ${addresses.contracts.ftsoV2Consumer}`);

  // Deploy FDCFlightVerifier
  console.log("📦 Deploying FDCFlightVerifier...");
  const FDCFlightVerifier = await ethers.getContractFactory("FDCFlightVerifier");
  const fdcFlightVerifier = await FDCFlightVerifier.deploy();
  await fdcFlightVerifier.waitForDeployment();
  addresses.contracts.fdcFlightVerifier = await fdcFlightVerifier.getAddress();
  console.log(`  ✅ FDCFlightVerifier deployed: ${addresses.contracts.fdcFlightVerifier}`);

  // Test FTSO connection if on Flare network
  if (chainId === 114 || chainId === 14) {
    console.log("\n🔍 Testing Flare contract connections...");
    
    try {
      // Test FTSOv2Consumer
      const flrUsdFeedId = "0x01464c522f55534400000000000000000000000000";
      const price = await ftsoV2Consumer.getFeedValue(flrUsdFeedId);
      console.log(`  ✅ FTSOv2 Connected - FLR/USD Price: $${ethers.formatUnits(price[0], Number(price[1]))}`);
    } catch (error: any) {
      console.log(`  ⚠️  FTSOv2 test failed: ${error.message}`);
    }
  }

  console.log("\n✅ Flare contracts deployment complete!\n");

  // Save deployment addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `flare-contracts-${chainId}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(addresses, null, 2));
  console.log(`📄 Deployment saved: ${filepath}`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 FLARE CONTRACTS DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network:             ${network.name}`);
  console.log(`Chain ID:            ${chainId}`);
  console.log(`Deployer:            ${deployer.address}`);
  console.log("-".repeat(60));
  console.log("Deployed Contracts:");
  console.log(`  FTSOv2Consumer:    ${addresses.contracts.ftsoV2Consumer}`);
  console.log(`  FDCFlightVerifier: ${addresses.contracts.fdcFlightVerifier}`);
  console.log("-".repeat(60));
  console.log("System Contracts:");
  console.log(`  ContractRegistry:  ${systemAddresses.ContractRegistry}`);
  console.log(`  FDC Hub:           ${systemAddresses.FdcHub}`);
  console.log("=".repeat(60) + "\n");

  return addresses;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
