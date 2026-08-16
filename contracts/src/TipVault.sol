// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { SignatureChecker } from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import { MetadataURI } from "./libraries/MetadataURI.sol";

/// @title VerseTip Vault
/// @notice Claimable VERSE tips, campaigns, collaborator splits, and gas-sponsored claims.
/// @dev New deposits can be paused, but legitimate claims intentionally remain available.
contract TipVault is Ownable2Step, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    uint16 public constant BPS = 10_000;
    uint8 public constant MAX_RECIPIENTS = 8;
    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("Claim(address creator,address to,uint256 amount,uint256 nonce,uint256 deadline)");

    IERC20 public immutable verse;

    struct Campaign {
        address creator;
        bool active;
        uint8 recipientCount;
        string metadataURI;
    }

    mapping(address creator => uint256 amount) public claimable;
    mapping(address creator => uint256 nonce) public claimNonces;
    mapping(bytes32 campaignId => Campaign campaign) public campaigns;
    mapping(bytes32 campaignId => address[] recipients) private _campaignRecipients;
    mapping(bytes32 campaignId => uint16[] shares) private _campaignShares;

    uint256 public totalLiability;

    error ZeroAddress();
    error ZeroSlug();
    error ZeroAmount();
    error InvalidCampaign();
    error InvalidSplit();
    error DuplicateRecipient();
    error CampaignExists();
    error CampaignInactive();
    error NotCampaignCreator();
    error InsufficientClaimable();
    error SignatureExpired();
    error InvalidSignature();
    error Insolvent();
    error InsufficientExcess();

    event TipReceived(
        address indexed supporter,
        address indexed beneficiary,
        uint256 amount,
        bytes32 indexed campaignId,
        bytes32 messageHash
    );
    event CampaignTipReceived(
        address indexed supporter, bytes32 indexed campaignId, uint256 amount, bytes32 messageHash
    );
    event CampaignCreated(
        bytes32 indexed campaignId,
        address indexed creator,
        bytes32 indexed slugHash,
        address[] recipients,
        uint16[] shares,
        string metadataURI
    );
    event CampaignStatusChanged(bytes32 indexed campaignId, bool active);
    event Claimed(address indexed creator, address indexed to, uint256 amount, address indexed submittedBy);
    event ExcessRecovered(address indexed to, uint256 amount);

    constructor(address verseToken, address initialOwner)
        Ownable(initialOwner)
        EIP712("VerseTip Vault", "1")
    {
        if (verseToken == address(0) || initialOwner == address(0)) {
            revert ZeroAddress();
        }
        verse = IERC20(verseToken);
    }

    function campaignIdFor(address creator, bytes32 slugHash) public pure returns (bytes32) {
        return keccak256(abi.encode(creator, slugHash));
    }

    function createCampaign(
        bytes32 slugHash,
        address[] calldata recipients,
        uint16[] calldata shares,
        string calldata metadataURI
    ) external returns (bytes32 campaignId) {
        if (slugHash == bytes32(0)) revert ZeroSlug();
        uint256 count = recipients.length;
        if (count == 0 || count > MAX_RECIPIENTS || count != shares.length) revert InvalidSplit();

        campaignId = campaignIdFor(msg.sender, slugHash);
        if (campaigns[campaignId].creator != address(0)) revert CampaignExists();

        uint256 totalShares;
        bool includesCreator;
        for (uint256 i; i < count; ++i) {
            address recipient = recipients[i];
            if (recipient == address(0) || shares[i] == 0) revert InvalidSplit();
            if (recipient == msg.sender) includesCreator = true;
            totalShares += shares[i];
            for (uint256 j; j < i; ++j) {
                if (recipients[j] == recipient) revert DuplicateRecipient();
            }
        }
        if (!includesCreator || totalShares != BPS) revert InvalidSplit();
        MetadataURI.validate(metadataURI);

        // `count` is capped at MAX_RECIPIENTS (8), so this cast cannot truncate.
        // forge-lint: disable-next-line(unsafe-typecast)
        campaigns[campaignId] = Campaign(msg.sender, true, uint8(count), metadataURI);
        _campaignRecipients[campaignId] = recipients;
        _campaignShares[campaignId] = shares;
        emit CampaignCreated(campaignId, msg.sender, slugHash, recipients, shares, metadataURI);
    }

    function setCampaignActive(bytes32 campaignId, bool active) external {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.creator != msg.sender) revert NotCampaignCreator();
        campaign.active = active;
        emit CampaignStatusChanged(campaignId, active);
    }

    function getCampaignSplit(bytes32 campaignId)
        external
        view
        returns (address[] memory recipients, uint16[] memory shares)
    {
        if (campaigns[campaignId].creator == address(0)) revert InvalidCampaign();
        return (_campaignRecipients[campaignId], _campaignShares[campaignId]);
    }

    function tip(address beneficiary, uint256 amount, bytes32 messageHash)
        external
        whenNotPaused
        nonReentrant
    {
        _tip(msg.sender, beneficiary, amount, bytes32(0), messageHash);
    }

    function tipCampaign(bytes32 campaignId, uint256 amount, bytes32 messageHash)
        external
        whenNotPaused
        nonReentrant
    {
        _tipCampaign(msg.sender, campaignId, amount, messageHash);
    }

    function claim(uint256 amount) external nonReentrant {
        _claim(msg.sender, msg.sender, amount);
    }

    function claimTo(address to, uint256 amount) external nonReentrant {
        _claim(msg.sender, to, amount);
    }

    function claimWithSignature(
        address creator,
        address to,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant {
        if (block.timestamp > deadline) revert SignatureExpired();
        uint256 nonce = claimNonces[creator];
        bytes32 digest =
            _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, creator, to, amount, nonce, deadline)));
        if (!SignatureChecker.isValidSignatureNow(creator, digest, signature)) revert InvalidSignature();
        claimNonces[creator] = nonce + 1;
        _claim(creator, to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Recovers only fxVERSE that was transferred directly to this contract without creating a claim.
    /// @dev Liabilities are never withdrawable by the owner. Intended for a multisig-controlled recovery process.
    function recoverExcess(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = verse.balanceOf(address(this));
        if (balance < totalLiability || amount > balance - totalLiability) revert InsufficientExcess();
        verse.safeTransfer(to, amount);
        _assertSolvent();
        emit ExcessRecovered(to, amount);
    }

    function isSolvent() external view returns (bool) {
        return verse.balanceOf(address(this)) >= totalLiability;
    }

    function _tip(
        address supporter,
        address beneficiary,
        uint256 amount,
        bytes32 campaignId,
        bytes32 messageHash
    ) internal {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        verse.safeTransferFrom(supporter, address(this), amount);
        claimable[beneficiary] += amount;
        totalLiability += amount;
        _assertSolvent();
        emit TipReceived(supporter, beneficiary, amount, campaignId, messageHash);
    }

    function _tipCampaign(address supporter, bytes32 campaignId, uint256 amount, bytes32 messageHash)
        internal
    {
        Campaign memory campaign = campaigns[campaignId];
        if (campaign.creator == address(0)) revert InvalidCampaign();
        if (!campaign.active) revert CampaignInactive();
        if (amount == 0) revert ZeroAmount();

        verse.safeTransferFrom(supporter, address(this), amount);
        address[] storage recipients = _campaignRecipients[campaignId];
        uint16[] storage shares = _campaignShares[campaignId];
        uint256 allocated;
        uint256 last = recipients.length - 1;
        for (uint256 i; i < last; ++i) {
            uint256 portion = amount * shares[i] / BPS;
            claimable[recipients[i]] += portion;
            allocated += portion;
        }
        claimable[recipients[last]] += amount - allocated;
        totalLiability += amount;
        _assertSolvent();
        emit CampaignTipReceived(supporter, campaignId, amount, messageHash);
    }

    function _claim(address creator, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        uint256 available = claimable[creator];
        if (amount > available) revert InsufficientClaimable();
        claimable[creator] = available - amount;
        totalLiability -= amount;
        verse.safeTransfer(to, amount);
        _assertSolvent();
        emit Claimed(creator, to, amount, msg.sender);
    }

    function _assertSolvent() internal view {
        if (verse.balanceOf(address(this)) < totalLiability) revert Insolvent();
    }
}
