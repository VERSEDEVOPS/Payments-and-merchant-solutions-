// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { CreatorRegistry } from "../src/CreatorRegistry.sol";

/// @notice Deploys only the adminless creator registry after its release gate is complete.
contract DeployCreatorRegistry is Script {
    error WrongChain(uint256 actualChainId);

    uint256 internal constant POLYGON_CHAIN_ID = 137;

    function run() external returns (CreatorRegistry registry) {
        if (block.chainid != POLYGON_CHAIN_ID) revert WrongChain(block.chainid);

        vm.startBroadcast();
        registry = new CreatorRegistry();
        vm.stopBroadcast();
    }
}
