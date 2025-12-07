/**
 * AeroShield Smart Contract Configuration
 * Contains contract addresses and ABIs for frontend integration
 */

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  // Hardhat local (chainId: 31337)
  31337: {
    InsurancePool: process.env.NEXT_PUBLIC_LOCAL_INSURANCE_POOL || "",
    PolicyManager: process.env.NEXT_PUBLIC_LOCAL_POLICY_MANAGER || "",
    ClaimProcessor: process.env.NEXT_PUBLIC_LOCAL_CLAIM_PROCESSOR || "",
    MockUSDC: process.env.NEXT_PUBLIC_LOCAL_MOCK_USDC || "",
    FTSOv2Consumer: process.env.NEXT_PUBLIC_LOCAL_FTSO_CONSUMER || "",
    FDCFlightVerifier: process.env.NEXT_PUBLIC_LOCAL_FDC_VERIFIER || "",
  },
  // Flare Coston2 Testnet (chainId: 114)
  114: {
    InsurancePool: process.env.NEXT_PUBLIC_COSTON2_INSURANCE_POOL || "",
    PolicyManager: process.env.NEXT_PUBLIC_COSTON2_POLICY_MANAGER || "",
    ClaimProcessor: process.env.NEXT_PUBLIC_COSTON2_CLAIM_PROCESSOR || "",
    MockUSDC: process.env.NEXT_PUBLIC_COSTON2_MOCK_USDC || "",
    FTSOv2Consumer: process.env.NEXT_PUBLIC_COSTON2_FTSO_CONSUMER || "",
    FDCFlightVerifier: process.env.NEXT_PUBLIC_COSTON2_FDC_VERIFIER || "",
    // Flare System Contracts
    ContractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
    FDCHub: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b",
  },
  // Flare Mainnet (chainId: 14)
  14: {
    InsurancePool: process.env.NEXT_PUBLIC_FLARE_INSURANCE_POOL || "",
    PolicyManager: process.env.NEXT_PUBLIC_FLARE_POLICY_MANAGER || "",
    ClaimProcessor: process.env.NEXT_PUBLIC_FLARE_CLAIM_PROCESSOR || "",
    USDC: process.env.NEXT_PUBLIC_FLARE_USDC || "",
    FTSOv2Consumer: process.env.NEXT_PUBLIC_FLARE_FTSO_CONSUMER || "",
    FDCFlightVerifier: process.env.NEXT_PUBLIC_FLARE_FDC_VERIFIER || "",
    ContractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
    FDCHub: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b",
  },
} as const;

// Get contract addresses for current chain
export function getContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[114];
}

// Simplified ABIs for frontend interaction
export const INSURANCE_POOL_ABI = [
  // Read functions
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function maxUtilization() view returns (uint256)",
  "function getCurrentUtilization() view returns (uint256)",
  "function getAvailableCapacity() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function previewWithdraw(uint256 assets) view returns (uint256)",
  "function getProviderInfo(address provider) view returns (uint256, uint256, uint256, uint256)",
  // Write functions
  "function deposit(uint256 amount) returns (uint256)",
  "function requestWithdraw(uint256 shares)",
  "function withdraw(uint256 shares) returns (uint256)",
  // Events
  "event Deposited(address indexed provider, uint256 amount, uint256 shares)",
  "event WithdrawRequested(address indexed provider, uint256 shares)",
  "event Withdrawn(address indexed provider, uint256 amount, uint256 shares)",
] as const;

export const POLICY_MANAGER_ABI = [
  // Read functions
  "function getPolicy(uint256 policyId) view returns (tuple(address holder, string flightNumber, uint256 departureTime, uint256 arrivalTime, uint256 premium, uint256 coverage, uint8 status, uint256 createdAt, uint256 activatedAt))",
  "function getPolicyCount() view returns (uint256)",
  "function getUserPolicies(address user) view returns (uint256[])",
  "function calculatePremium(uint256 coverage, uint256 riskScore, uint256 duration) view returns (uint256)",
  "function isPolicyActive(uint256 policyId) view returns (bool)",
  // Write functions
  "function createPolicy(string flightNumber, uint256 departureTime, uint256 arrivalTime, uint256 coverage) returns (uint256)",
  "function activatePolicy(uint256 policyId) payable",
  "function cancelPolicy(uint256 policyId)",
  // Events
  "event PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 premium, uint256 coverage)",
  "event PolicyActivated(uint256 indexed policyId, string flightNumber, uint256 departureTime)",
  "event PolicyCancelled(uint256 indexed policyId)",
  "event PolicyExpired(uint256 indexed policyId)",
] as const;

