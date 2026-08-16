// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { CreatorRegistry } from "../src/CreatorRegistry.sol";
import { MetadataURI } from "../src/libraries/MetadataURI.sol";

contract CreatorRegistryTest is Test {
    CreatorRegistry internal registry;
    address internal creator = makeAddr("creator");
    address internal secondCreator = makeAddr("secondCreator");
    bytes32 internal constant SLUG_HASH = keccak256("maya-builds");
    string internal constant METADATA_URI =
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3ptw52sdbf7z3m4vza5xohzti";

    function setUp() public {
        registry = new CreatorRegistry();
    }

    function testCreatorCanCreateUpdateAndDeactivateProfile() public {
        vm.startPrank(creator);
        registry.setProfile(SLUG_HASH, METADATA_URI);

        (bytes32 slugHash, string memory uri, uint64 updatedAt, bool active) = registry.profiles(creator);
        assertEq(slugHash, SLUG_HASH);
        assertEq(uri, METADATA_URI);
        assertEq(updatedAt, block.timestamp);
        assertTrue(active);
        assertEq(registry.creatorForSlug(SLUG_HASH), creator);

        registry.setProfile(SLUG_HASH, METADATA_URI);
        registry.setProfileActive(false);
        (,,, active) = registry.profiles(creator);
        assertFalse(active);
        vm.stopPrank();
    }

    function testSlugCannotBeTakenOrChanged() public {
        vm.prank(creator);
        registry.setProfile(SLUG_HASH, METADATA_URI);

        vm.expectRevert(CreatorRegistry.SlugTaken.selector);
        vm.prank(secondCreator);
        registry.setProfile(SLUG_HASH, METADATA_URI);

        vm.expectRevert(CreatorRegistry.SlugImmutable.selector);
        vm.prank(creator);
        registry.setProfile(keccak256("different"), METADATA_URI);
    }

    function testRejectsInvalidMetadataURI() public {
        vm.expectRevert(MetadataURI.InvalidMetadataURI.selector);
        vm.prank(creator);
        registry.setProfile(SLUG_HASH, "https://gateway.example/ipfs/cid");
    }

    function testCannotChangeStatusBeforeRegistration() public {
        vm.expectRevert(CreatorRegistry.ProfileNotFound.selector);
        vm.prank(creator);
        registry.setProfileActive(false);
    }
}
