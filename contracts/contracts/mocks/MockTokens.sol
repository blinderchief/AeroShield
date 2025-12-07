// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private _decimals;

    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {
        _decimals = 6;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet(uint256 amount) external {
        require(amount <= 10000 * 10**_decimals, "Max 10000 USDC");
        _mint(msg.sender, amount);
    }
}

/**
 * @title MockFLR
 * @notice Mock FLR token for testing
 */
contract MockFLR is ERC20, Ownable {
    constructor() ERC20("Mock Flare", "FLR") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet(uint256 amount) external {
        require(amount <= 1000 * 10**18, "Max 1000 FLR");
        _mint(msg.sender, amount);
    }
}
