// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {IFdcVerification} from "@flarenetwork/flare-periphery-contracts/coston2/IFdcVerification.sol";
import {IEVMTransaction} from "@flarenetwork/flare-periphery-contracts/coston2/IEVMTransaction.sol";

/**
 * @title FDCFlightVerifier
 * @author AeroShield Team
 * @notice Verifies flight data using Flare Data Connector attestations
 * @dev Integrates with FDC to verify external flight data for parametric insurance
 */
contract FDCFlightVerifier {
    // ═══════════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    struct FlightEvent {
        string flightNumber;
        uint256 scheduledDeparture;
        uint256 actualDeparture;
        uint256 scheduledArrival;
        uint256 actualArrival;
        FlightStatus status;
        uint256 delayMinutes;
        bytes32 attestationHash;
        uint64 verifiedAt;
    }

    enum FlightStatus {
        Unknown,
        OnTime,
        Delayed,
        Cancelled,
        Diverted
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Flight number hash => Flight event data
    mapping(bytes32 => FlightEvent[]) public flightEvents;
    
    // Attestation hash => verified status
    mapping(bytes32 => bool) public verifiedAttestations;
    
    // Policy ID => Flight event index
    mapping(bytes32 => bytes32) public policyFlightMapping;

    // Flight data source contract address (for filtering events)
    address public flightDataSource;

    // ═══════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    event FlightDataVerified(
        bytes32 indexed flightHash,
        string flightNumber,
        FlightStatus status,
        uint256 delayMinutes,
        bytes32 attestationHash
    );
    
    event AttestationProcessed(
        bytes32 indexed attestationHash,
        bool success,
        uint64 timestamp
    );

    // ═══════════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    error InvalidProof();
    error AttestationAlreadyProcessed();
    error InvalidFlightData();
    error UnauthorizedSource();

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════════
    
    constructor(address _flightDataSource) {
        flightDataSource = _flightDataSource;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EXTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Verify and process flight data from FDC attestation
     * @param _transaction The FDC proof containing flight event data
     * @dev This function verifies the Merkle proof and extracts flight data
     */
    function verifyFlightData(
        IEVMTransaction.Proof calldata _transaction
    ) external {
        // 1. Verify the FDC attestation proof
        if (!isEVMTransactionProofValid(_transaction)) {
            revert InvalidProof();
        }

        bytes32 attestationHash = keccak256(
            abi.encode(_transaction.data.requestBody.transactionHash)
        );

        if (verifiedAttestations[attestationHash]) {
            revert AttestationAlreadyProcessed();
        }

        // 2. Process events from the verified transaction
        IEVMTransaction.Event[] memory events = _transaction.data.responseBody.events;
        
        for (uint256 i = 0; i < events.length; i++) {
            IEVMTransaction.Event memory evt = events[i];
            
            // Filter for flight data events from authorized source
            if (evt.emitterAddress == flightDataSource && evt.topics.length > 0) {
                // Check for FlightStatusUpdate event signature
                bytes32 flightEventSig = keccak256("FlightStatusUpdate(string,uint256,uint256,uint8)");
                
                if (evt.topics[0] == flightEventSig) {
                    _processFlightEvent(evt, attestationHash);
                }
            }
        }

        // Mark attestation as processed
        verifiedAttestations[attestationHash] = true;
        
        emit AttestationProcessed(
            attestationHash,
            true,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Manually submit flight data with proof (for testing)
     * @param flightNumber The flight number
     * @param scheduledDeparture Scheduled departure timestamp
     * @param actualDeparture Actual departure timestamp
     * @param scheduledArrival Scheduled arrival timestamp
     * @param actualArrival Actual arrival timestamp
     * @param status Flight status
     */
    function submitFlightData(
        string calldata flightNumber,
        uint256 scheduledDeparture,
        uint256 actualDeparture,
        uint256 scheduledArrival,
        uint256 actualArrival,
        FlightStatus status
    ) external {
        bytes32 flightHash = keccak256(abi.encodePacked(flightNumber, scheduledDeparture));
        
        uint256 delayMinutes = 0;
        if (actualArrival > scheduledArrival) {
            delayMinutes = (actualArrival - scheduledArrival) / 60;
        }
        
        // Determine status based on delay if not explicitly cancelled/diverted
        FlightStatus finalStatus = status;
        if (status == FlightStatus.Unknown) {
            if (actualArrival == 0) {
                finalStatus = FlightStatus.Cancelled;
            } else if (delayMinutes >= 60) {
                finalStatus = FlightStatus.Delayed;
            } else {
                finalStatus = FlightStatus.OnTime;
            }
        }

        FlightEvent memory newEvent = FlightEvent({
            flightNumber: flightNumber,
            scheduledDeparture: scheduledDeparture,
            actualDeparture: actualDeparture,
            scheduledArrival: scheduledArrival,
            actualArrival: actualArrival,
            status: finalStatus,
            delayMinutes: delayMinutes,
            attestationHash: bytes32(0), // Manual submission
            verifiedAt: uint64(block.timestamp)
        });

        flightEvents[flightHash].push(newEvent);

        emit FlightDataVerified(
            flightHash,
            flightNumber,
            finalStatus,
            delayMinutes,
            bytes32(0)
        );
    }

    /**
     * @notice Get flight event data by flight number and date
     * @param flightNumber The flight number
     * @param scheduledDeparture The scheduled departure timestamp
     * @return The most recent flight event data
     */
    function getFlightEvent(
        string calldata flightNumber,
        uint256 scheduledDeparture
    ) external view returns (FlightEvent memory) {
        bytes32 flightHash = keccak256(abi.encodePacked(flightNumber, scheduledDeparture));
        FlightEvent[] storage events = flightEvents[flightHash];
        
        require(events.length > 0, "No flight data found");
        return events[events.length - 1];
    }

    /**
     * @notice Check if a flight qualifies for a claim based on delay
     * @param flightNumber The flight number
     * @param scheduledDeparture The scheduled departure timestamp
     * @param minimumDelayMinutes Minimum delay required for claim
     * @return eligible Whether the flight is eligible for claim
     * @return delayMinutes Actual delay in minutes
     * @return status Flight status
     */
    function checkClaimEligibility(
        string calldata flightNumber,
        uint256 scheduledDeparture,
        uint256 minimumDelayMinutes
    ) external view returns (bool eligible, uint256 delayMinutes, FlightStatus status) {
        bytes32 flightHash = keccak256(abi.encodePacked(flightNumber, scheduledDeparture));
        FlightEvent[] storage events = flightEvents[flightHash];
        
        if (events.length == 0) {
            return (false, 0, FlightStatus.Unknown);
        }
        
        FlightEvent storage latestEvent = events[events.length - 1];
        
        // Cancelled flights are always eligible
        if (latestEvent.status == FlightStatus.Cancelled) {
            return (true, 0, FlightStatus.Cancelled);
        }
        
        // Check delay threshold
        eligible = latestEvent.delayMinutes >= minimumDelayMinutes;
        return (eligible, latestEvent.delayMinutes, latestEvent.status);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Verify FDC proof using ContractRegistry
     * @param transaction The transaction proof to verify
     * @return bool Whether the proof is valid
     */
    function isEVMTransactionProofValid(
        IEVMTransaction.Proof calldata transaction
    ) public view returns (bool) {
        // Get the FDC verification contract from Flare's ContractRegistry
        IFdcVerification fdc = ContractRegistry.getFdcVerification();
        return fdc.verifyEVMTransaction(transaction);
    }

    /**
     * @notice Process a flight event from FDC attestation
     * @param evt The event data from the attestation
     * @param attestationHash The hash of the attestation
     */
    function _processFlightEvent(
        IEVMTransaction.Event memory evt,
        bytes32 attestationHash
    ) internal {
        // Decode event data
        // Expected format: FlightStatusUpdate(string flightNumber, uint256 actualArrival, uint256 scheduledArrival, uint8 status)
        (
            string memory flightNumber,
            uint256 actualArrival,
            uint256 scheduledArrival,
            uint8 statusCode
        ) = abi.decode(evt.data, (string, uint256, uint256, uint8));

        // Calculate delay
        uint256 delayMinutes = 0;
        if (actualArrival > scheduledArrival) {
            delayMinutes = (actualArrival - scheduledArrival) / 60;
        }

        // Create flight event
        bytes32 flightHash = keccak256(abi.encodePacked(flightNumber, scheduledArrival - 1 days)); // Approximate departure
        
        FlightEvent memory newEvent = FlightEvent({
            flightNumber: flightNumber,
            scheduledDeparture: scheduledArrival - 1 days, // Estimated
            actualDeparture: 0, // Not available from this event
            scheduledArrival: scheduledArrival,
            actualArrival: actualArrival,
            status: FlightStatus(statusCode),
            delayMinutes: delayMinutes,
            attestationHash: attestationHash,
            verifiedAt: uint64(block.timestamp)
        });

        flightEvents[flightHash].push(newEvent);

        emit FlightDataVerified(
            flightHash,
            flightNumber,
            FlightStatus(statusCode),
            delayMinutes,
            attestationHash
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update the flight data source address
     * @param _newSource New source contract address
     */
    function setFlightDataSource(address _newSource) external {
        flightDataSource = _newSource;
    }
}
