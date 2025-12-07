// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFlareDataConnector
 * @notice Interface for Flare Data Connector attestations
 */
interface IFlareDataConnector {
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

    function requestAttestation(AttestationRequest calldata request) external returns (bytes32 requestId);
    function getAttestation(bytes32 requestId) external view returns (AttestationResponse memory);
    function isAttestationFinalized(bytes32 requestId) external view returns (bool);
}

/**
 * @title IFTSOv2
 * @notice Interface for FTSO v2 price feeds
 */
interface IFTSOv2 {
    struct Feed {
        uint32 votingRoundId;
        bytes21 id;
        int32 value;
        uint16 turnoutBIPS;
        int8 decimals;
    }

    function getFeedById(bytes21 feedId) external view returns (Feed memory);
    function getFeedByIdInWei(bytes21 feedId) external view returns (uint256);
}
