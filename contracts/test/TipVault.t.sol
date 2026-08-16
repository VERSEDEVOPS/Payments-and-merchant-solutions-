// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { TipVault } from "../src/TipVault.sol";
import { MockVerse } from "../src/mocks/MockVerse.sol";

contract TipVaultTest is Test {
    string internal constant METADATA_URI =
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3ptw52sdbf7z3m4vza5xohzti";
    uint256 internal constant SUPPORTER_KEY = 0xA11CE;
    uint256 internal constant CREATOR_KEY = 0xB0B;
    address internal supporter;
    address internal creator;
    address internal collaborator = makeAddr("collaborator");
    address internal relayer = makeAddr("relayer");
    address internal treasury = makeAddr("treasury");

    MockVerse internal verse;
    TipVault internal vault;

    function setUp() public {
        supporter = vm.addr(SUPPORTER_KEY);
        creator = vm.addr(CREATOR_KEY);
        verse = new MockVerse();
        vault = new TipVault(address(verse), address(this));
        vm.prank(supporter);
        verse.faucet();
    }

    function testTipCreatesFullyBackedClaim() public {
        uint256 amount = 500 ether;
        vm.startPrank(supporter);
        verse.approve(address(vault), amount);
        vault.tip(creator, amount, keccak256("great work"));
        vm.stopPrank();

        assertEq(vault.claimable(creator), amount);
        assertEq(vault.totalLiability(), amount);
        assertEq(verse.balanceOf(address(vault)), amount);
        assertTrue(vault.isSolvent());
    }

    function testCampaignSplitsAndAssignsRoundingDustToLastRecipient() public {
        address[] memory recipients = new address[](2);
        recipients[0] = creator;
        recipients[1] = collaborator;
        uint16[] memory shares = new uint16[](2);
        shares[0] = 6_667;
        shares[1] = 3_333;

        vm.prank(creator);
        bytes32 campaignId = vault.createCampaign(keccak256("album"), recipients, shares, METADATA_URI);

        vm.startPrank(supporter);
        verse.approve(address(vault), 101);
        vault.tipCampaign(campaignId, 101, keccak256("ship it"));
        vm.stopPrank();

        assertEq(vault.claimable(creator), 67);
        assertEq(vault.claimable(collaborator), 34);
        assertEq(vault.totalLiability(), 101);
    }

    function testCampaignMustIncludeCreatorAndTotalOneHundredPercent() public {
        address[] memory recipients = new address[](1);
        recipients[0] = collaborator;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(creator);
        vm.expectRevert(TipVault.InvalidSplit.selector);
        vault.createCampaign(keccak256("bad"), recipients, shares, METADATA_URI);
    }

    function testCampaignRejectsZeroSlug() public {
        address[] memory recipients = new address[](1);
        recipients[0] = creator;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(creator);
        vm.expectRevert(TipVault.ZeroSlug.selector);
        vault.createCampaign(bytes32(0), recipients, shares, METADATA_URI);
    }

    function testCreatorCanClaimToAnotherAddress() public {
        _seedTip(400 ether);
        vm.prank(creator);
        vault.claimTo(treasury, 150 ether);

        assertEq(vault.claimable(creator), 250 ether);
        assertEq(verse.balanceOf(treasury), 150 ether);
        assertEq(vault.totalLiability(), 250 ether);
        assertTrue(vault.isSolvent());
    }

    function testSponsoredClaimUsesNonceAndCannotReplay() public {
        _seedTip(400 ether);
        uint256 amount = 125 ether;
        uint256 deadline = block.timestamp + 1 days;
        bytes memory signature = _signClaim(creator, treasury, amount, vault.claimNonces(creator), deadline);

        vm.prank(relayer);
        vault.claimWithSignature(creator, treasury, amount, deadline, signature);

        assertEq(vault.claimNonces(creator), 1);
        assertEq(verse.balanceOf(treasury), amount);

        vm.prank(relayer);
        vm.expectRevert(TipVault.InvalidSignature.selector);
        vault.claimWithSignature(creator, treasury, amount, deadline, signature);
    }

    function testPauseBlocksDepositsButNeverClaims() public {
        _seedTip(100 ether);
        vault.pause();

        vm.startPrank(supporter);
        verse.approve(address(vault), 1 ether);
        vm.expectRevert();
        vault.tip(creator, 1 ether, bytes32(0));
        vm.stopPrank();

        vm.prank(creator);
        vault.claim(100 ether);
        assertEq(vault.claimable(creator), 0);
    }

    function testCannotClaimMoreThanLiability() public {
        _seedTip(10 ether);
        vm.prank(creator);
        vm.expectRevert(TipVault.InsufficientClaimable.selector);
        vault.claim(11 ether);
    }

    function testRejectsZeroValueAndZeroAddressTips() public {
        vm.startPrank(supporter);
        vm.expectRevert(TipVault.ZeroAmount.selector);
        vault.tip(creator, 0, bytes32(0));
        vm.expectRevert(TipVault.ZeroAddress.selector);
        vault.tip(address(0), 1 ether, bytes32(0));
        vm.stopPrank();
    }

    function testSponsoredClaimRejectsExpiredSignature() public {
        _seedTip(100 ether);
        uint256 deadline = block.timestamp - 1;
        bytes memory signature = _signClaim(creator, treasury, 10 ether, 0, deadline);

        vm.expectRevert(TipVault.SignatureExpired.selector);
        vault.claimWithSignature(creator, treasury, 10 ether, deadline, signature);
    }

    function testOnlyCreatorCanChangeCampaignStatus() public {
        address[] memory recipients = new address[](1);
        recipients[0] = creator;
        uint16[] memory shares = new uint16[](1);
        shares[0] = 10_000;

        vm.prank(creator);
        bytes32 campaignId = vault.createCampaign(keccak256("creator-only"), recipients, shares, METADATA_URI);

        vm.prank(collaborator);
        vm.expectRevert(TipVault.NotCampaignCreator.selector);
        vault.setCampaignActive(campaignId, false);
    }

    function testOwnershipTransferRequiresAcceptance() public {
        address nextOwner = makeAddr("next-owner");
        vault.transferOwnership(nextOwner);

        assertEq(vault.owner(), address(this));
        assertEq(vault.pendingOwner(), nextOwner);

        vm.prank(nextOwner);
        vault.acceptOwnership();
        assertEq(vault.owner(), nextOwner);
    }

    function testOwnerCanRecoverOnlyUnaccountedExcess() public {
        _seedTip(100 ether);
        verse.faucet();
        assertTrue(verse.transfer(address(vault), 25 ether));

        vault.recoverExcess(treasury, 25 ether);
        assertEq(verse.balanceOf(treasury), 25 ether);
        assertEq(verse.balanceOf(address(vault)), vault.totalLiability());
        assertTrue(vault.isSolvent());

        vm.expectRevert(TipVault.InsufficientExcess.selector);
        vault.recoverExcess(treasury, 1);
    }

    function testNonOwnerCannotRecoverExcess() public {
        verse.faucet();
        assertTrue(verse.transfer(address(vault), 1 ether));
        vm.prank(supporter);
        vm.expectRevert();
        vault.recoverExcess(supporter, 1 ether);
    }

    function _seedTip(uint256 amount) internal {
        vm.startPrank(supporter);
        verse.approve(address(vault), amount);
        vault.tip(creator, amount, bytes32(0));
        vm.stopPrank();
    }

    function _signClaim(address signer, address to, uint256 amount, uint256 nonce, uint256 deadline)
        internal
        view
        returns (bytes memory)
    {
        bytes32 domainTypehash = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        bytes32 domainSeparator = keccak256(
            abi.encode(
                domainTypehash, keccak256("VerseTip Vault"), keccak256("1"), block.chainid, address(vault)
            )
        );
        bytes32 structHash =
            keccak256(abi.encode(vault.CLAIM_TYPEHASH(), signer, to, amount, nonce, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(CREATOR_KEY, digest);
        return abi.encodePacked(r, s, v);
    }
}
