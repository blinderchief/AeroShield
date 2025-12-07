/**
 * FDC Attestation Preparation Script
 * 
 * This script prepares attestation requests for the Flare Data Connector
 * to verify flight data from external sources.
 * 
 * Based on: https://dev.flare.network/fdc/getting-started
 */

import * as dotenv from "dotenv";
dotenv.config();

// FDC Verifier URLs
const VERIFIER_BASE_URL_TESTNET = "https://fdc-verifiers-testnet.flare.network/";
const VERIFIER_BASE_URL_MAINNET = "https://fdc-verifiers.flare.network/";

// Get API key from environment
const VERIFIER_API_KEY = process.env.FDC_VERIFIER_API_KEY || "public";

// Attestation types
const ATTESTATION_TYPES = {
  EVMTransaction: "EVMTransaction",
  Payment: "Payment",
  BalanceDecreasingTransaction: "BalanceDecreasingTransaction",
  ConfirmedBlockHeightExists: "ConfirmedBlockHeightExists",
  ReferencedPaymentNonexistence: "ReferencedPaymentNonexistence",
  AddressValidity: "AddressValidity",
};

// Source chain identifiers
const SOURCE_IDS = {
  // Testnets
  testETH: "testETH", // Sepolia
  testBTC: "testBTC", // Bitcoin Testnet
  testXRP: "testXRP", // XRP Testnet
  testDOGE: "testDOGE", // Dogecoin Testnet
  testFLR: "testFLR", // Coston2
  
  // Mainnets
  ETH: "ETH",
  BTC: "BTC",
  XRP: "XRP",
  DOGE: "DOGE",
  FLR: "FLR",
  SGB: "SGB",
};

/**
 * Convert string to hex-padded bytes32
 */
function toHex(data: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += data.charCodeAt(i).toString(16);
  }
  return result.padEnd(64, "0");
}

/**
 * Prepare an EVMTransaction attestation request
 */
export async function prepareEVMTransactionRequest(
  transactionHash: string,
  sourceChain: string = "testETH",
  isTestnet: boolean = true
): Promise<{
  status: string;
  abiEncodedRequest: string;
}> {
  const baseUrl = isTestnet ? VERIFIER_BASE_URL_TESTNET : VERIFIER_BASE_URL_MAINNET;
  
  const attestationType = "0x" + toHex(ATTESTATION_TYPES.EVMTransaction);
  const sourceId = "0x" + toHex(sourceChain);
  
  const requestData = {
    attestationType,
    sourceId,
    requestBody: {
      transactionHash,
      requiredConfirmations: "1",
      provideInput: true,
      listEvents: true,
      logIndices: [],
    },
  };

  console.log("Preparing attestation request...");
  console.log("Transaction Hash:", transactionHash);
  console.log("Source Chain:", sourceChain);

  const response = await fetch(
    `${baseUrl}verifier/eth/EVMTransaction/prepareRequest`,
    {
      method: "POST",
      headers: {
        "X-API-KEY": VERIFIER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Verifier request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  console.log("\nVerifier Response:");
  console.log("Status:", data.status);
  
  if (data.status === "VALID") {
    console.log("ABI Encoded Request (first 100 chars):", data.abiEncodedRequest.substring(0, 100) + "...");
  }

  return data;
}

/**
 * Prepare a flight data attestation request
 * This would be used to verify flight data from an oracle or external API
 */
export async function prepareFlightDataAttestation(
  flightDataTxHash: string,
  sourceChain: string = "testETH"
): Promise<{
  status: string;
  abiEncodedRequest: string;
}> {
  // For flight data, we use EVMTransaction attestation type
  // The transaction should emit flight status events that we can verify
  return prepareEVMTransactionRequest(flightDataTxHash, sourceChain, true);
}

/**
 * Calculate the voting round ID for a given timestamp
 */
export function calculateRoundId(
  timestamp: number,
  firstVotingRoundStartTs: number = 1658429955, // Coston2 genesis
  votingEpochDurationSeconds: number = 90
): number {
  return Math.floor(
    (timestamp - firstVotingRoundStartTs) / votingEpochDurationSeconds
  );
}

/**
 * Get FDC round explorer URL
 */
export function getFDCExplorerUrl(roundId: number, isTestnet: boolean = true): string {
  if (isTestnet) {
    return `https://coston-systems-explorer.flare.rocks/voting-epoch/${roundId}?tab=fdc`;
  }
  return `https://flare-systems-explorer.flare.rocks/voting-epoch/${roundId}?tab=fdc`;
}

// Example usage
async function main() {
  // Example: Prepare attestation for a Sepolia transaction
  const exampleTxHash = "0x4e636c6590b22d8dcdade7ee3b5ae5572f42edb1878f09b3034b2f7c3362ef3c";
  
  try {
    const result = await prepareEVMTransactionRequest(exampleTxHash, "testETH", true);
    
    console.log("\n=== Attestation Request Prepared ===");
    console.log("Status:", result.status);
    
    if (result.status === "VALID") {
      console.log("\nNext steps:");
      console.log("1. Submit the abiEncodedRequest to FDCHub contract");
      console.log("2. Wait for round finalization (90-180 seconds)");
      console.log("3. Retrieve proof from DA Layer API");
      console.log("4. Submit proof to your contract for verification");
    }
    
    return result;
  } catch (error) {
    console.error("Error preparing attestation:", error);
    throw error;
  }
}

// Run if executed directly
main().catch(console.error);
