// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { StdInvariant } from "forge-std/StdInvariant.sol";
import { TipVault } from "../src/TipVault.sol";
import { MockVerse } from "../src/mocks/MockVerse.sol";

contract TipVaultHandler is Test {
    TipVault public immutable vault;
    MockVerse public immutable token;
    address[3] public creators;

    constructor(TipVault vault_, MockVerse token_) {
        vault = vault_;
        token = token_;
        creators = [makeAddr("creator-one"), makeAddr("creator-two"), makeAddr("creator-three")];
        token.faucet();
        token.approve(address(vault), type(uint256).max);
    }

    function tip(uint256 rawAmount, uint8 creatorIndex) external {
        uint256 balance = token.balanceOf(address(this));
        if (balance == 0) return;
        uint256 amount = bound(rawAmount, 1, balance);
        vault.tip(creators[creatorIndex % 3], amount, bytes32(rawAmount));
    }

    function claim(uint256 rawAmount, uint8 creatorIndex) external {
        address creator = creators[creatorIndex % 3];
        uint256 available = vault.claimable(creator);
        if (available == 0) return;
        uint256 amount = bound(rawAmount, 1, available);
        vm.prank(creator);
        vault.claim(amount);
    }
}

contract TipVaultInvariantTest is StdInvariant, Test {
    MockVerse internal token;
    TipVault internal vault;
    TipVaultHandler internal handler;

    function setUp() public {
        token = new MockVerse();
        vault = new TipVault(address(token), address(this));
        handler = new TipVaultHandler(vault, token);
        targetContract(address(handler));
    }

    function invariantVaultIsAlwaysSolvent() public view {
        assertGe(token.balanceOf(address(vault)), vault.totalLiability());
        assertTrue(vault.isSolvent());
    }

    function invariantTrackedClaimsEqualLiability() public view {
        uint256 sum;
        for (uint256 i; i < 3; ++i) {
            sum += vault.claimable(handler.creators(i));
        }
        assertEq(sum, vault.totalLiability());
    }

    function invariantVaultNeverHoldsNativeCurrency() public view {
        assertEq(address(vault).balance, 0);
    }
}
