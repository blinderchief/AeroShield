/**
 * FDC Attestation Verification Script
 * 
 * This script retrieves proofs from the Data Availability Layer
 * and submits them to smart contracts for verification.
 * 
 * Based on: https://dev.flare.network/fdc/getting-started
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

// Data Availability Layer URLs
const DA_LAYER_URLS = {
  coston2: process.env.DA_LAYER_URL_TESTNET || "https://fdc-data-availability-testnet.flare.network/",
  flare: process.env.DA_LAYER_URL_MAINNET || "https://fdc-data-availability.flare.network/",
};

// API Keys
const DA_LAYER_API_KEY = process.env.DA_LAYER_API_KEY || "public";

interface ProofResponse {
  response: {
    attestationType: string;
    sourceId: string;
    votingRound: string;
    lowestUsedTimestamp: string;
    requestBody: {
      transactionHash: string;
      requiredConfirmations: string;
      provideInput: boolean;
      listEvents: boolean;
      logIndices: number[];
    };
    responseBody: {
      blockNumber: string;
      timestamp: string;
      sourceAddress: string;
      isDeployment: boolean;
      receivingAddress: string;
      value: string;
      input: string;
      status: number;
      events: Array<{
        logIndex: number;
        emitterAddress: string;
        topics: string[];
        data: string;
        removed: boolean;
      }>;
    };
  };
  proof: string[];
}

/**
 * Get proof from DA Layer
 */
export async function getProofFromDALayer(
  roundId: number,
  abiEncodedRequest: string,
  network: "coston2" | "flare" = "coston2"
): Promise<ProofResponse> {
  const daLayerUrl = DA_LAYER_URLS[network];
  
  console.log("\n=== Fetching Proof from DA Layer ===");
  console.log("Network:", network);
  console.log("Round ID:", roundId);
  console.log("DA Layer URL:", daLayerUrl);
  
  const response = await fetch(
    `${daLayerUrl}api/v0/fdc/get-proof-round-id-bytes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": DA_LAYER_API_KEY,
      },
      body: JSON.stringify({
        votingRoundId: roundId,
        requestBytes: abiEncodedRequest,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DA Layer request failed: ${response.status} - ${errorText}`);
  }

  const data: ProofResponse = await response.json();
  
  console.log("\n=== Proof Retrieved ===");
  console.log("Attestation Type:", data.response.attestationType);
  console.log("Source ID:", data.response.sourceId);
  console.log("Voting Round:", data.response.votingRound);
  console.log("Block Number:", data.response.responseBody.blockNumber);
  console.log("Events Count:", data.response.responseBody.events.length);
  console.log("Proof Elements:", data.proof.length);
  
  return data;
}

/**
 * Submit proof to FDCFlightVerifier contract
 */
