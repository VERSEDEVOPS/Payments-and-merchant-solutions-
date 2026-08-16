# VerseTip contracts

Foundry contracts for Polygon-mainnet creator profiles and claimable fxVERSE tipping.

## Contracts

- `TipVault.sol`: direct vault deposits, campaigns with up to eight immutable recipients, creator claims, EIP-712 sponsored claims, deposit pause, two-step ownership, solvency assertions, and liability-safe excess recovery.
- `CreatorRegistry.sol`: adminless wallet-owned profiles with permanently reserved slugs and IPFS metadata anchors.
- `MetadataURI.sol`: shared CIDv1 base32 `ipfs://` validation.
- `MockVerse.sol`: local-only fixture. It is not an official Verse testnet token and must never be deployed or documented as one.

Production fxVERSE is `0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc` on Polygon chain `137`. It uses ordinary ERC-20 approval and does not expose EIP-2612 permit.

## Commands

```bash
forge build --offline
forge fmt --check
forge lint src script test --severity high med --offline
forge test --offline
FOUNDRY_PROFILE=ci forge test --offline
forge coverage --offline
forge snapshot --offline
```

The test suite contains unit tests, live Polygon fork checks, and stateful invariants for solvency, liability accounting, and native-token balance.

## Deployment

`script/DeployTipVault.s.sol` binds the vault to the hard-coded Polygon fxVERSE address and reads `TIP_VAULT_OWNER`. The owner must be the audited multisig. Follow [the full runbook](../docs/DEPLOYMENT.md); do not broadcast before the independent audit gate in [SECURITY.md](../docs/SECURITY.md) is complete.

