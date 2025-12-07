import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

/**
 * Event Listener for AeroShield contracts
 * Listens to on-chain events and notifies the backend API
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

interface EventConfig {
  contractName: string;
  address: string;
  events: string[];
}

async function main() {
  console.log("🎧 Starting AeroShield Event Listener...\n");

  const network = await ethers.provider.getNetwork();
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Load deployment addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  const latestFile = fs.readdirSync(deploymentsDir)
    .filter(f => f.includes(`${network.name}-latest`) || f.includes("coston2-latest"))
    .pop();

  if (!latestFile) {
    console.error("❌ No deployment found. Deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestFile), "utf-8")
  );

  console.log(`📄 Loaded deployment: ${latestFile}\n`);

  // Get contract instances
  const PolicyManager = await ethers.getContractFactory("PolicyManager");
  const policyManager = PolicyManager.attach(deployment.contracts.policyManager);

  const ClaimProcessor = await ethers.getContractFactory("ClaimProcessor");
  const claimProcessor = ClaimProcessor.attach(deployment.contracts.claimProcessor);

  const InsurancePool = await ethers.getContractFactory("InsurancePool");
  const insurancePool = InsurancePool.attach(deployment.contracts.insurancePool);

  console.log("Listening to events from:");
  console.log(`  PolicyManager:  ${deployment.contracts.policyManager}`);
  console.log(`  ClaimProcessor: ${deployment.contracts.claimProcessor}`);
  console.log(`  InsurancePool:  ${deployment.contracts.insurancePool}`);
  console.log("\n" + "=".repeat(60) + "\n");

  // Policy Manager Events
  policyManager.on("PolicyCreated", async (policyId, holder, premium, coverage, event) => {
    console.log(`📋 PolicyCreated: #${policyId}`);
    console.log(`   Holder: ${holder}`);
    console.log(`   Premium: ${ethers.formatUnits(premium, 6)} USDC`);
    console.log(`   Coverage: ${ethers.formatUnits(coverage, 6)} USDC`);
    
    try {
      await axios.post(`${BACKEND_URL}/api/v1/webhooks/policy-created`, {
        policyId: policyId.toString(),
        holder,
        premium: premium.toString(),
        coverage: coverage.toString(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
      console.log("   ✅ Backend notified\n");
    } catch (error: any) {
      console.log(`   ⚠️ Backend notification failed: ${error.message}\n`);
    }
  });

  policyManager.on("PolicyActivated", async (policyId, flightNumber, departureTime, event) => {
    console.log(`✈️ PolicyActivated: #${policyId}`);
    console.log(`   Flight: ${flightNumber}`);
    console.log(`   Departure: ${new Date(Number(departureTime) * 1000).toISOString()}`);
    
    try {
      await axios.post(`${BACKEND_URL}/api/v1/webhooks/policy-activated`, {
        policyId: policyId.toString(),
        flightNumber,
        departureTime: departureTime.toString(),
        txHash: event.log.transactionHash,
      });
      console.log("   ✅ Backend notified\n");
    } catch (error: any) {
      console.log(`   ⚠️ Backend notification failed: ${error.message}\n`);
    }
  });

  // Claim Processor Events
  claimProcessor.on("ClaimSubmitted", async (claimId, policyId, amount, event) => {
    console.log(`📝 ClaimSubmitted: #${claimId}`);
    console.log(`   Policy: #${policyId}`);
    console.log(`   Amount: ${ethers.formatUnits(amount, 6)} USDC`);
    
    try {
      await axios.post(`${BACKEND_URL}/api/v1/webhooks/claim-submitted`, {
        claimId: claimId.toString(),
        policyId: policyId.toString(),
        amount: amount.toString(),
        txHash: event.log.transactionHash,
      });
      console.log("   ✅ Backend notified\n");
    } catch (error: any) {
      console.log(`   ⚠️ Backend notification failed: ${error.message}\n`);
    }
  });

  claimProcessor.on("ClaimProcessed", async (claimId, approved, payout, event) => {
    console.log(`${approved ? "✅" : "❌"} ClaimProcessed: #${claimId}`);
    console.log(`   Approved: ${approved}`);
    console.log(`   Payout: ${ethers.formatUnits(payout, 6)} USDC`);
    
    try {
      await axios.post(`${BACKEND_URL}/api/v1/webhooks/claim-processed`, {
        claimId: claimId.toString(),
        approved,
        payout: payout.toString(),
        txHash: event.log.transactionHash,
      });
      console.log("   ✅ Backend notified\n");
    } catch (error: any) {
      console.log(`   ⚠️ Backend notification failed: ${error.message}\n`);
    }
  });

  // Insurance Pool Events
  insurancePool.on("Deposited", async (provider, amount, shares, event) => {
    console.log(`💰 Deposited: ${ethers.formatUnits(amount, 6)} USDC`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Shares: ${ethers.formatUnits(shares, 6)}`);
    
    try {
      await axios.post(`${BACKEND_URL}/api/v1/webhooks/pool-deposit`, {
        provider,
        amount: amount.toString(),
        shares: shares.toString(),
        txHash: event.log.transactionHash,
      });
      console.log("   ✅ Backend notified\n");
    } catch (error: any) {
      console.log(`   ⚠️ Backend notification failed: ${error.message}\n`);
    }
  });

  insurancePool.on("Withdrawn", async (provider, amount, shares, event) => {
    console.log(`💸 Withdrawn: ${ethers.formatUnits(amount, 6)} USDC`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Shares: ${ethers.formatUnits(shares, 6)}`);
    
    try {
      await axios.post(`${BACKEND_URL}/api/v1/webhooks/pool-withdrawal`, {
        provider,
        amount: amount.toString(),
        shares: shares.toString(),
        txHash: event.log.transactionHash,
      });
      console.log("   ✅ Backend notified\n");
    } catch (error: any) {
      console.log(`   ⚠️ Backend notification failed: ${error.message}\n`);
    }
  });

  console.log("🎧 Event listener is running. Press Ctrl+C to stop.\n");
  
  // Keep the script running
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
