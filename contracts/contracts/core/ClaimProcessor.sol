// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PolicyManager.sol";

/**
 * @title ClaimProcessor
 * @author AeroShield Team
 * @notice Automated claim processor using Flare Data Connector attestations
 * @dev Handles batch processing of claims and integrates with FDC oracle
 */
contract ClaimProcessor is AccessControl, ReentrancyGuard {
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // ROLES
    // ═══════════════════════════════════════════════════════════════════════════════
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // ═══════════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════════════════
    struct ClaimRequest {
        bytes32 policyId;
        address claimant;
        uint256 requestedAmount;
        uint256 submittedAt;
        ClaimStatus status;
        bytes32 attestationId;
        string evidence;
    }

    enum ClaimStatus {
        Pending,
        AttestationRequested,
        Verified,
        Approved,
        Rejected,
        Paid
    }

    struct ProcessingConfig {
        uint256 minConfirmations;
        uint256 processingDelay;
        uint256 maxBatchSize;
        bool autoProcessEnabled;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════════
    PolicyManager public policyManager;
    ProcessingConfig public config;
    
    mapping(bytes32 => ClaimRequest) public claims;
    mapping(bytes32 => bytes32) public policyToClaim;
    bytes32[] public pendingClaims;
    
    uint256 public totalClaimsProcessed;
    uint256 public totalClaimsApproved;
    uint256 public totalClaimsRejected;

    // ═══════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    event ClaimSubmitted(bytes32 indexed claimId, bytes32 indexed policyId, address claimant);
    event ClaimVerified(bytes32 indexed claimId, bool verified);
    event ClaimApproved(bytes32 indexed claimId, uint256 amount);
    event ClaimRejected(bytes32 indexed claimId, string reason);
    event ClaimPaid(bytes32 indexed claimId, address recipient, uint256 amount);
    event BatchProcessed(uint256 count, uint256 approved, uint256 rejected);

    // ═══════════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════════
    error ClaimAlreadyExists();
    error ClaimNotFound();
    error InvalidClaimStatus();
    error NotPolicyHolder();
    error PolicyNotEligible();
    error ProcessingDelayNotMet();

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════════
    constructor(address _policyManager) {
        policyManager = PolicyManager(_policyManager);
        
        config = ProcessingConfig({
            minConfirmations: 1,
            processingDelay: 1 hours,
            maxBatchSize: 50,
            autoProcessEnabled: true
        });
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROCESSOR_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLAIM SUBMISSION
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Submit a claim for a policy
     * @param policyId The policy to claim against
     * @param evidence IPFS hash or description of supporting evidence
     */
    function submitClaim(
        bytes32 policyId,
        string calldata evidence
    ) external nonReentrant returns (bytes32 claimId) {
        // Get policy and verify ownership
        PolicyManager.Policy memory policy = policyManager.getPolicy(policyId);
        if (policy.holder != msg.sender) revert NotPolicyHolder();
        if (policy.status != PolicyManager.PolicyStatus.Active) revert PolicyNotEligible();
        
        // Check no existing claim
        if (policyToClaim[policyId] != bytes32(0)) revert ClaimAlreadyExists();
        
        // Generate claim ID
        claimId = keccak256(abi.encodePacked(
            policyId,
            msg.sender,
            block.timestamp,
            evidence
        ));
        
        // Create claim
        claims[claimId] = ClaimRequest({
            policyId: policyId,
            claimant: msg.sender,
            requestedAmount: 0, // Will be calculated based on attestation
            submittedAt: block.timestamp,
            status: ClaimStatus.Pending,
            attestationId: bytes32(0),
            evidence: evidence
        });
        
        policyToClaim[policyId] = claimId;
        pendingClaims.push(claimId);
        
        emit ClaimSubmitted(claimId, policyId, msg.sender);
        
        // Auto-request attestation if enabled
        if (config.autoProcessEnabled) {
            _requestAttestation(claimId);
        }
    }

    /**
     * @notice Request FDC attestation for a claim
     */
    function requestAttestation(bytes32 claimId) external onlyRole(PROCESSOR_ROLE) {
        _requestAttestation(claimId);
    }

    /**
     * @notice Process attestation result for a claim
     */
    function processAttestation(bytes32 claimId) external onlyRole(PROCESSOR_ROLE) {
        ClaimRequest storage claim = claims[claimId];
        if (claim.claimant == address(0)) revert ClaimNotFound();
        if (claim.status != ClaimStatus.AttestationRequested) revert InvalidClaimStatus();
        
        // Process through policy manager
        policyManager.processAttestation(claim.policyId);
        
        // Update claim status based on policy status
        PolicyManager.Policy memory policy = policyManager.getPolicy(claim.policyId);
        
        if (policy.status == PolicyManager.PolicyStatus.ClaimPaid) {
            claim.status = ClaimStatus.Paid;
            claim.requestedAmount = policy.claimAmount;
            totalClaimsApproved++;
            emit ClaimPaid(claimId, claim.claimant, policy.claimAmount);
        } else if (policy.status == PolicyManager.PolicyStatus.Expired) {
            claim.status = ClaimStatus.Rejected;
            totalClaimsRejected++;
            emit ClaimRejected(claimId, "No delay or cancellation verified");
        }
        
        totalClaimsProcessed++;
    }

    /**
     * @notice Batch process pending claims
     */
    function batchProcess() external onlyRole(PROCESSOR_ROLE) {
        uint256 processed = 0;
        uint256 approved = 0;
        uint256 rejected = 0;
        
        uint256 maxProcess = pendingClaims.length > config.maxBatchSize 
            ? config.maxBatchSize 
            : pendingClaims.length;
        
        for (uint256 i = 0; i < maxProcess; i++) {
            bytes32 claimId = pendingClaims[i];
            ClaimRequest storage claim = claims[claimId];
            
            // Skip if not ready
            if (block.timestamp < claim.submittedAt + config.processingDelay) {
                continue;
            }
            
            try this.processAttestation(claimId) {
                if (claim.status == ClaimStatus.Paid) {
                    approved++;
                } else if (claim.status == ClaimStatus.Rejected) {
                    rejected++;
                }
                processed++;
            } catch {
                // Continue with next claim
            }
        }
        
        emit BatchProcessed(processed, approved, rejected);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    function getClaim(bytes32 claimId) external view returns (ClaimRequest memory) {
        return claims[claimId];
    }

    function getPendingClaimsCount() external view returns (uint256) {
        return pendingClaims.length;
    }

    function getClaimByPolicy(bytes32 policyId) external view returns (ClaimRequest memory) {
        bytes32 claimId = policyToClaim[policyId];
        return claims[claimId];
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    function updateConfig(ProcessingConfig calldata _config) external onlyRole(DEFAULT_ADMIN_ROLE) {
        config = _config;
    }

    function setPolicyManager(address _policyManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        policyManager = PolicyManager(_policyManager);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    function _requestAttestation(bytes32 claimId) internal {
        ClaimRequest storage claim = claims[claimId];
        if (claim.claimant == address(0)) revert ClaimNotFound();
        if (claim.status != ClaimStatus.Pending) revert InvalidClaimStatus();
        
        // Request attestation through policy manager
        bytes32 attestationId = policyManager.requestFlightAttestation(claim.policyId);
        
        claim.attestationId = attestationId;
        claim.status = ClaimStatus.AttestationRequested;
    }
}