export async function submitProofToContract(
  proofData: ProofResponse,
  flightVerifierAddress: string
): Promise<string> {
  console.log("\n=== Submitting Proof to Contract ===");
  console.log("Flight Verifier Address:", flightVerifierAddress);
  
  const [signer] = await ethers.getSigners();
  
  // FDCFlightVerifier ABI (minimal interface)
  const FLIGHT_VERIFIER_ABI = [
    "function verifyFlightData((bytes32[] merkleProof, (bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, (bytes32 transactionHash, uint16 requiredConfirmations, bool provideInput, bool listEvents, uint32[] logIndices) requestBody, (uint64 blockNumber, uint64 timestamp, address sourceAddress, bool isDeployment, address receivingAddress, uint256 value, bytes input, uint8 status, (uint32 logIndex, address emitterAddress, bytes32[] topics, bytes data, bool removed)[] events) responseBody) data) proof) external",
    "event FlightDataVerified(bytes32 indexed flightHash, string flightNumber, uint8 status, uint256 delayMinutes, bytes32 attestationHash)",
  ];
  
  const flightVerifier = new ethers.Contract(
    flightVerifierAddress,
    FLIGHT_VERIFIER_ABI,
    signer
  );
  
  // Format proof for contract
  const formattedProof = {
    merkleProof: proofData.proof,
    data: {
      attestationType: proofData.response.attestationType,
      sourceId: proofData.response.sourceId,
      votingRound: BigInt(proofData.response.votingRound),
      lowestUsedTimestamp: BigInt(proofData.response.lowestUsedTimestamp),
      requestBody: {
        transactionHash: proofData.response.requestBody.transactionHash,
        requiredConfirmations: parseInt(proofData.response.requestBody.requiredConfirmations),
        provideInput: proofData.response.requestBody.provideInput,
        listEvents: proofData.response.requestBody.listEvents,
        logIndices: proofData.response.requestBody.logIndices,
      },
      responseBody: {
        blockNumber: BigInt(proofData.response.responseBody.blockNumber),
        timestamp: BigInt(proofData.response.responseBody.timestamp),
        sourceAddress: proofData.response.responseBody.sourceAddress,
        isDeployment: proofData.response.responseBody.isDeployment,
        receivingAddress: proofData.response.responseBody.receivingAddress,
        value: BigInt(proofData.response.responseBody.value),
        input: proofData.response.responseBody.input,
        status: proofData.response.responseBody.status,
        events: proofData.response.responseBody.events.map(evt => ({
          logIndex: evt.logIndex,
          emitterAddress: evt.emitterAddress,
          topics: evt.topics,
          data: evt.data,
          removed: evt.removed,
        })),
      },
    },
  };
  
  console.log("Submitting proof to contract...");
  
  const tx = await flightVerifier.verifyFlightData(formattedProof);
  console.log("Transaction Hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt?.blockNumber);
  
  return tx.hash;
}

/**
 * Wait for round finalization and get proof
 */
export async function waitForProof(
  roundId: number,
  abiEncodedRequest: string,
  network: "coston2" | "flare" = "coston2",
  maxAttempts: number = 20,
  delayMs: number = 15000
): Promise<ProofResponse> {
  console.log("\n=== Waiting for Round Finalization ===");
  console.log("Round ID:", roundId);
  console.log("Max attempts:", maxAttempts);
  console.log("Delay between attempts:", delayMs / 1000, "seconds");
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nAttempt ${attempt}/${maxAttempts}...`);
    
    try {
      const proof = await getProofFromDALayer(roundId, abiEncodedRequest, network);
      
      if (proof && proof.proof && proof.proof.length > 0) {
        console.log("\n✅ Proof retrieved successfully!");
        return proof;
      }
    } catch (error: any) {
      if (error.message.includes("404") || error.message.includes("not found")) {
        console.log("Proof not yet available. Round may not be finalized.");
      } else {
        console.error("Error fetching proof:", error.message);
      }
    }
    
    if (attempt < maxAttempts) {
      console.log(`Waiting ${delayMs / 1000} seconds before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error("Failed to retrieve proof after maximum attempts. Round may not be finalized yet.");
}

/**
 * Check if an attestation round is finalized
 */
export async function isRoundFinalized(
  roundId: number,
  network: "coston2" | "flare" = "coston2"
): Promise<boolean> {
  const RELAY_ABI = [
    "function isFinalized(uint256 _protocolId, uint256 _votingRoundId) external view returns (bool)",
  ];
  
  // Relay contract addresses (get from ContractRegistry in production)
  const RELAY_ADDRESSES = {
    coston2: "0x...", // TODO: Get from ContractRegistry
    flare: "0x...",
  };
  
  try {
    const [signer] = await ethers.getSigners();
    const relay = new ethers.Contract(RELAY_ADDRESSES[network], RELAY_ABI, signer);
    
    // Protocol ID 200 is for FDC
    const finalized = await relay.isFinalized(200, roundId);
    return finalized;
  } catch (error) {
    console.error("Error checking round finalization:", error);
    return false;
  }
}

// Example usage
async function main() {
  const roundId = parseInt(process.env.FDC_ROUND_ID || "0");
  const abiEncodedRequest = process.env.ABI_ENCODED_REQUEST || "";
  const flightVerifierAddress = process.env.FLIGHT_VERIFIER_ADDRESS || "";
  
  if (!roundId || !abiEncodedRequest) {
    console.log("Usage: Set FDC_ROUND_ID and ABI_ENCODED_REQUEST environment variables");
    console.log("\nExample:");
    console.log("  FDC_ROUND_ID=123456");
    console.log("  ABI_ENCODED_REQUEST=0x...");
    return;
  }
  
  try {
    // Wait for proof
    const proof = await waitForProof(roundId, abiEncodedRequest, "coston2");
    
    console.log("\n=== Proof Retrieved ===");
    console.log(JSON.stringify(proof, null, 2));
    
    // Optionally submit to contract
    if (flightVerifierAddress) {
      const txHash = await submitProofToContract(proof, flightVerifierAddress);
      console.log("\n✅ Proof submitted to contract:", txHash);
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run if executed directly
main().catch(console.error);
