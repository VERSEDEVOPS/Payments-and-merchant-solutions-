// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { TipVault } from "../src/TipVault.sol";

contract DeployTipVault is Script {
    error WrongChain(uint256 actualChainId);
    error ZeroOwner();

    uint256 internal constant POLYGON_CHAIN_ID = 137;
    address internal constant POLYGON_FXVERSE = 0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc;

    function run() external returns (TipVault vault) {
        if (block.chainid != POLYGON_CHAIN_ID) revert WrongChain(block.chainid);

        address owner = vm.envAddress("TIP_VAULT_OWNER");
        if (owner == address(0)) revert ZeroOwner();

        vm.startBroadcast();
        vault = new TipVault(POLYGON_FXVERSE, owner);
        vm.stopBroadcast();
    }
}
