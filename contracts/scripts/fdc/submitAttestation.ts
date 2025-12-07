/**
 * FDC Attestation Submission Script
 * 
 * This script submits attestation requests to the FDCHub contract
 * on Flare/Coston2 network.
 * 
 * Based on: https://dev.flare.network/fdc/getting-started
 */

import { ethers } from "hardhat";
import { prepareEVMTransactionRequest, calculateRoundId, getFDCExplorerUrl } from "./prepareAttestation";
import * as dotenv from "dotenv";
dotenv.config();

// FDCHub contract addresses
const FDC_HUB_ADDRESSES = {
  coston2: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b",
  flare: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b", // Update with mainnet address
};

// Voting round configuration
const VOTING_CONFIG = {
  coston2: {
    firstVotingRoundStartTs: 1658429955,
    votingEpochDurationSeconds: 90,
  },
  flare: {
    firstVotingRoundStartTs: 1658429955, // Update with mainnet value
    votingEpochDurationSeconds: 90,
  },
};

// FDCHub ABI (minimal interface)
const FDC_HUB_ABI = [
  "function requestAttestation(bytes calldata _data) external payable returns (bool)",
  "event AttestationRequest(address indexed sender, bytes data)",
];

interface SubmitResult {
  txHash: string;
  roundId: number;
  explorerUrl: string;
  blockNumber: number;
  timestamp: number;
}

/**
 * Submit attestation request to FDCHub
 */
export async function submitAttestationRequest(
  abiEncodedRequest: string,
  network: "coston2" | "flare" = "coston2"
): Promise<SubmitResult> {
  const fdcHubAddress = FDC_HUB_ADDRESSES[network];
  const votingConfig = VOTING_CONFIG[network];
  
  console.log("\n=== Submitting Attestation Request ===");
  console.log("Network:", network);
  console.log("FDCHub Address:", fdcHubAddress);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Signer Address:", await signer.getAddress());
  
  // Connect to FDCHub contract
  const fdcHub = new ethers.Contract(fdcHubAddress, FDC_HUB_ABI, signer);
  
  // Get current balance
  const balance = await signer.provider!.getBalance(await signer.getAddress());
  console.log("Signer Balance:", ethers.formatEther(balance), network === "coston2" ? "C2FLR" : "FLR");
  
  // Attestation request requires 1 FLR/C2FLR fee
  const attestationFee = ethers.parseEther("1");
  
  if (balance < attestationFee) {
    throw new Error(`Insufficient balance. Need at least 1 ${network === "coston2" ? "C2FLR" : "FLR"} for attestation fee.`);
  }
  
  // Submit the attestation request
  console.log("\nSubmitting attestation request with 1", network === "coston2" ? "C2FLR" : "FLR", "fee...");
  
  const tx = await fdcHub.requestAttestation(abiEncodedRequest, {
    value: attestationFee,
  });
  
  console.log("Transaction Hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  if (!receipt) {
    throw new Error("Transaction failed - no receipt");
  }
  
  // Calculate round ID
  const block = await signer.provider!.getBlock(receipt.blockNumber);
  const timestamp = block!.timestamp;
  
  const roundId = calculateRoundId(
    Number(timestamp),
    votingConfig.firstVotingRoundStartTs,
    votingConfig.votingEpochDurationSeconds
  );
  
  const explorerUrl = getFDCExplorerUrl(roundId, network === "coston2");
  
  console.log("\n=== Attestation Submitted Successfully ===");
  console.log("Block Number:", receipt.blockNumber);
  console.log("Block Timestamp:", timestamp);
  console.log("Round ID:", roundId);
  console.log("Explorer URL:", explorerUrl);
  console.log("\nWait for round finalization (90-180 seconds) before fetching proof.");
  
  return {
    txHash: tx.hash,
    roundId,
    explorerUrl,
    blockNumber: receipt.blockNumber,
    timestamp: Number(timestamp),
  };
}

/**
 * Submit flight data attestation
 */
export async function submitFlightDataAttestation(
  flightDataTxHash: string,
  sourceChain: string = "testETH",
  network: "coston2" | "flare" = "coston2"
): Promise<SubmitResult> {
  // First prepare the attestation request
  console.log("=== Preparing Flight Data Attestation ===");
  const preparedRequest = await prepareEVMTransactionRequest(
    flightDataTxHash,
    sourceChain,
    network === "coston2"
  );
  
  if (preparedRequest.status !== "VALID") {
    throw new Error(`Attestation request preparation failed: ${preparedRequest.status}`);
  }
  
  // Submit to FDCHub
  return submitAttestationRequest(preparedRequest.abiEncodedRequest, network);
}

/**
 * Estimate time until round finalization
 */
export function estimateFinalizationTime(roundId: number, network: "coston2" | "flare" = "coston2"): {
  estimatedFinalizationTimestamp: number;
  secondsRemaining: number;
} {
  const votingConfig = VOTING_CONFIG[network];
  
  // Round finalizes at the end of the voting epoch
  const roundEndTimestamp = 
    votingConfig.firstVotingRoundStartTs + 
    (roundId + 1) * votingConfig.votingEpochDurationSeconds;
  
  // Add buffer for Merkle root storage
  const estimatedFinalizationTimestamp = roundEndTimestamp + 90;
  const secondsRemaining = Math.max(0, estimatedFinalizationTimestamp - Math.floor(Date.now() / 1000));
  
  return {
    estimatedFinalizationTimestamp,
    secondsRemaining,
  };
}

// Example usage
async function main() {
  // Example: Submit attestation for a Sepolia transaction
  const exampleTxHash = process.env.FLIGHT_DATA_TX_HASH || 
    "0x4e636c6590b22d8dcdade7ee3b5ae5572f42edb1878f09b3034b2f7c3362ef3c";
  
  try {
    const result = await submitFlightDataAttestation(
      exampleTxHash,
      "testETH",
      "coston2"
    );
    
    console.log("\n=== Submission Complete ===");
    console.log("Transaction Hash:", result.txHash);
    console.log("Round ID:", result.roundId);
    
    const finalization = estimateFinalizationTime(result.roundId, "coston2");
    console.log("Estimated wait time:", finalization.secondsRemaining, "seconds");
    console.log("\nMonitor progress at:", result.explorerUrl);
    
    return result;
  } catch (error) {
    console.error("Error submitting attestation:", error);
    throw error;
  }
}

// Run if executed directly
main().catch(console.error);