export const CLAIM_PROCESSOR_ABI = [
  // Read functions
  "function getClaim(uint256 claimId) view returns (tuple(uint256 policyId, uint8 claimType, uint256 amount, uint8 status, bytes32 fdcProof, uint256 submittedAt, uint256 processedAt))",
  "function getClaimCount() view returns (uint256)",
  "function getPolicyClaims(uint256 policyId) view returns (uint256[])",
  "function isClaimValid(uint256 claimId) view returns (bool)",
  // Write functions
  "function submitClaim(uint256 policyId, uint8 claimType, bytes32 fdcProof) returns (uint256)",
  "function processClaim(uint256 claimId, bool approved)",
  "function processClaimWithFDC(uint256 claimId, bytes calldata proof)",
  // Events
  "event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, uint256 amount)",
  "event ClaimProcessed(uint256 indexed claimId, bool approved, uint256 payout)",
  "event ClaimRejected(uint256 indexed claimId, string reason)",
] as const;

export const FTSO_V2_CONSUMER_ABI = [
  // Read functions
  "function getFeedValue(bytes21 feedId) view returns (uint256 value, int8 decimals, uint64 timestamp)",
  "function getMultipleFeedValues(bytes21[] feedIds) view returns (uint256[] values, int8[] decimals, uint64[] timestamps)",
  "function calculateInsurancePremium(uint256 baseAmount, uint256 riskFactor, bytes21 feedId) view returns (uint256)",
  // Feed IDs
] as const;

export const FDC_FLIGHT_VERIFIER_ABI = [
  // Read functions  
  "function getFlightData(bytes32 attestationId) view returns (tuple(string flightNumber, uint256 scheduledDeparture, uint256 actualDeparture, uint256 scheduledArrival, uint256 actualArrival, uint8 status, bool isCancelled, uint256 delayMinutes, bool verified, uint256 verifiedAt))",
  "function isFlightDelayed(bytes32 attestationId, uint256 thresholdMinutes) view returns (bool)",
  "function isFlightCancelled(bytes32 attestationId) view returns (bool)",
  // Write functions
  "function verifyFlightData(bytes calldata proof) returns (bytes32)",
  // Events
  "event FlightDataVerified(bytes32 indexed attestationId, string flightNumber, uint256 delayMinutes, bool isCancelled)",
] as const;

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;

// FTSO v2 Feed IDs
export const FTSO_FEED_IDS = {
  "FLR/USD": "0x01464c522f55534400000000000000000000000000",
  "BTC/USD": "0x014254432f55534400000000000000000000000000",
  "ETH/USD": "0x014554482f55534400000000000000000000000000",
  "XRP/USD": "0x015852502f55534400000000000000000000000000",
  "USDC/USD": "0x01555344432f555344000000000000000000000000",
  "USDT/USD": "0x01555344542f555344000000000000000000000000",
} as const;

// Claim types enum (matches contract)
export enum ClaimType {
  DELAY_2H = 0,
  DELAY_4H = 1,
  CANCELLATION = 2,
  DIVERSION = 3,
}

// Policy status enum (matches contract)
export enum PolicyStatus {
  CREATED = 0,
  ACTIVE = 1,
  CLAIMED = 2,
  EXPIRED = 3,
  CANCELLED = 4,
}

// Claim status enum (matches contract)
export enum ClaimStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  PAID = 3,
}

// Flight status enum (matches contract)
export enum FlightStatus {
  UNKNOWN = 0,
  SCHEDULED = 1,
  DEPARTED = 2,
  IN_FLIGHT = 3,
  LANDED = 4,
  DELAYED = 5,
  CANCELLED = 6,
  DIVERTED = 7,
}

// Helper to format wei to readable
export function formatTokenAmount(amount: bigint, decimals: number = 6): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  return `${integerPart}.${fractionalStr}`;
}

// Helper to parse readable to wei
export function parseTokenAmount(amount: string, decimals: number = 6): bigint {
  const [integer, fractional = ""] = amount.split(".");
  const paddedFractional = fractional.slice(0, decimals).padEnd(decimals, "0");
  return BigInt(integer + paddedFractional);
}
