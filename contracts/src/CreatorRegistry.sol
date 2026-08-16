// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MetadataURI } from "./libraries/MetadataURI.sol";

/// @title VerseTip Creator Registry
/// @notice Self-service creator discovery with provider-neutral IPFS metadata.
/// @dev Profiles are controlled only by their wallet. Slugs cannot be transferred or recycled.
contract CreatorRegistry {
    struct Profile {
        bytes32 slugHash;
        string metadataURI;
        uint64 updatedAt;
        bool active;
    }

    mapping(address creator => Profile profile) public profiles;
    mapping(bytes32 slugHash => address creator) public creatorForSlug;

    error ZeroSlug();
    error SlugTaken();
    error SlugImmutable();
    error ProfileNotFound();

    event ProfileUpdated(
        address indexed creator, bytes32 indexed slugHash, string metadataURI, uint64 updatedAt
    );
    event ProfileStatusChanged(address indexed creator, bool active);

    function setProfile(bytes32 slugHash, string calldata metadataURI) external {
        if (slugHash == bytes32(0)) revert ZeroSlug();
        MetadataURI.validate(metadataURI);

        Profile storage profile = profiles[msg.sender];
        if (profile.slugHash == bytes32(0)) {
            if (creatorForSlug[slugHash] != address(0)) revert SlugTaken();
            creatorForSlug[slugHash] = msg.sender;
            profile.slugHash = slugHash;
        } else if (profile.slugHash != slugHash) {
            revert SlugImmutable();
        }

        profile.metadataURI = metadataURI;
        profile.updatedAt = uint64(block.timestamp);
        profile.active = true;
        emit ProfileUpdated(msg.sender, slugHash, metadataURI, profile.updatedAt);
    }

    function setProfileActive(bool active) external {
        Profile storage profile = profiles[msg.sender];
        if (profile.slugHash == bytes32(0)) revert ProfileNotFound();
        profile.active = active;
        emit ProfileStatusChanged(msg.sender, active);
    }
}
