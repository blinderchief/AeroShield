// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {TestFtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/TestFtsoV2Interface.sol";
import {IFeeCalculator} from "@flarenetwork/flare-periphery-contracts/coston2/IFeeCalculator.sol";

/**
 * @title FTSOv2Consumer
 * @author AeroShield Team
 * @notice FTSO price feed consumer for AeroShield insurance pricing
 * @dev Uses Flare's FTSOv2 for real-time price data
 */
contract FTSOv2Consumer {
    // ═══════════════════════════════════════════════════════════════════════════════
    // FEED IDS - See https://dev.flare.network/ftso/feeds for full list
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // FLR/USD feed ID
    bytes21 public constant FLR_USD_ID = 0x01464c522f55534400000000000000000000000000;
    // BTC/USD feed ID  
    bytes21 public constant BTC_USD_ID = 0x014254432f55534400000000000000000000000000;
    // ETH/USD feed ID
    bytes21 public constant ETH_USD_ID = 0x014554482f55534400000000000000000000000000;
    // USDC/USD feed ID
    bytes21 public constant USDC_USD_ID = 0x01555344432f555344000000000000000000000000;
    // USDT/USD feed ID
    bytes21 public constant USDT_USD_ID = 0x01555344542f555344000000000000000000000000;

    // Array of feed IDs we track
    bytes21[] public feedIds;

    // ═══════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════════
    event PriceUpdated(bytes21 indexed feedId, uint256 value, int8 decimals, uint64 timestamp);

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════════
    constructor() {
        // Initialize with default feed IDs
        feedIds.push(FLR_USD_ID);
        feedIds.push(BTC_USD_ID);
        feedIds.push(ETH_USD_ID);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EXTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get FLR/USD price
     * @return value The price value
     * @return decimals Number of decimals
     * @return timestamp Last update timestamp
     */
    function getFlrUsdPrice() external view returns (uint256 value, int8 decimals, uint64 timestamp) {
        // THIS IS A TEST METHOD - In production use: ftsoV2 = ContractRegistry.getFtsoV2();
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        return ftsoV2.getFeedById(FLR_USD_ID);
    }

    /**
     * @notice Get FLR/USD price in wei (18 decimals)
     * @return value The price in wei
     * @return timestamp Last update timestamp
     */
    function getFlrUsdPriceWei() external view returns (uint256 value, uint64 timestamp) {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        return ftsoV2.getFeedByIdInWei(FLR_USD_ID);
    }

    /**
     * @notice Get multiple feed values at once
     * @return _feedValues Array of price values
     * @return _decimals Array of decimals for each feed
     * @return _timestamp Timestamp of the data
     */
    function getCurrentFeedValues() 
        external 
        view 
        returns (
            uint256[] memory _feedValues,
            int8[] memory _decimals,
            uint64 _timestamp
        ) 
    {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        return ftsoV2.getFeedsById(feedIds);
    }

    /**
     * @notice Get price for a specific feed
     * @param feedId The feed ID to query
     * @return value The price value
     * @return decimals Number of decimals
     * @return timestamp Last update timestamp
     */
    function getFeedPrice(bytes21 feedId) 
        external 
        view 
        returns (uint256 value, int8 decimals, uint64 timestamp) 
    {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        return ftsoV2.getFeedById(feedId);
    }

    /**
     * @notice Get price in wei for a specific feed
     * @param feedId The feed ID to query
     * @return value The price in wei (18 decimals)
     * @return timestamp Last update timestamp
     */
    function getFeedPriceWei(bytes21 feedId)
        external
        view
        returns (uint256 value, uint64 timestamp)
    {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        return ftsoV2.getFeedByIdInWei(feedId);
    }

    /**
     * @notice Calculate USD value of FLR amount
     * @param flrAmount Amount of FLR in wei
     * @return usdValue USD value (6 decimals)
     */
    function calculateUsdValue(uint256 flrAmount) external view returns (uint256 usdValue) {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        (uint256 price, int8 decimals, ) = ftsoV2.getFeedById(FLR_USD_ID);
        
        // Convert to 6 decimal USD value
        // flrAmount is in wei (18 decimals)
        // price has `decimals` decimal places
        if (decimals >= 0) {
            usdValue = (flrAmount * price) / (10 ** (18 + uint8(decimals) - 6));
        } else {
            usdValue = (flrAmount * price * (10 ** uint8(-decimals))) / (10 ** 12);
        }
    }

    /**
     * @notice Calculate FLR amount for given USD value
     * @param usdAmount USD amount (6 decimals)
     * @return flrAmount FLR amount in wei
     */
    function calculateFlrAmount(uint256 usdAmount) external view returns (uint256 flrAmount) {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        (uint256 price, int8 decimals, ) = ftsoV2.getFeedById(FLR_USD_ID);
        
        require(price > 0, "Invalid price");
        
        // Convert USD to FLR
        if (decimals >= 0) {
            flrAmount = (usdAmount * (10 ** (18 + uint8(decimals) - 6))) / price;
        } else {
            flrAmount = (usdAmount * (10 ** 12)) / (price * (10 ** uint8(-decimals)));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Add a new feed ID to track
     * @param feedId The feed ID to add
     */
    function addFeedId(bytes21 feedId) external {
        feedIds.push(feedId);
    }

    /**
     * @notice Get all tracked feed IDs
     * @return Array of feed IDs
     */
    function getFeedIds() external view returns (bytes21[] memory) {
        return feedIds;
    }
}
