// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Validation shared by contracts that anchor public metadata on IPFS.
/// @dev VerseTip deliberately accepts CIDv1 base32 URIs only. Gateway URLs remain offchain.
library MetadataURI {
    error InvalidMetadataURI();

    function validate(string calldata uri) internal pure {
        bytes calldata value = bytes(uri);
        // A CIDv1 base32 string starts with `b`; 96 leaves room for future multicodecs.
        if (value.length < 9 || value.length > 103) revert InvalidMetadataURI();
        if (
            value[0] != "i" || value[1] != "p" || value[2] != "f" || value[3] != "s" || value[4] != ":"
                || value[5] != "/" || value[6] != "/" || value[7] != "b"
        ) revert InvalidMetadataURI();

        for (uint256 i = 8; i < value.length; ++i) {
            bytes1 character = value[i];
            bool lowercaseLetter = character >= "a" && character <= "z";
            bool base32Digit = character >= "2" && character <= "7";
            if (!lowercaseLetter && !base32Digit) revert InvalidMetadataURI();
        }
    }
}
