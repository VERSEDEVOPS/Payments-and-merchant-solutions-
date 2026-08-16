# Security model and audit status

## Release status

VerseTip has completed an internal implementation review, Foundry unit/fork/invariant testing, compiler linting, frontend boundary tests, and Worker type/bundle checks. This is **not an independent security audit**. The `TipVault` must not hold production funds until an external reviewer has delivered findings, every accepted finding has been remediated and retested, and the release owner signs off.

## Protected properties

- `totalLiability` equals the sum of recorded creator claims for all supported deposit paths.
- Vault fxVERSE balance is never below `totalLiability` after a successful state-changing operation.
- Claims use checks-effects-interactions plus `ReentrancyGuard` and `SafeERC20`.
- New deposits can be paused; valid claims remain available during an incident.
- Campaign recipients are unique, nonzero, capped at eight, include the creator, and total exactly 10,000 basis points.
- Campaign splits and metadata anchors are immutable after creation; the creator can only activate or deactivate deposits.
- Sponsored claims bind creator, destination, amount, nonce, deadline, chain, and verifying contract through EIP-712.
- Only token balance above liabilities can be recovered, and only by the owner.
- Registry slugs are immutable and permanently reserved to prevent recycling-based impersonation.

## Administrative model

**Current live owner:** the deployer EOA `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`. That is an accepted risk for this reference deploy, not the production target.

**Required upgrade:** create a reviewed Safe on Polygon and transfer vault ownership to it. `TipVault` uses OpenZeppelin `Ownable2Step`:

1. Create a 2-of-3 or stronger Safe on Polygon (hardware-backed, geographically and organizationally separate signers).
2. From the current owner, call `transferOwnership(safe)`.
3. From the Safe, call `acceptOwnership()`.
4. Confirm `owner()` is the Safe on PolygonScan before treating the vault as production-ready.

Do not leave a fund-holding vault on a single key. The owner can pause/unpause new deposits and recover excess fxVERSE accidentally transferred outside the deposit functions. It cannot modify claims, campaign splits, or withdraw liabilities. CreatorRegistry has no administrator.

Recommended controls:

- At least a 2-of-3 signer threshold with geographically and organizationally separate signers.
- Hardware-backed signer keys.
- Documented pause and excess-recovery procedures.
- Transaction simulation and peer review before every admin action.
- Alerts for `Paused`, `Unpaused`, ownership changes, excess recovery, insolvency checks, and relayer depletion.

## Relayer controls

- Dedicated low-balance wallet; never a personal or deployer key.
- Server-only secret storage.
- One Durable Object serializes Polygon submissions to avoid nonce races.
- Per-creator rate limiting, maximum sponsored amount, fifteen-minute deadline, live `claimable` check, and pre-submit simulation.
- API sponsorship pays only to the signing creator, even though the contract supports creator-authorized alternate destinations.
- The relayer cannot create a valid claim signature or redirect a signed claim.

## Storage and frontend controls

- Upload requests bind wallet, content hash, content kind, timestamp, and Polygon chain ID; Polygon RPC verification supports EOAs and ERC-1271 smart wallets.
- JSON schemas are strict and size bounded; supported image types are magic-byte checked.
- Onchain profile reads verify metadata publisher ownership.
- Fallback showcase profiles are labeled and transaction-disabled.
- CORS accepts an explicit comma-separated allowlist. CORS is defense in depth, not authentication.
- Storacha credentials, relayer keys, and RPC secrets must never use the `VITE_` prefix.

## Known constraints

- A first vault tip requires ERC-20 approval and deposit transactions because fxVERSE has no permit interface.
- Public IPFS availability is probabilistic; use redundant gateways and optional secondary pins.
- Browser log discovery will need an indexer as registry activity grows.
- The vault assumes the immutable Polygon fxVERSE contract retains ordinary non-rebasing, non-fee-on-transfer behavior. The post-transfer solvency assertion rejects undercollateralized deposits.
- Direct tips bypass the vault and cannot be paused or recovered by VerseTip.

## Independent audit scope

Provide auditors with `TipVault.sol`, `CreatorRegistry.sol`, `MetadataURI.sol`, deployment scripts, all tests, the real fxVERSE address/bytecode, EIP-712 frontend payload construction, and relayer logic. Ask explicitly for review of accounting, rounding, ERC-20 assumptions, reentrancy, signature replay/domain separation, ERC-1271 behavior, campaign denial of service, admin powers, deployment configuration, and incident response.

## Mandatory mainnet gate

- [ ] Independent report received.
- [ ] Findings triaged with written disposition.
- [ ] Accepted findings fixed and regression-tested.
- [ ] Auditor remediation review or sign-off received.
- [ ] Final commit hash frozen and reproducible build recorded.
- [ ] Polygon fork, fuzz, invariant, lint, frontend, and Worker checks green.
- [ ] Multisig address and signers verified out of band.
- [ ] Deployment and contract verification simulated.
- [ ] Dedicated relayer created and minimally funded.
- [ ] Monitoring and incident contacts active.
- [ ] Explicit human approval to broadcast recorded.
