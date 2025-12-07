// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IFlareDataConnector.sol";

/**
 * @title InsurancePool
 * @author AeroShield Team
 * @notice Liquidity pool for parametric flight insurance on Flare Network
 * @dev Manages LP deposits, premium collection, and claim payouts
 */
contract InsurancePool is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ═══════════════════════════════════════════════════════════════════════════════
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant POLICY_MANAGER_ROLE = keccak256("POLICY_MANAGER_ROLE");

    // ═══════════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════════════════
    struct PoolStats {
        uint256 totalDeposits;
        uint256 totalPremiums;
        uint256 totalPayouts;
        uint256 reserveRatio;
        uint256 utilizationRate;
    }

    struct LiquidityProvider {
        uint256 depositAmount;
        uint256 shareBalance;
        uint256 lastDepositTime;
        uint256 earnedYield;
        uint256 claimedYield;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Core pool state
    IERC20 public immutable depositToken;
    uint256 public totalShares;
    uint256 public totalLiquidity;
    uint256 public reservedLiquidity;
    
    // Pool parameters
    uint256 public minDeposit;
    uint256 public maxUtilization; // Basis points (e.g., 8000 = 80%)
    uint256 public withdrawalCooldown;
    uint256 public yieldDistributionInterval;
    
    // Statistics
    uint256 public totalPremiumsCollected;
    uint256 public totalClaimsPaid;
    uint256 public lastYieldDistribution;
    
    // Mappings
    mapping(address => LiquidityProvider) public liquidityProviders;
    address[] public lpList;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    event LiquidityDeposited(address indexed provider, uint256 amount, uint256 shares);
    event LiquidityWithdrawn(address indexed provider, uint256 amount, uint256 shares);
    event PremiumCollected(bytes32 indexed policyId, uint256 amount);
    event ClaimPaid(bytes32 indexed policyId, address indexed beneficiary, uint256 amount);
    event YieldDistributed(uint256 totalYield, uint256 timestamp);
    event ReserveUpdated(bytes32 indexed policyId, uint256 reserveAmount, bool isReserve);
    event PoolParametersUpdated(uint256 minDeposit, uint256 maxUtilization, uint256 cooldown);

    // ═══════════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════════
    error InsufficientDeposit();
    error InsufficientLiquidity();
    error WithdrawalCooldownActive();
    error MaxUtilizationExceeded();
    error InvalidAmount();
    error NoSharesOwned();
    error InsufficientShares();

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════════
    constructor(
        address _depositToken,
        uint256 _minDeposit,
        uint256 _maxUtilization,
        uint256 _withdrawalCooldown
    ) {
        depositToken = IERC20(_depositToken);
        minDeposit = _minDeposit;
        maxUtilization = _maxUtilization;
        withdrawalCooldown = _withdrawalCooldown;
        yieldDistributionInterval = 1 days;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // LP FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deposit liquidity into the pool
     * @param amount Amount of tokens to deposit
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount < minDeposit) revert InsufficientDeposit();
        
        // Calculate shares
        uint256 shares = _calculateShares(amount);
        
        // Transfer tokens
        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update LP state
        LiquidityProvider storage lp = liquidityProviders[msg.sender];
        if (lp.depositAmount == 0) {
            lpList.push(msg.sender);
        }
        lp.depositAmount += amount;
        lp.shareBalance += shares;
        lp.lastDepositTime = block.timestamp;
        
        // Update pool state
        totalShares += shares;
        totalLiquidity += amount;
        
        emit LiquidityDeposited(msg.sender, amount, shares);
    }

    /**
     * @notice Withdraw liquidity from the pool
     * @param shares Number of shares to redeem
     */
    function withdraw(uint256 shares) external nonReentrant whenNotPaused {
        LiquidityProvider storage lp = liquidityProviders[msg.sender];
        
        if (lp.shareBalance == 0) revert NoSharesOwned();
        if (shares > lp.shareBalance) revert InsufficientShares();
        if (block.timestamp < lp.lastDepositTime + withdrawalCooldown) {
            revert WithdrawalCooldownActive();
        }
        
        // Calculate withdrawal amount
        uint256 amount = _calculateWithdrawalAmount(shares);
        
        // Check available liquidity
        uint256 availableLiquidity = totalLiquidity - reservedLiquidity;
        if (amount > availableLiquidity) revert InsufficientLiquidity();
        
        // Update LP state
        lp.shareBalance -= shares;
        lp.depositAmount = lp.depositAmount > amount ? lp.depositAmount - amount : 0;
        
        // Update pool state
        totalShares -= shares;
        totalLiquidity -= amount;
        
        // Transfer tokens
        depositToken.safeTransfer(msg.sender, amount);
        
        emit LiquidityWithdrawn(msg.sender, amount, shares);
    }

    /**
     * @notice Claim accumulated yield
     */
    function claimYield() external nonReentrant {
        LiquidityProvider storage lp = liquidityProviders[msg.sender];
        uint256 claimable = lp.earnedYield - lp.claimedYield;
        
        if (claimable == 0) revert InvalidAmount();
        
        lp.claimedYield += claimable;
        depositToken.safeTransfer(msg.sender, claimable);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // POLICY MANAGER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Collect premium for a policy
     * @param policyId Unique policy identifier
     * @param amount Premium amount
     * @param maxPayout Maximum potential payout for the policy
     */
    function collectPremium(
        bytes32 policyId,
        uint256 amount,
        uint256 maxPayout
    ) external onlyRole(POLICY_MANAGER_ROLE) nonReentrant {
        // Check utilization won't exceed max
        uint256 newReserved = reservedLiquidity + maxPayout;
        uint256 utilization = (newReserved * 10000) / totalLiquidity;
        if (utilization > maxUtilization) revert MaxUtilizationExceeded();
        
        // Transfer premium
        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update state
        totalPremiumsCollected += amount;
        totalLiquidity += amount;
        reservedLiquidity += maxPayout;
        
        emit PremiumCollected(policyId, amount);
        emit ReserveUpdated(policyId, maxPayout, true);
    }

    /**
     * @notice Pay out a claim
     * @param policyId Policy identifier
     * @param beneficiary Address to receive payout
     * @param amount Payout amount
     * @param maxPayout Original reserved amount
     */
    function payClaim(
        bytes32 policyId,
        address beneficiary,
        uint256 amount,
        uint256 maxPayout
    ) external onlyRole(POLICY_MANAGER_ROLE) nonReentrant {
        if (amount > totalLiquidity) revert InsufficientLiquidity();
        
        // Release reserve and pay claim
        reservedLiquidity -= maxPayout;
        totalLiquidity -= amount;
        totalClaimsPaid += amount;
        
        depositToken.safeTransfer(beneficiary, amount);
        
        emit ClaimPaid(policyId, beneficiary, amount);
        emit ReserveUpdated(policyId, maxPayout, false);
    }

    /**
     * @notice Release reserve for expired/completed policy with no claim
     * @param policyId Policy identifier
     * @param maxPayout Reserved amount to release
     */
    function releaseReserve(
        bytes32 policyId,
        uint256 maxPayout
    ) external onlyRole(POLICY_MANAGER_ROLE) {
        reservedLiquidity -= maxPayout;
        emit ReserveUpdated(policyId, maxPayout, false);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // OPERATOR FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Distribute yield to liquidity providers
     */
    function distributeYield() external onlyRole(OPERATOR_ROLE) {
        if (block.timestamp < lastYieldDistribution + yieldDistributionInterval) {
            return;
        }
        
        uint256 yieldToDistribute = totalPremiumsCollected - totalClaimsPaid;
        if (yieldToDistribute == 0 || totalShares == 0) return;
        
        // Calculate and distribute to each LP proportionally
        for (uint256 i = 0; i < lpList.length; i++) {
            address lpAddress = lpList[i];
            LiquidityProvider storage lp = liquidityProviders[lpAddress];
            
            if (lp.shareBalance > 0) {
                uint256 lpYield = (yieldToDistribute * lp.shareBalance) / totalShares;
                lp.earnedYield += lpYield;
            }
        }
        
        lastYieldDistribution = block.timestamp;
        emit YieldDistributed(yieldToDistribute, block.timestamp);
    }

    /**
     * @notice Update pool parameters
     */
    function updatePoolParameters(
        uint256 _minDeposit,
        uint256 _maxUtilization,
        uint256 _withdrawalCooldown
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minDeposit = _minDeposit;
        maxUtilization = _maxUtilization;
        withdrawalCooldown = _withdrawalCooldown;
        
        emit PoolParametersUpdated(_minDeposit, _maxUtilization, _withdrawalCooldown);
    }

    /**
     * @notice Pause pool operations
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause pool operations
     */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get pool statistics
     */
    function getPoolStats() external view returns (PoolStats memory) {
        uint256 utilizationRate = totalLiquidity > 0 
            ? (reservedLiquidity * 10000) / totalLiquidity 
            : 0;
            
        return PoolStats({
            totalDeposits: totalLiquidity,
            totalPremiums: totalPremiumsCollected,
            totalPayouts: totalClaimsPaid,
            reserveRatio: maxUtilization,
            utilizationRate: utilizationRate
        });
    }

    /**
     * @notice Get LP information
     */
    function getLPInfo(address lpAddress) external view returns (
        uint256 depositAmount,
        uint256 shareBalance,
        uint256 currentValue,
        uint256 earnedYield,
        uint256 claimableYield
    ) {
        LiquidityProvider storage lp = liquidityProviders[lpAddress];
        
        return (
            lp.depositAmount,
            lp.shareBalance,
            _calculateWithdrawalAmount(lp.shareBalance),
            lp.earnedYield,
            lp.earnedYield - lp.claimedYield
        );
    }

    /**
     * @notice Get available liquidity for new policies
     */
    function getAvailableLiquidity() external view returns (uint256) {
        uint256 maxReservable = (totalLiquidity * maxUtilization) / 10000;
        return maxReservable > reservedLiquidity ? maxReservable - reservedLiquidity : 0;
    }

    /**
     * @notice Calculate share price
     */
    function getSharePrice() external view returns (uint256) {
        if (totalShares == 0) return 1e18;
        return (totalLiquidity * 1e18) / totalShares;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    function _calculateShares(uint256 amount) internal view returns (uint256) {
        if (totalShares == 0 || totalLiquidity == 0) {
            return amount;
        }
        return (amount * totalShares) / totalLiquidity;
    }

    function _calculateWithdrawalAmount(uint256 shares) internal view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares * totalLiquidity) / totalShares;
    }
}
