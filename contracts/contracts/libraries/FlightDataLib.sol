// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FlightDataLib
 * @notice Library for encoding/decoding flight data for FDC attestations
 */
library FlightDataLib {
    // Flight status codes
    uint8 constant STATUS_SCHEDULED = 0;
    uint8 constant STATUS_DELAYED = 1;
    uint8 constant STATUS_CANCELLED = 2;
    uint8 constant STATUS_DIVERTED = 3;
    uint8 constant STATUS_LANDED = 4;

    struct FlightData {
        string flightNumber;
        uint64 scheduledDeparture;
        uint64 actualDeparture;
        uint64 scheduledArrival;
        uint64 actualArrival;
        uint8 status;
        uint16 delayMinutes;
        bool isCancelled;
    }

    /**
     * @notice Encode flight request for FDC
     */
    function encodeFlightRequest(
        string memory flightNumber,
        uint64 flightDate
    ) internal pure returns (bytes memory) {
        return abi.encode(flightNumber, flightDate);
    }

    /**
     * @notice Decode flight response from FDC
     */
    function decodeFlightResponse(
        bytes memory responseBody
    ) internal pure returns (FlightData memory) {
        (
            string memory flightNumber,
            uint64 scheduledDeparture,
            uint64 actualDeparture,
            uint64 scheduledArrival,
            uint64 actualArrival,
            uint8 status,
            uint16 delayMinutes,
            bool isCancelled
        ) = abi.decode(
            responseBody,
            (string, uint64, uint64, uint64, uint64, uint8, uint16, bool)
        );

        return FlightData({
            flightNumber: flightNumber,
            scheduledDeparture: scheduledDeparture,
            actualDeparture: actualDeparture,
            scheduledArrival: scheduledArrival,
            actualArrival: actualArrival,
            status: status,
            delayMinutes: delayMinutes,
            isCancelled: isCancelled
        });
    }

    /**
     * @notice Calculate payout based on delay
     */
    function calculateDelayPayout(
        uint16 delayMinutes,
        uint256 coverageAmount,
        uint16 delay1hPct,
        uint16 delay2hPct,
        uint16 delay4hPct,
        uint16 cancellationPct
    ) internal pure returns (uint256) {
        if (delayMinutes >= 240) {
            return (coverageAmount * delay4hPct) / 10000;
        } else if (delayMinutes >= 120) {
            return (coverageAmount * delay2hPct) / 10000;
        } else if (delayMinutes >= 60) {
            return (coverageAmount * delay1hPct) / 10000;
        }
        return 0;
    }

    /**
     * @notice Calculate cancellation payout
     */
    function calculateCancellationPayout(
        uint256 coverageAmount,
        uint16 cancellationPct
    ) internal pure returns (uint256) {
        return (coverageAmount * cancellationPct) / 10000;
    }
}
