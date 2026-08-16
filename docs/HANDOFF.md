# VerseTip Agent Handoff

Last updated: 2026-08-16 (Africa/Lagos)

This is the operational handoff for the next agent. Read this file, `README.md`, and the most recent entries in `docs/BUILD_JOURNAL.md` before changing code.

`CreatorRegistry` and `TipVault` are live on Polygon. The vault is owned by the deployer EOA. **No independent audit has been completed.** Do not invent an audit, print secrets, or treat this as a Safe-owned production vault.

## Product and non-negotiable decisions

VerseTip is a polished, open reference implementation for the Verse Buildathon: a creator tipping product inspired by Buy Me a Coffee, using fxVERSE on Polygon.

- Production chain: **Polygon mainnet, chain ID 137**.
- Canonical token: **fxVERSE**, `0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc`, 18 decimals.
- There is no official Verse testnet token. Do not send future developers looking for a Verse testnet.
- Contracts use Foundry.
- Frontend uses Vite + React + TypeScript, not Next.js.
- Metadata URIs are provider-neutral `ipfs://` values. The live upload backend is **Cloudflare R2**, not Storacha. Storacha's `up.storacha.network` does not resolve (NXDOMAIN). The Worker stores objects at `cid/<cidv1-raw>` and still returns `ipfs://bafkrei…` so the deployed `MetadataURI` contract accepts them. `GET /ipfs/:cid` is the first gateway.
- No Supabase dependency is intended.
- Direct tips use one ERC-20 transfer. Claimable/campaign tips use the vault so creators can batch claims.
- This version's vault owner is the deployer EOA by explicit user request. Formal `mainnet-release.sh` still requires a contract owner and an audit digest. Ownership can later move to a Safe via Ownable2Step.

The user prefers sleek, restrained product design: generous spacing, excellent responsive behavior, flat colors instead of gradients in the logo, no unnecessary dividers, and compact right-side panels rather than centered wallet/preferences modals. The shared VerseTip mark is a transparent, flat four-color SVG. Ecosystem orbit and tip/token badges use the official folded fxVERSE mark.

## Repository state

- Workspace: `/Users/abba/Desktop/verse_ecosystem`
- Remote: `https://github.com/VERSEDEVOPS/Payments-and-merchant-solutions-.git`
- Package manager: pnpm 10 (`pnpm-workspace.yaml`)
- The repository currently reports every project file as untracked. Preserve all files and do not use reset/checkout cleanup commands.
- `.secrets/`, environment files, Foundry keystores, and local credentials must remain ignored.

Key directories:

- `apps/web/`: Vite frontend
- `contracts/`: Foundry contracts, tests, invariants, deployment scripts, release gates
- `services/api/`: Cloudflare Worker for signed R2 uploads and relay operations
- `scripts/`: cross-project release/preflight helpers
- `docs/`: architecture, deployment, security, metadata, operations, source references, journal, and this handoff

## What is implemented

### Product UI

- Responsive home, discovery, creator, Studio, ecosystem/onchain education, and security routes.
- Dark, light, and system appearances with persisted preference. Preferences are a compact right-side appearance panel.
- Accessible discovery search and working category filters.
- Creator profiles, campaign presentation, recent support, direct tips, and claimable vault UI.
- Profile publishing form with a controlled category dropdown.
- Sign-in opens Reown AppKit directly. There is no custom injected-connector list. Email, social, onramp, and swap are disabled.
- The connected account control is a chip-hinged expansion, not a full-height drawer.
- Connected users are matched against wallet-bound onchain/IPFS creator metadata. Published creators see a profile card; unpublished wallets get a Studio action. Demo records are never presented as the connected user's identity.
- The account panel retains payout address, PolygonScan, network, fxVERSE, self-custody, and sign-out controls.
- Homepage hero is an immersive settlement field, not a boxed dashboard card.
- Studio claim copy: **Claim — you pay gas** / **Claim — we pay gas**.
- Security page states the vault is live, deployer-owned, and not audited.

### Profile publishing

- `CreatorRegistry` owns immutable normalized slug hashes and stores a metadata URI.
- Publishing performs an onchain slug-availability preflight before upload.
- The browser signs the upload request; the Worker verifies wallet, metadata owner, slug hash, origin, expiry, and nonce.
- The Worker writes image/metadata to R2 under CID keys and returns the `ipfs://` URI.
- The wallet registers the slug and URI on Polygon.
- Discovery reads registry events and resolves wallet-bound metadata through the Worker gateway.
- A production-safe URL guard disables Worker calls if a release was built with localhost/loopback endpoints.

### Contracts and release controls

- `TipVault` supports claimable tips and campaign accounting.
- `CreatorRegistry` supports wallet-owned creator slugs and metadata.
- Foundry unit, fuzz/invariant, and Polygon fork coverage exist.
- Deployment scripts hard-lock Polygon chain ID 137 and the canonical fxVERSE address.
- `DeployTipVault.s.sol` deploys only the vault (registry already exists) and accepts a non-zero EOA owner.
- Formal release runners still default to simulation and still validate chain, deployer, audit-scope digest, audit-report digest, contract owner, and an explicit one-time broadcast phrase.
- Emergency frontend configuration can disable the vault without taking down direct tipping/discovery.

## Live configuration

Never place secret values in this handoff.

### Contracts

| Contract | Address | Tx | Block |
| --- | --- | --- | --- |
| CreatorRegistry | `0xFaaa9315Af9E0711Bc01Ecd717243117b816A268` | `0x804a265506d1b97b092bcfdb026650ae3082d3f2721f3853c98d0ddf7b727e8a` | `92127803` |
| TipVault | `0x706DB138a532b59Df3664f3e8aB86e36a744DD00` | `0x8a73e82ae788ff6ed82866ad5a2f9b343e1b81dca6c59a5fabac45753881eb16` | `92128710` |

