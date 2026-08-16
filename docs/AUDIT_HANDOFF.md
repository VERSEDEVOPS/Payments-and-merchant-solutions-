# VerseTip independent audit handoff

## Release status

This package is prepared for an independent security review. It is not an audit report and does not satisfy the mainnet release gate by itself.

- Target network: Polygon mainnet (`137`)
- Canonical token: `fxVERSE` at `0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc`
- Solidity compiler: `0.8.24`
- Optimizer: enabled, `10,000` runs, `viaIR=true`
- Audit-scope aggregate SHA-256: `40afba0c2707d221d992c53713342c001129d4c1287804d884a7330c6de5e107`
- Production vault owner: pending deployed multisig
- Dedicated deployer: `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`

The aggregate digest is calculated from sorted SHA-256 entries for every file listed below. Recalculate it immediately before sending the frozen package to the reviewer.

## In-scope implementation

- `contracts/src/TipVault.sol`
- `contracts/src/CreatorRegistry.sol`
- `contracts/src/libraries/MetadataURI.sol`
- `contracts/src/mocks/MockVerse.sol`
- `contracts/script/DeployTipVault.s.sol`
- `contracts/test/TipVault.t.sol`
- `contracts/test/TipVaultInvariant.t.sol`
- `contracts/test/CreatorRegistry.t.sol`
- `contracts/test/PolygonFork.t.sol`
- `apps/web/src/features/tipping/TipComposer.tsx`
- `apps/web/src/lib/config.ts`
- `services/api/src/claim.ts`

## Required review questions

- Can any deposit path create a liability larger than received fxVERSE?
- Can the owner, deployer, relayer, creator, or arbitrary caller withdraw another creator's liability?
- Are direct claims and EIP-712 sponsored claims protected against replay, cross-chain reuse, wrong-contract reuse, expiry bypass, and destination substitution?
- Can an ERC-1271 wallet bypass signer or nonce validation?
- Can campaign rounding, duplicated recipients, collaborator count, or inactive status break solvency or permanently block valid claims?
- Can token callbacks, unusual return values, transfer fees, or reentrancy violate accounting?
- Can metadata validation, slug reservation, event discovery, or mutable gateway handling produce profile impersonation?
- Can relayer races, rate-limit bypasses, forged upload signatures, CORS assumptions, or secret exposure create loss or unauthorized publication?
- Do the chain, token, owner-code, compiler, and deployment-script checks prevent a materially incorrect release?
- Are pause and excess-recovery powers appropriately bounded, observable, and documented?

## Properties already tested internally

- `totalLiability` equals the sum of tracked creator claims.
- Vault fxVERSE balance is never below `totalLiability` after a successful state change.
- The vault never holds native currency.
- Claims remain available while new deposits are paused.
- Campaign recipients are unique, nonzero, capped, include the creator, and total exactly 10,000 basis points.
- Sponsored claims bind the creator, destination, amount, nonce, deadline, chain, and verifying contract.
- Only balance above liabilities is recoverable by the owner.
- The real Polygon fxVERSE contract uses the standard approval flow and does not expose a permit domain.

These are internal test claims, not substitutes for independent review.

## Reproduction commands

From `contracts/`:

```bash
forge fmt --check
forge lint src script test --severity high med --offline
FOUNDRY_PROFILE=ci forge test --offline
forge build --force --offline --sizes
```

The reviewer should also run the fork suite against an independent Polygon RPC and independently confirm the fxVERSE bytecode and token behavior.

The release machine uses `contracts/script/mainnet-release.sh`. It defaults to simulation and validates the network, deployed owner bytecode, audit-scope digest, named deployer address, independent report hash, and explicit broadcast confirmation before a mainnet send.

## Required auditor deliverables

- Dated report naming the exact source digest or frozen commit.
- Severity, affected location, exploit narrative, and recommendation for every finding.
- Written disposition for informational and accepted-risk findings.
- Remediation review confirming every accepted fix against the final source digest.
- Final report hash and public or privately archived report location.

## Remediation record

For every finding, record its identifier, severity, status, affected file, remediation commit, regression test, reviewer confirmation, and any accepted-risk owner approval. Do not set `AUDIT_REPORT_SHA256` or enable the vault in frontend configuration until this record and the final reviewer sign-off are complete.
