import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("AeroShield Insurance Contracts", function () {
  
  // Fixture for deploying all contracts
  async function deployContractsFixture() {
    const [owner, user1, user2, operator] = await ethers.getSigners();
    
    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    
    // Deploy Mock FDC
    const MockFDC = await ethers.getContractFactory("MockFDC");
    const fdc = await MockFDC.deploy();
    await fdc.waitForDeployment();
    
    // Deploy Insurance Pool
    // constructor(address _depositToken, uint256 _minDeposit, uint256 _maxUtilization, uint256 _withdrawalCooldown)
    const InsurancePool = await ethers.getContractFactory("InsurancePool");
    const pool = await InsurancePool.deploy(
      await usdc.getAddress(),
      ethers.parseUnits("10", 18),  // minDeposit: 10 tokens (18 decimals)
      8000,                          // maxUtilization: 80%
      0                              // withdrawalCooldown: 0 for testing
    );
    await pool.waitForDeployment();
    
    // Deploy Policy Manager
    // constructor(address _insurancePool, address _paymentToken, address _fdcConnector)
    const PolicyManager = await ethers.getContractFactory("PolicyManager");
    const policyManager = await PolicyManager.deploy(
      await pool.getAddress(),
      await usdc.getAddress(),
      await fdc.getAddress()
    );
    await policyManager.waitForDeployment();
    
    // Deploy Claim Processor
    // constructor(address _policyManager)
    const ClaimProcessor = await ethers.getContractFactory("ClaimProcessor");
    const claimProcessor = await ClaimProcessor.deploy(
      await policyManager.getAddress()
    );
    await claimProcessor.waitForDeployment();
    
    // Setup roles
    const POLICY_MANAGER_ROLE = await pool.POLICY_MANAGER_ROLE();
    const OPERATOR_ROLE = await pool.OPERATOR_ROLE();
    
    await pool.grantRole(POLICY_MANAGER_ROLE, await policyManager.getAddress());
    await policyManager.grantRole(OPERATOR_ROLE, operator.address);
    
    // Mint test tokens (using 18 decimals to match policy premium requirements)
    const mintAmount = ethers.parseUnits("100000", 18); // 100k tokens with 18 decimals
    await usdc.mint(owner.address, mintAmount);
    await usdc.mint(user1.address, mintAmount);
    await usdc.mint(user2.address, mintAmount);
    
    return { 
      usdc, fdc, pool, policyManager, claimProcessor,
      owner, user1, user2, operator,
      POLICY_MANAGER_ROLE, OPERATOR_ROLE
    };
  }

  describe("InsurancePool", function () {
    
    it("Should allow deposits", async function () {
      const { pool, usdc, user1 } = await loadFixture(deployContractsFixture);
      
      const depositAmount = ethers.parseUnits("1000", 18);
      await usdc.connect(user1).approve(await pool.getAddress(), depositAmount);
      
      await expect(pool.connect(user1).deposit(depositAmount))
        .to.emit(pool, "LiquidityDeposited");
        
      const lpInfo = await pool.liquidityProviders(user1.address);
      expect(lpInfo.depositAmount).to.equal(depositAmount);
    });
    
    it("Should allow withdrawals after cooldown", async function () {
      const { pool, usdc, user1 } = await loadFixture(deployContractsFixture);
      
      const depositAmount = ethers.parseUnits("1000", 18);
      await usdc.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(depositAmount);
      
      const lpInfo = await pool.liquidityProviders(user1.address);
      const shares = lpInfo.shareBalance;
      
      // Withdraw half
      await expect(pool.connect(user1).withdraw(shares / 2n))
        .to.emit(pool, "LiquidityWithdrawn");
    });
    
    it("Should reject withdrawals exceeding balance", async function () {
      const { pool, usdc, user1 } = await loadFixture(deployContractsFixture);
      
      const depositAmount = ethers.parseUnits("1000", 18);
      await usdc.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(depositAmount);
      
      const excessiveShares = ethers.parseUnits("2000", 18);
      await expect(pool.connect(user1).withdraw(excessiveShares))
        .to.be.revertedWithCustomError(pool, "InsufficientShares");
    });
    
    it("Should return correct pool stats", async function () {
      const { pool, usdc, user1, user2 } = await loadFixture(deployContractsFixture);
      
      const amount1 = ethers.parseUnits("5000", 18);
      const amount2 = ethers.parseUnits("3000", 18);
      
      await usdc.connect(user1).approve(await pool.getAddress(), amount1);
      await pool.connect(user1).deposit(amount1);
      
      await usdc.connect(user2).approve(await pool.getAddress(), amount2);
      await pool.connect(user2).deposit(amount2);
      
      const totalLiquidity = await pool.totalLiquidity();
      expect(totalLiquidity).to.equal(amount1 + amount2);
    });
  });

  describe("PolicyManager", function () {
    
    it("Should create policy", async function () {
      const { pool, policyManager, usdc, user1, owner } = await loadFixture(deployContractsFixture);
      
      // First seed the pool
      const seedAmount = ethers.parseUnits("50000", 18);
      await usdc.connect(owner).approve(await pool.getAddress(), seedAmount);
      await pool.connect(owner).deposit(seedAmount);
      
      // Create policy
      const currentTime = await time.latest();
      const coverageAmount = ethers.parseUnits("1000", 18); // $1000 coverage (18 decimals)
      const params = {
        flightNumber: "AA100",
        departureTime: currentTime + 86400, // Tomorrow
        arrivalTime: currentTime + 86400 + 18000, // 5h later
        coverageAmount: coverageAmount,
        delay1hPayout: 1000, // 10%
        delay2hPayout: 3000, // 30%
        delay4hPayout: 5000, // 50%
        cancellationPayout: 10000, // 100%
      };
      
      // Premium must be between 2% and 15% of coverage
      // Using 5% = 500 basis points
      const premium = (coverageAmount * 500n) / 10000n; // 5% of coverage in 18 decimals
      const riskScore = 50; // uint8: 0-100
      
      await usdc.connect(user1).approve(await policyManager.getAddress(), premium);
      
      await expect(policyManager.connect(user1).createPolicy(params, premium, riskScore))
        .to.emit(policyManager, "PolicyCreated");
        
      // User should own the policy NFT
      expect(await policyManager.balanceOf(user1.address)).to.equal(1n);
    });
    
    it("Should reject policy for past flights", async function () {
      const { policyManager, usdc, user1 } = await loadFixture(deployContractsFixture);
      
      const currentTime = await time.latest();
      const params = {
        flightNumber: "AA100",
        departureTime: currentTime - 3600, // 1 hour ago
        arrivalTime: currentTime + 14400,
        coverageAmount: ethers.parseUnits("1000", 18),
        delay1hPayout: 1000,
        delay2hPayout: 3000,
        delay4hPayout: 5000,
        cancellationPayout: 10000,
      };
      
      const premium = ethers.parseUnits("50", 6);
      await usdc.connect(user1).approve(await policyManager.getAddress(), premium);
      
      await expect(policyManager.connect(user1).createPolicy(params, premium, 50))
        .to.be.revertedWithCustomError(policyManager, "FlightAlreadyDeparted");
    });
    
    it("Should return user policies", async function () {
      const { pool, policyManager, usdc, user1, owner } = await loadFixture(deployContractsFixture);
      
      // Seed pool
      const seedAmount = ethers.parseUnits("50000", 18);
      await usdc.connect(owner).approve(await pool.getAddress(), seedAmount);
      await pool.connect(owner).deposit(seedAmount);
      
      const currentTime = await time.latest();
      
      // Create multiple policies
      for (let i = 0; i < 3; i++) {
        const coverageAmount = ethers.parseUnits("500", 18);
        const params = {
          flightNumber: `AA10${i}`,
          departureTime: currentTime + 86400 + (i * 86400),
          arrivalTime: currentTime + 86400 + (i * 86400) + 18000,
          coverageAmount: coverageAmount,
          delay1hPayout: 1000,
          delay2hPayout: 3000,
          delay4hPayout: 5000,
          cancellationPayout: 10000,
        };
        
        // Premium = 5% of coverage
        const premium = (coverageAmount * 500n) / 10000n;
        await usdc.connect(user1).approve(await policyManager.getAddress(), premium);
        await policyManager.connect(user1).createPolicy(params, premium, 50);
      }
      
      const userPolicies = await policyManager.userPolicies(user1.address, 0);
      // Check at least one policy was created
      expect(userPolicies).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Access Control", function () {
    
    it("Should restrict pool premium collection to authorized roles", async function () {
      const { pool, user1 } = await loadFixture(deployContractsFixture);
      
      const policyId = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(pool.connect(user1).collectPremium(policyId, 1000, 500))
        .to.be.reverted; // Only POLICY_MANAGER_ROLE
    });
    
    it("Should allow admin to pause contracts", async function () {
      const { pool, owner, user1, usdc } = await loadFixture(deployContractsFixture);
      
      await pool.connect(owner).pause();
      
      const depositAmount = ethers.parseUnits("1000", 18);
      await usdc.connect(user1).approve(await pool.getAddress(), depositAmount);
      
      await expect(pool.connect(user1).deposit(depositAmount))
        .to.be.revertedWithCustomError(pool, "EnforcedPause");
    });
    
    it("Should allow admin to unpause contracts", async function () {
      const { pool, owner, user1, usdc } = await loadFixture(deployContractsFixture);
      
      await pool.connect(owner).pause();
      await pool.connect(owner).unpause();
      
      const depositAmount = ethers.parseUnits("1000", 18);
      await usdc.connect(user1).approve(await pool.getAddress(), depositAmount);
      
      await expect(pool.connect(user1).deposit(depositAmount))
        .to.emit(pool, "LiquidityDeposited");
    });
  });
});