These values are in `apps/web/.env`. `VITE_DEPLOYMENT_BLOCK` is the **registry** block so discovery does not skip registry events.

These broadcasts did **not** go through the formal audit-digest release runners. They were explicit user-requested admin deploys.

### Named Foundry accounts

| Name | Address | Role | Keychain item |
| --- | --- | --- | --- |
| `versetip-deployer` | `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24` | Official release sender and current vault owner | `versetip-foundry-deployer` |
| `goodnessonweb3` | `0x323811A100dBF486909066AA68b8C0E1A609d733` | User's general test-contract wallet and funding source | `goodnessonweb3-foundry` |
| `versetip-relayer` | `0x4cecE710dD12753d588D7299eC339dF18953B5d6` | Dedicated claim submitter only | `versetip-foundry-relayer` |

- Encrypted backup of the ops wallet remains at `.secrets/goodnessonweb3/goodnessonweb3`. Plaintext key material was removed.
- The browser wallet is a fourth identity. The agent cannot spend it. ETH on Ethereum cannot pay Polygon gas.
- Last recorded funding hops: `1 POL` then `2 POL` from `goodnessonweb3` to the deployer; `0.3 POL` to the relayer. Recheck balances before spending.

### Cloudflare Worker

- Live at `https://versetip-api.goodness-mbakara.workers.dev`
- Wrangler account used: `amicablembakara50@gmail.com` on the Goodness Mbakara Cloudflare account
- `/health` reports `ok: true`, `storage: ready`, `relayer: ready`
- R2 bucket `versetip-metadata` bound as `METADATA_BUCKET`
- Worker `TIP_VAULT_ADDRESS` is the live vault
- Allowed origins are currently local Vite only. Add the production frontend origin before a public launch
- Relayer private key is a Worker secret only. An unused first key (`0x26ec…0186`) was discarded after a failed TTY secret-put; do not fund or reuse it
- `VITE_STORAGE_API_URL` and `VITE_RELAYER_URL` are public frontend endpoint values. Relayer keys must never use a `VITE_` prefix

## Environment shapes

Use these templates; do not commit populated secrets:

- `apps/web/.env.example`
- `apps/web/.env.production.example`
- `contracts/.env.example`
- `services/api/.dev.vars.example`

Vite embeds `VITE_*` values at build / dev-server start. Restart after changing them.

## Work remaining

1. Restart Vite so it picks up the filled `.env`, then smoke-test on Polygon: publish a real profile, small direct tip, vault deposit, self-paid claim, sponsored claim.
2. Verify contract source on PolygonScan.
3. Add the public frontend origin to the Worker allowlist, then host the app.
4. Set `VITE_ANALYTICS_DOMAIN` if public traffic is expected.
5. Create a Polygon Safe and transfer vault ownership with Ownable2Step (`transferOwnership` from the deployer, `acceptOwnership` from the Safe). This is the documented security upgrade, not optional polish. Then obtain an independent audit / remediation record (`docs/AUDIT_HANDOFF.md`).
6. Commit and push in small reviewable units once the user confirms the Git history strategy. Nothing is currently committed.

Older architecture / metadata / operations docs may still mention Storacha. Prefer this handoff, `README.md`, and the latest journal entries when they disagree.

Keep writing step-by-step progress to `docs/BUILD_JOURNAL.md`. Update this handoff when the current blocker or next action changes.

## Exact verification commands

Run from the repository root:

```bash
pnpm lint
pnpm --filter @versetip/web test
pnpm --filter @versetip/web build
pnpm test:contracts
pnpm format:contracts
git diff --check
```

Profile release preflight:

```bash
pnpm preflight:profiles
```

Contract release scripts are documented in `docs/DEPLOYMENT.md`. Formal runners still default to simulation. Do not invent an audit digest to satisfy those gates.

## Mainnet test funding guide

- Basic smoke testing: `250,000 fxVERSE` (about `$4.59` at the recorded market snapshot).
- Recommended end-to-end balance: `1,000,000 fxVERSE` (about `$18.35`).
- Repeated multi-wallet rehearsal: `2,000,000 fxVERSE` (about `$36.70`).
- Keep roughly `3–5 POL` across the participating wallets for user-flow gas.
- Prices and Polygon DEX liquidity are volatile; refresh both the quote and slippage immediately before acquisition.

## Documentation map

- `docs/ARCHITECTURE.md`: system boundaries and data flow
- `docs/DEPLOYMENT.md`: deploy and production configuration runbook
- `docs/AUDIT_HANDOFF.md`: frozen audit scope and required reviewer deliverables
- `docs/SECURITY.md`: threat model and controls
- `docs/OPERATIONS.md`: post-launch operations and emergency actions
- `docs/METADATA.md`: public IPFS metadata contract
- `docs/NETWORKS.md`: Polygon mainnet decision and testnet warning
- `docs/BUILD_JOURNAL.md`: chronological implementation record

## Safety reminders

- Do not print or commit private keys, keystore passwords, RPC secrets, or relayer keys.
- Do not fund or broadcast from an uncontrolled browser wallet.
- Do not silently substitute mock VERSE on mainnet.
- Do not present demo profiles or activity as real mainnet state.
- Do not mark the product audited until an independent reviewer has delivered and signed off on the remediation record.
- Preserve unrelated user changes and avoid destructive Git commands.
