import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
  network: string;
  chainId: number;
  deployer: string;
  deployedAt: string;
  contracts: {
    mockUSDC?: string;
    mockFDC?: string;
    insurancePool: string;
    policyManager: string;
    claimProcessor: string;
    ftsoV2Consumer?: string;
    fdcFlightVerifier?: string;
  };
  flareContracts?: {
    contractRegistry: string;
    ftsoV2: string;
    fdcHub: string;
  };
}

// Flare Coston2 Testnet Contract Addresses
const FLARE_COSTON2_ADDRESSES = {
  ContractRegistry: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
  FdcHub: "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b",
};

async function main() {
  console.log("🚀 Starting AeroShield deployment...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👛 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const addresses: DeploymentAddresses = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      insurancePool: "",
      policyManager: "",
      claimProcessor: "",
    },
  };

  // Check if deploying on Flare networks
  const isFlareCoston2 = network.chainId === 114n;
  const isFlareMainnet = network.chainId === 14n;
  const isFlareNetwork = isFlareCoston2 || isFlareMainnet;
  
  // For local/testnet, deploy mocks
  const isTestnet = network.chainId === 31337n || isFlareCoston2;
  
  let usdcAddress: string;
  let fdcAddress: string;

  if (isTestnet) {
    console.log("📦 Deploying mock contracts...\n");

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    addresses.contracts.mockUSDC = usdcAddress;
    console.log(`  ✅ MockUSDC deployed: ${usdcAddress}`);

    // Deploy Mock FDC
    const MockFDC = await ethers.getContractFactory("MockFDC");
    const mockFDC = await MockFDC.deploy();
    await mockFDC.waitForDeployment();
    fdcAddress = await mockFDC.getAddress();
    addresses.contracts.mockFDC = fdcAddress;
    console.log(`  ✅ MockFDC deployed: ${fdcAddress}`);

    // Mint initial USDC to deployer
    await mockUSDC.mint(deployer.address, ethers.parseUnits("1000000", 6));
    console.log(`  💵 Minted 1,000,000 USDC to deployer\n`);
  } else {
    // Mainnet addresses
    usdcAddress = process.env.USDC_ADDRESS || "";
    fdcAddress = process.env.FDC_ADDRESS || "";
    
    if (!usdcAddress || !fdcAddress) {
      throw new Error("USDC_ADDRESS and FDC_ADDRESS must be set for mainnet deployment");
    }
  }

  console.log("📦 Deploying core contracts...\n");

  // Deploy Insurance Pool
  const InsurancePool = await ethers.getContractFactory("InsurancePool");
  const insurancePool = await InsurancePool.deploy(
    usdcAddress,
    ethers.parseUnits("10", 6),     // Min deposit: 10 USDC
    8000,                            // Max utilization: 80%
    24 * 60 * 60                     // Withdrawal cooldown: 24 hours
  );
  await insurancePool.waitForDeployment();
  const poolAddress = await insurancePool.getAddress();
  addresses.contracts.insurancePool = poolAddress;
  console.log(`  ✅ InsurancePool deployed: ${poolAddress}`);

  // Deploy Policy Manager
  const PolicyManager = await ethers.getContractFactory("PolicyManager");
  const policyManager = await PolicyManager.deploy(
    poolAddress,
    usdcAddress,
    fdcAddress
  );
  await policyManager.waitForDeployment();
  const policyAddress = await policyManager.getAddress();
  addresses.contracts.policyManager = policyAddress;
  console.log(`  ✅ PolicyManager deployed: ${policyAddress}`);

  // Deploy Claim Processor
  const ClaimProcessor = await ethers.getContractFactory("ClaimProcessor");
  const claimProcessor = await ClaimProcessor.deploy(policyAddress);
  await claimProcessor.waitForDeployment();
  const claimAddress = await claimProcessor.getAddress();
  addresses.contracts.claimProcessor = claimAddress;
  console.log(`  ✅ ClaimProcessor deployed: ${claimAddress}\n`);

  // Configure roles
  console.log("🔐 Configuring roles...\n");

  const POLICY_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("POLICY_MANAGER_ROLE"));
  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
  const PROCESSOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROCESSOR_ROLE"));

  // Grant PolicyManager role to PolicyManager contract on InsurancePool
  await insurancePool.grantRole(POLICY_MANAGER_ROLE, policyAddress);
  console.log(`  ✅ Granted POLICY_MANAGER_ROLE to PolicyManager on InsurancePool`);

  // Grant Operator role to ClaimProcessor on PolicyManager
  await policyManager.grantRole(OPERATOR_ROLE, claimAddress);
  console.log(`  ✅ Granted OPERATOR_ROLE to ClaimProcessor on PolicyManager`);

  // Deploy Flare-specific contracts if on Flare network
  if (isFlareNetwork) {
    console.log("\n📦 Deploying Flare-specific contracts...\n");
    
    // Store Flare contract addresses
    addresses.flareContracts = {
      contractRegistry: FLARE_COSTON2_ADDRESSES.ContractRegistry,
      ftsoV2: "Retrieved from ContractRegistry",
      fdcHub: FLARE_COSTON2_ADDRESSES.FdcHub,
    };

    // Deploy FTSOv2Consumer
    const FTSOv2Consumer = await ethers.getContractFactory("FTSOv2Consumer");
    const ftsoV2Consumer = await FTSOv2Consumer.deploy();
    await ftsoV2Consumer.waitForDeployment();
    const ftsoConsumerAddress = await ftsoV2Consumer.getAddress();
    addresses.contracts.ftsoV2Consumer = ftsoConsumerAddress;
    console.log(`  ✅ FTSOv2Consumer deployed: ${ftsoConsumerAddress}`);

    // Deploy FDCFlightVerifier
    const FDCFlightVerifier = await ethers.getContractFactory("FDCFlightVerifier");
    const fdcFlightVerifier = await FDCFlightVerifier.deploy();
    await fdcFlightVerifier.waitForDeployment();
    const fdcVerifierAddress = await fdcFlightVerifier.getAddress();
    addresses.contracts.fdcFlightVerifier = fdcVerifierAddress;
    console.log(`  ✅ FDCFlightVerifier deployed: ${fdcVerifierAddress}`);

    // Grant OPERATOR_ROLE to FDCFlightVerifier on ClaimProcessor if needed
    console.log(`\n  📋 Flare Contract Registry: ${FLARE_COSTON2_ADDRESSES.ContractRegistry}`);
    console.log(`  📋 FDC Hub: ${FLARE_COSTON2_ADDRESSES.FdcHub}`);
  }

  console.log("\n✅ Deployment complete!\n");

  // Save deployment addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(addresses, null, 2));
  console.log(`📄 Deployment addresses saved to: ${filepath}`);

  // Also save as latest
  const latestPath = path.join(deploymentsDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(addresses, null, 2));
  console.log(`📄 Latest deployment: ${latestPath}`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network:         ${network.name}`);
  console.log(`Chain ID:        ${network.chainId}`);
  console.log(`Deployer:        ${deployer.address}`);
  console.log("-".repeat(60));
  console.log("Contract Addresses:");
  if (addresses.contracts.mockUSDC) {
    console.log(`  MockUSDC:          ${addresses.contracts.mockUSDC}`);
  }
  if (addresses.contracts.mockFDC) {
    console.log(`  MockFDC:           ${addresses.contracts.mockFDC}`);
  }
  console.log(`  InsurancePool:     ${addresses.contracts.insurancePool}`);
  console.log(`  PolicyManager:     ${addresses.contracts.policyManager}`);
  console.log(`  ClaimProcessor:    ${addresses.contracts.claimProcessor}`);
  if (addresses.contracts.ftsoV2Consumer) {
    console.log(`  FTSOv2Consumer:    ${addresses.contracts.ftsoV2Consumer}`);
  }
  if (addresses.contracts.fdcFlightVerifier) {
    console.log(`  FDCFlightVerifier: ${addresses.contracts.fdcFlightVerifier}`);
  }
  if (addresses.flareContracts) {
    console.log("-".repeat(60));
    console.log("Flare Network Contracts:");
    console.log(`  ContractRegistry:  ${addresses.flareContracts.contractRegistry}`);
    console.log(`  FDC Hub:           ${addresses.flareContracts.fdcHub}`);
  }
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
