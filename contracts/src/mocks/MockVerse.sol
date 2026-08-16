// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Local-only test fixture. This is not an official or publicly deployed Verse token.
/// @dev Deliberately omits permit so its transfer/approval behavior matches Polygon fxVERSE.
contract MockVerse is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 100_000 ether;

    constructor() ERC20("Mock Verse (Local Only)", "mVERSE") { }

    /// @notice Local test helper. Tokens have no value and this contract is never publicly deployed.
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
