// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { TipVault } from "../src/TipVault.sol";

contract PolygonForkTest is Test {
    address internal constant FXVERSE = 0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc;

    function setUp() public {
        string memory rpc = vm.envOr("POLYGON_RPC_URL", string("https://polygon.drpc.org"));
        if (bytes(rpc).length == 0) rpc = "https://polygon.drpc.org";
        vm.createSelectFork(rpc);
    }

    function testRealFxVerseMetadataAndVaultBinding() public {
        IERC20Metadata token = IERC20Metadata(FXVERSE);
        assertGt(FXVERSE.code.length, 0);
        assertEq(token.name(), "Verse (FXERC20)");
        assertEq(token.symbol(), "fxVERSE");
        assertEq(token.decimals(), 18);

        TipVault vault = new TipVault(FXVERSE, address(this));
        assertEq(address(vault.verse()), FXVERSE);
        assertTrue(vault.isSolvent());
    }

    function testRealFxVerseDoesNotExposePermitDomain() public view {
        (bool success,) = FXVERSE.staticcall(abi.encodeWithSignature("DOMAIN_SEPARATOR()"));
        assertFalse(success);
    }

    function testRealFxVerseUsesStandardApprovalFlow() public {
        address supporter = makeAddr("fork-supporter");
        TipVault vault = new TipVault(FXVERSE, address(this));

        vm.prank(supporter);
        assertTrue(IERC20Metadata(FXVERSE).approve(address(vault), 123 ether));
        assertEq(IERC20Metadata(FXVERSE).allowance(supporter, address(vault)), 123 ether);
    }
}
