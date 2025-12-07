// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IFlareDataConnector.sol";
import "../libraries/FlightDataLib.sol";
import "./InsurancePool.sol";

/**
 * @title PolicyManager
 * @author AeroShield Team
 * @notice Manages parametric flight insurance policies as NFTs on Flare Network
 * @dev Integrates with FDC for flight data attestations and auto-triggers payouts
 */
contract PolicyManager is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    AccessControl, 
    ReentrancyGuard, 
    Pausable 
{
    using SafeERC20 for IERC20;
    using FlightDataLib for bytes;

    // ═══════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ═══════════════════════════════════════════════════════════════════════════════
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // ═══════════════════════════════════════════════════════════════════════════════
    // ENUMS
    // ═══════════════════════════════════════════════════════════════════════════════
    enum PolicyStatus {
        Pending,
        Active,
        Triggered,
        ClaimPaid,
        Expired,
        Cancelled
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════════════════
    struct Policy {
        bytes32 policyId;
        address holder;
        string flightNumber;
        uint64 departureTime;
        uint64 arrivalTime;
        uint256 coverageAmount;
        uint256 premiumPaid;
        PolicyStatus status;
        uint16 delay1hPayout;    // Basis points
        uint16 delay2hPayout;    // Basis points
        uint16 delay4hPayout;    // Basis points
        uint16 cancellationPayout; // Basis points
        uint256 createdAt;
        uint256 claimAmount;
        bytes32 attestationId;
    }

    struct PolicyParams {
        string flightNumber;
        uint64 departureTime;
        uint64 arrivalTime;
        uint256 coverageAmount;
        uint16 delay1hPayout;
        uint16 delay2hPayout;
        uint16 delay4hPayout;
        uint16 cancellationPayout;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    InsurancePool public immutable insurancePool;
    IERC20 public immutable paymentToken;
    IFlareDataConnector public fdcConnector;
    
    // FDC configuration
    bytes32 public constant FLIGHT_ATTESTATION_TYPE = keccak256("FlightStatus");
    bytes32 public constant FDC_SOURCE_ID = keccak256("AviationAPI");
    
    // Policy storage
    uint256 private _nextTokenId;
    mapping(bytes32 => Policy) public policies;
    mapping(uint256 => bytes32) public tokenToPolicy;
    mapping(address => bytes32[]) public userPolicies;
    mapping(bytes32 => bool) public attestationProcessed;
    
    // Risk parameters
    uint256 public minCoverage;
    uint256 public maxCoverage;
    uint256 public minPremiumRate; // Basis points
    uint256 public maxPremiumRate; // Basis points
    
    // Statistics
    uint256 public totalPoliciesIssued;
    uint256 public totalPremiumsCollected;
    uint256 public totalClaimsPaid;

    // ═══════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    event PolicyCreated(
        bytes32 indexed policyId,
        address indexed holder,
        string flightNumber,
        uint256 coverageAmount,
        uint256 premium
    );
    event PolicyActivated(bytes32 indexed policyId);
    event PolicyTriggered(bytes32 indexed policyId, uint16 delayMinutes, bool isCancelled);
    event ClaimPaid(bytes32 indexed policyId, address indexed holder, uint256 amount);
    event PolicyExpired(bytes32 indexed policyId);
    event AttestationRequested(bytes32 indexed policyId, bytes32 attestationId);
    event AttestationReceived(bytes32 indexed policyId, bytes32 attestationId);

    // ═══════════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════════
    error InvalidCoverageAmount();
    error InvalidPremium();
    error PolicyNotFound();
    error PolicyNotActive();
    error InvalidPolicyStatus();
    error FlightAlreadyDeparted();
    error AttestationNotFinalized();
    error AttestationAlreadyProcessed();
    error Unauthorized();

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════════
    constructor(
        address _insurancePool,
        address _paymentToken,
        address _fdcConnector
    ) ERC721("AeroShield Policy", "AERO") {
        insurancePool = InsurancePool(_insurancePool);
        paymentToken = IERC20(_paymentToken);
        fdcConnector = IFlareDataConnector(_fdcConnector);
        
        minCoverage = 100 * 1e18;      // $100 minimum
        maxCoverage = 10000 * 1e18;    // $10,000 maximum
        minPremiumRate = 200;           // 2%
        maxPremiumRate = 1500;          // 15%
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // POLICY CREATION
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Create a new insurance policy
     * @param params Policy parameters
     * @param premium Calculated premium amount
     * @param aiRiskScore AI-calculated risk score (0-100)
     */
    function createPolicy(
        PolicyParams calldata params,
        uint256 premium,
        uint8 aiRiskScore
    ) external nonReentrant whenNotPaused returns (bytes32 policyId) {
        // Validations
        if (params.coverageAmount < minCoverage || params.coverageAmount > maxCoverage) {
            revert InvalidCoverageAmount();
        }
        if (params.departureTime <= block.timestamp) {
            revert FlightAlreadyDeparted();
        }
        
        // Validate premium is within acceptable range
        uint256 minPremium = (params.coverageAmount * minPremiumRate) / 10000;
        uint256 maxPremium = (params.coverageAmount * maxPremiumRate) / 10000;
        if (premium < minPremium || premium > maxPremium) {
            revert InvalidPremium();
        }

        // Generate unique policy ID
        policyId = keccak256(abi.encodePacked(
            msg.sender,
            params.flightNumber,
            params.departureTime,
            block.timestamp,
            _nextTokenId
        ));

        // Calculate max payout (highest tier)
        uint256 maxPayout = (params.coverageAmount * params.cancellationPayout) / 10000;
        
        // Transfer premium from user
        paymentToken.safeTransferFrom(msg.sender, address(this), premium);
        
        // Approve and send to pool
        paymentToken.approve(address(insurancePool), premium);
        insurancePool.collectPremium(policyId, premium, maxPayout);

        // Create policy
        policies[policyId] = Policy({
            policyId: policyId,
            holder: msg.sender,
            flightNumber: params.flightNumber,
            departureTime: params.departureTime,
            arrivalTime: params.arrivalTime,
            coverageAmount: params.coverageAmount,
            premiumPaid: premium,
            status: PolicyStatus.Active,
            delay1hPayout: params.delay1hPayout,
            delay2hPayout: params.delay2hPayout,
            delay4hPayout: params.delay4hPayout,
            cancellationPayout: params.cancellationPayout,
            createdAt: block.timestamp,
            claimAmount: 0,
            attestationId: bytes32(0)
        });

        // Mint policy NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        tokenToPolicy[tokenId] = policyId;
        userPolicies[msg.sender].push(policyId);

        // Update statistics
        totalPoliciesIssued++;
        totalPremiumsCollected += premium;

        emit PolicyCreated(policyId, msg.sender, params.flightNumber, params.coverageAmount, premium);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ATTESTATION & CLAIMS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Request flight status attestation from FDC
     * @param policyId Policy to check
     */
    function requestFlightAttestation(bytes32 policyId) 
        external 
        onlyRole(OPERATOR_ROLE) 
        returns (bytes32 attestationId) 
    {
        Policy storage policy = policies[policyId];
        if (policy.holder == address(0)) revert PolicyNotFound();
        if (policy.status != PolicyStatus.Active) revert PolicyNotActive();
        if (block.timestamp < policy.arrivalTime) revert InvalidPolicyStatus();

        // Prepare FDC request
        bytes memory requestBody = FlightDataLib.encodeFlightRequest(
            policy.flightNumber,
            policy.departureTime
        );

        IFlareDataConnector.AttestationRequest memory request = IFlareDataConnector.AttestationRequest({
            attestationType: FLIGHT_ATTESTATION_TYPE,
            sourceId: FDC_SOURCE_ID,
            requestBody: requestBody
        });

        // Submit to FDC
        attestationId = fdcConnector.requestAttestation(request);
        policy.attestationId = attestationId;

        emit AttestationRequested(policyId, attestationId);
    }

    /**
     * @notice Process completed attestation and trigger payout if applicable
     * @param policyId Policy to process
     */
    function processAttestation(bytes32 policyId) external nonReentrant {
        Policy storage policy = policies[policyId];
        if (policy.holder == address(0)) revert PolicyNotFound();
        if (policy.status != PolicyStatus.Active) revert PolicyNotActive();
        if (policy.attestationId == bytes32(0)) revert AttestationNotFinalized();
        if (attestationProcessed[policy.attestationId]) revert AttestationAlreadyProcessed();

        // Check attestation is finalized
        if (!fdcConnector.isAttestationFinalized(policy.attestationId)) {
            revert AttestationNotFinalized();
        }

        // Get attestation response
        IFlareDataConnector.AttestationResponse memory response = 
            fdcConnector.getAttestation(policy.attestationId);

        // Decode flight data
        FlightDataLib.FlightData memory flightData = 
            FlightDataLib.decodeFlightResponse(response.responseBody);

        attestationProcessed[policy.attestationId] = true;
        emit AttestationReceived(policyId, policy.attestationId);

        // Calculate payout
        uint256 payoutAmount = 0;
        
        if (flightData.isCancelled) {
            payoutAmount = FlightDataLib.calculateCancellationPayout(
                policy.coverageAmount,
                policy.cancellationPayout
            );
            policy.status = PolicyStatus.Triggered;
            emit PolicyTriggered(policyId, 0, true);
        } else if (flightData.delayMinutes > 0) {
            payoutAmount = FlightDataLib.calculateDelayPayout(
                flightData.delayMinutes,
                policy.coverageAmount,
                policy.delay1hPayout,
                policy.delay2hPayout,
                policy.delay4hPayout,
                policy.cancellationPayout
            );
            if (payoutAmount > 0) {
                policy.status = PolicyStatus.Triggered;
                emit PolicyTriggered(policyId, flightData.delayMinutes, false);
            }
        }

        // Process payout if applicable
        if (payoutAmount > 0) {
            _processPayout(policyId, payoutAmount);
        } else {
            // No delay/cancellation - expire policy
            policy.status = PolicyStatus.Expired;
            uint256 maxPayout = (policy.coverageAmount * policy.cancellationPayout) / 10000;
            insurancePool.releaseReserve(policyId, maxPayout);
            emit PolicyExpired(policyId);
        }
    }

    /**
     * @notice Emergency manual claim processing (admin only)
     * @param policyId Policy to process
     * @param delayMinutes Verified delay in minutes
     * @param isCancelled Whether flight was cancelled
     */
    function manualClaimProcess(
        bytes32 policyId,
        uint16 delayMinutes,
        bool isCancelled
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        Policy storage policy = policies[policyId];
        if (policy.holder == address(0)) revert PolicyNotFound();
        if (policy.status != PolicyStatus.Active) revert PolicyNotActive();

        uint256 payoutAmount = 0;
        
        if (isCancelled) {
            payoutAmount = FlightDataLib.calculateCancellationPayout(
                policy.coverageAmount,
                policy.cancellationPayout
            );
        } else if (delayMinutes > 0) {
            payoutAmount = FlightDataLib.calculateDelayPayout(
                delayMinutes,
                policy.coverageAmount,
                policy.delay1hPayout,
                policy.delay2hPayout,
                policy.delay4hPayout,
                policy.cancellationPayout
            );
        }

        if (payoutAmount > 0) {
            policy.status = PolicyStatus.Triggered;
            emit PolicyTriggered(policyId, delayMinutes, isCancelled);
            _processPayout(policyId, payoutAmount);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get policy details
     */
    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    /**
     * @notice Get all policies for a user
     */
    function getUserPolicies(address user) external view returns (bytes32[] memory) {
        return userPolicies[user];
    }

    /**
     * @notice Get policy by token ID
     */
    function getPolicyByToken(uint256 tokenId) external view returns (Policy memory) {
        bytes32 policyId = tokenToPolicy[tokenId];
        return policies[policyId];
    }

    /**
     * @notice Calculate potential payout for delay
     */
    function calculatePotentialPayout(
        bytes32 policyId,
        uint16 delayMinutes,
        bool isCancelled
    ) external view returns (uint256) {
        Policy storage policy = policies[policyId];
        
        if (isCancelled) {
            return FlightDataLib.calculateCancellationPayout(
                policy.coverageAmount,
                policy.cancellationPayout
            );
        }
        
        return FlightDataLib.calculateDelayPayout(
            delayMinutes,
            policy.coverageAmount,
            policy.delay1hPayout,
            policy.delay2hPayout,
            policy.delay4hPayout,
            policy.cancellationPayout
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    function setFDCConnector(address _fdcConnector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fdcConnector = IFlareDataConnector(_fdcConnector);
    }

    function setCoverageRange(uint256 _min, uint256 _max) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minCoverage = _min;
        maxCoverage = _max;
    }

    function setPremiumRateRange(uint256 _min, uint256 _max) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minPremiumRate = _min;
        maxPremiumRate = _max;
    }

    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    function _processPayout(bytes32 policyId, uint256 payoutAmount) internal {
        Policy storage policy = policies[policyId];
        
        policy.claimAmount = payoutAmount;
        policy.status = PolicyStatus.ClaimPaid;
        
        uint256 maxPayout = (policy.coverageAmount * policy.cancellationPayout) / 10000;
        
        insurancePool.payClaim(policyId, policy.holder, payoutAmount, maxPayout);
        
        totalClaimsPaid += payoutAmount;
        
        emit ClaimPaid(policyId, policy.holder, payoutAmount);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // OVERRIDES
    // ═══════════════════════════════════════════════════════════════════════════════

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
