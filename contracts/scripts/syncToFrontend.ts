import * as fs from "fs";
import * as path from "path";

/**
 * Updates the frontend .env.local file with deployed contract addresses
 * Run after deploying contracts to automatically sync addresses
 */

async function main() {
  console.log("📄 Syncing contract addresses to frontend...\n");

  // Find the latest deployment file
  const deploymentsDir = path.join(__dirname, "../deployments");
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");

  if (!fs.existsSync(deploymentsDir)) {
    console.error("❌ No deployments directory found. Deploy contracts first.");
    process.exit(1);
  }

  // Find network-specific deployment files
  const files = fs.readdirSync(deploymentsDir);
  
  // Process coston2 deployment
  const coston2File = files.find(f => f.includes("coston2-latest") || (f.includes("coston2") && f.endsWith(".json")));
  const localFile = files.find(f => f.includes("localhost-latest") || f.includes("hardhat-latest") || f.includes("unknown-latest"));
  const flareFile = files.find(f => f.includes("flare-latest") && !f.includes("coston"));

  // Read existing .env.local or create from template
  let envContent = "";
  const envExamplePath = path.join(__dirname, "../../frontend/.env.example");

  if (fs.existsSync(frontendEnvPath)) {
    envContent = fs.readFileSync(frontendEnvPath, "utf-8");
    console.log("📝 Updating existing .env.local\n");
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf-8");
    console.log("📝 Creating .env.local from template\n");
  } else {
    console.error("❌ No .env.example template found");
    process.exit(1);
  }

  // Helper to update env variable
  function updateEnvVar(content: string, key: string, value: string): string {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      return content.replace(regex, `${key}=${value}`);
    } else {
      return content + `\n${key}=${value}`;
    }
  }

  // Process Coston2 deployment
  if (coston2File) {
    console.log(`📦 Processing Coston2 deployment: ${coston2File}`);
    const deployment = JSON.parse(fs.readFileSync(path.join(deploymentsDir, coston2File), "utf-8"));
    
    if (deployment.contracts) {
      if (deployment.contracts.insurancePool) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_COSTON2_INSURANCE_POOL", deployment.contracts.insurancePool);
        console.log(`  ✅ InsurancePool: ${deployment.contracts.insurancePool}`);
      }
      if (deployment.contracts.policyManager) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_COSTON2_POLICY_MANAGER", deployment.contracts.policyManager);
        console.log(`  ✅ PolicyManager: ${deployment.contracts.policyManager}`);
      }
      if (deployment.contracts.claimProcessor) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_COSTON2_CLAIM_PROCESSOR", deployment.contracts.claimProcessor);
        console.log(`  ✅ ClaimProcessor: ${deployment.contracts.claimProcessor}`);
      }
      if (deployment.contracts.mockUSDC) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_COSTON2_MOCK_USDC", deployment.contracts.mockUSDC);
        console.log(`  ✅ MockUSDC: ${deployment.contracts.mockUSDC}`);
      }
      if (deployment.contracts.ftsoV2Consumer) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_COSTON2_FTSO_CONSUMER", deployment.contracts.ftsoV2Consumer);
        console.log(`  ✅ FTSOv2Consumer: ${deployment.contracts.ftsoV2Consumer}`);
      }
      if (deployment.contracts.fdcFlightVerifier) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_COSTON2_FDC_VERIFIER", deployment.contracts.fdcFlightVerifier);
        console.log(`  ✅ FDCFlightVerifier: ${deployment.contracts.fdcFlightVerifier}`);
      }
    }
    console.log("");
  }

  // Process local deployment
  if (localFile) {
    console.log(`📦 Processing local deployment: ${localFile}`);
    const deployment = JSON.parse(fs.readFileSync(path.join(deploymentsDir, localFile), "utf-8"));
    
    if (deployment.contracts) {
      if (deployment.contracts.insurancePool) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_LOCAL_INSURANCE_POOL", deployment.contracts.insurancePool);
        console.log(`  ✅ InsurancePool: ${deployment.contracts.insurancePool}`);
      }
      if (deployment.contracts.policyManager) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_LOCAL_POLICY_MANAGER", deployment.contracts.policyManager);
        console.log(`  ✅ PolicyManager: ${deployment.contracts.policyManager}`);
      }
      if (deployment.contracts.claimProcessor) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_LOCAL_CLAIM_PROCESSOR", deployment.contracts.claimProcessor);
        console.log(`  ✅ ClaimProcessor: ${deployment.contracts.claimProcessor}`);
      }
      if (deployment.contracts.mockUSDC) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_LOCAL_MOCK_USDC", deployment.contracts.mockUSDC);
        console.log(`  ✅ MockUSDC: ${deployment.contracts.mockUSDC}`);
      }
    }
    console.log("");
  }

  // Process Flare mainnet deployment
  if (flareFile) {
    console.log(`📦 Processing Flare mainnet deployment: ${flareFile}`);
    const deployment = JSON.parse(fs.readFileSync(path.join(deploymentsDir, flareFile), "utf-8"));
    
    if (deployment.contracts) {
      if (deployment.contracts.insurancePool) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_FLARE_INSURANCE_POOL", deployment.contracts.insurancePool);
        console.log(`  ✅ InsurancePool: ${deployment.contracts.insurancePool}`);
      }
      if (deployment.contracts.policyManager) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_FLARE_POLICY_MANAGER", deployment.contracts.policyManager);
        console.log(`  ✅ PolicyManager: ${deployment.contracts.policyManager}`);
      }
      if (deployment.contracts.claimProcessor) {
        envContent = updateEnvVar(envContent, "NEXT_PUBLIC_FLARE_CLAIM_PROCESSOR", deployment.contracts.claimProcessor);
        console.log(`  ✅ ClaimProcessor: ${deployment.contracts.claimProcessor}`);
      }
    }
    console.log("");
  }

  // Write updated .env.local
  fs.writeFileSync(frontendEnvPath, envContent);
  console.log(`✅ Frontend .env.local updated: ${frontendEnvPath}\n`);
  
  console.log("=".repeat(60));
  console.log("🎉 Contract addresses synced to frontend!");
  console.log("   Restart your frontend dev server to apply changes.");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
