// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockFDC
 * @notice Mock Flare Data Connector for testing
 * @dev Simulates FDC attestation responses for flight data
 */
contract MockFDC {
    
    struct AttestationRequest {
        bytes32 attestationType;
        bytes32 sourceId;
        bytes requestBody;
    }

    struct AttestationResponse {
        bytes32 attestationType;
        bytes32 sourceId;
        uint64 votingRound;
        uint64 lowestUsedTimestamp;
        bytes requestBody;
        bytes responseBody;
    }

    mapping(bytes32 => AttestationResponse) public attestations;
    mapping(bytes32 => bool) public finalized;
    
    uint256 private _nonce;

    event AttestationRequested(bytes32 indexed requestId, bytes32 attestationType);
    event AttestationFinalized(bytes32 indexed requestId);

    function requestAttestation(
        AttestationRequest calldata request
    ) external returns (bytes32 requestId) {
        requestId = keccak256(abi.encodePacked(
            request.attestationType,
            request.sourceId,
            request.requestBody,
            block.timestamp,
            _nonce++
        ));

        attestations[requestId] = AttestationResponse({
            attestationType: request.attestationType,
            sourceId: request.sourceId,
            votingRound: uint64(block.number),
            lowestUsedTimestamp: uint64(block.timestamp),
            requestBody: request.requestBody,
            responseBody: "" // Empty until set
        });

        emit AttestationRequested(requestId, request.attestationType);
    }

    /**
     * @notice Set attestation response (for testing)
     */
    function setAttestationResponse(
        bytes32 requestId,
        uint16 delayMinutes,
        bool isCancelled
    ) external {
        AttestationResponse storage response = attestations[requestId];
        
        // Decode original request to get flight info
        (string memory flightNumber, uint64 flightDate) = abi.decode(
            response.requestBody,
            (string, uint64)
        );
        
        // Create response body
        response.responseBody = abi.encode(
            flightNumber,           // flightNumber
            flightDate,             // scheduledDeparture
            flightDate + (delayMinutes * 60), // actualDeparture
            flightDate + 7200,      // scheduledArrival (2h later)
            flightDate + 7200 + (delayMinutes * 60), // actualArrival
            delayMinutes > 0 ? uint8(1) : uint8(0),  // status
            delayMinutes,           // delayMinutes
            isCancelled            // isCancelled
        );
        
        finalized[requestId] = true;
        emit AttestationFinalized(requestId);
    }

    /**
     * @notice Set raw attestation response (for advanced testing)
     */
    function setRawResponse(
        bytes32 requestId,
        bytes calldata responseBody
    ) external {
        attestations[requestId].responseBody = responseBody;
        finalized[requestId] = true;
        emit AttestationFinalized(requestId);
    }

    function getAttestation(bytes32 requestId) 
        external 
        view 
        returns (AttestationResponse memory) 
    {
        return attestations[requestId];
    }

    function isAttestationFinalized(bytes32 requestId) 
        external 
        view 
        returns (bool) 
    {
        return finalized[requestId];
    }
}
