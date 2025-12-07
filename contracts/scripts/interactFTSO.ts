import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Interact with FTSOv2Consumer to get real-time price feeds from Flare Network
 * These prices can be used for dynamic premium calculation
 */

// Feed IDs for different price pairs (Flare FTSO v2)
const FEED_IDS = {
  "FLR/USD": "0x01464c522f55534400000000000000000000000000",
  "BTC/USD": "0x014254432f55534400000000000000000000000000",
  "ETH/USD": "0x014554482f55534400000000000000000000000000",
  "XRP/USD": "0x015852502f55534400000000000000000000000000",
  "DOGE/USD": "0x01444f47452f555344000000000000000000000000",
  "USDC/USD": "0x01555344432f555344000000000000000000000000",
  "USDT/USD": "0x01555344542f555344000000000000000000000000",
};

async function main() {
  console.log("📊 Fetching FTSO v2 Price Feeds...\n");

  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👛 Address: ${signer.address}\n`);

  // Load deployment address
  const deploymentsDir = path.join(__dirname, "../deployments");
  const latestFile = fs.readdirSync(deploymentsDir)
    .filter(f => f.includes("flare-contracts") || f.includes(network.name))
    .sort()
    .pop();

  if (!latestFile) {
    console.error("❌ No deployment found. Run deployFlareContracts.ts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestFile), "utf-8")
  );

  const ftsoAddress = deployment.contracts?.ftsoV2Consumer || deployment.contracts?.FTSOv2Consumer;
  if (!ftsoAddress) {
    console.error("❌ FTSOv2Consumer address not found in deployment.");
    process.exit(1);
  }

  console.log(`📄 Using FTSOv2Consumer at: ${ftsoAddress}\n`);

  // Get contract instance
  const FTSOv2Consumer = await ethers.getContractFactory("FTSOv2Consumer");
  const ftsoConsumer = FTSOv2Consumer.attach(ftsoAddress);

  console.log("=".repeat(60));
  console.log("💹 FTSO v2 PRICE FEEDS");
  console.log("=".repeat(60));

  // Fetch individual prices
  for (const [pair, feedId] of Object.entries(FEED_IDS)) {
    try {
      const [value, decimals, timestamp] = await ftsoConsumer.getFeedValue(feedId);
      const price = Number(value) / Math.pow(10, Number(decimals));
      const time = new Date(Number(timestamp) * 1000).toLocaleString();
      
      console.log(`${pair.padEnd(12)} $${price.toFixed(6).padStart(15)} | Updated: ${time}`);
    } catch (error: any) {
      console.log(`${pair.padEnd(12)} Error: ${error.message.slice(0, 40)}...`);
    }
  }

  console.log("=".repeat(60));

  // Fetch multiple prices at once
  console.log("\n📦 Fetching multiple prices in single call...\n");

  const feedIds = [FEED_IDS["FLR/USD"], FEED_IDS["BTC/USD"], FEED_IDS["ETH/USD"]];
  
  try {
    const results = await ftsoConsumer.getMultipleFeedValues(feedIds);
    
    console.log("Multi-fetch results:");
    const pairs = ["FLR/USD", "BTC/USD", "ETH/USD"];
    for (let i = 0; i < pairs.length; i++) {
      const price = Number(results[0][i]) / Math.pow(10, Number(results[1][i]));
      console.log(`  ${pairs[i]}: $${price.toFixed(6)}`);
    }
  } catch (error: any) {
    console.log(`Multi-fetch error: ${error.message}`);
  }

  // Test premium calculation
  console.log("\n💰 Testing Premium Calculation...\n");

  try {
    // Calculate premium for a $100 policy
    const baseAmount = ethers.parseUnits("100", 6); // $100 in 6 decimals
    const riskFactor = 150; // 1.5x risk multiplier (150 basis points)
    
    const premium = await ftsoConsumer.calculateInsurancePremium(
      baseAmount,
      riskFactor,
      FEED_IDS["FLR/USD"]
    );
    
    console.log(`Base Amount:     $100.00`);
    console.log(`Risk Factor:     1.5x`);
    console.log(`Calculated Premium: $${ethers.formatUnits(premium, 6)}`);
  } catch (error: any) {
    console.log(`Premium calculation error: ${error.message}`);
  }

  console.log("\n✅ FTSO v2 interaction complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
