# VerseTip

**Live app:** [https://versetip-app.vercel.app](https://versetip-app.vercel.app)

VerseTip is a creator-tipping reference application for the Verse Buildathon. It combines one-transaction direct `fxVERSE` tips with a claimable campaign vault for messages, collaborator splits, batched withdrawals, and optional gas-sponsored claims.

The production chain is **Polygon mainnet (chain ID 137)**. The supported token is [`fxVERSE`](https://polygonscan.com/token/0xc708d6f2153933daa50b2d0758955be0a93a8fec) at `0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc`. There is no official Verse testnet token; see [the network note](docs/NETWORKS.md).

> **Mainnet status (2026-08-16):** `CreatorRegistry` and `TipVault` are live on Polygon. The vault is owned by the deployer EOA for this version, not a Safe. No independent audit has been completed. Treat this as a working reference deploy, not an audited production vault.

## Live contracts!

| Contract | Address | Deploy tx | Block |
| --- | --- | --- | --- |
| CreatorRegistry | [`0xFaaa9315Af9E0711Bc01Ecd717243117b816A268`](https://polygonscan.com/address/0xFaaa9315Af9E0711Bc01Ecd717243117b816A268) | [`0x804a…7e8a`](https://polygonscan.com/tx/0x804a265506d1b97b092bcfdb026650ae3082d3f2721f3853c98d0ddf7b727e8a) | `92127803` |
| TipVault | [`0x706DB138a532b59Df3664f3e8aB86e36a744DD00`](https://polygonscan.com/address/0x706DB138a532b59Df3664f3e8aB86e36a744DD00) | [`0x8a73…eb16`](https://polygonscan.com/tx/0x8a73e82ae788ff6ed82866ad5a2f9b343e1b81dca6c59a5fabac45753881eb16) | `92128710` |

Token, owner, and Worker checks after deploy: vault token is fxVERSE, owner is `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`, vault is unpaused, `totalLiability` starts at `0`. Frontend `VITE_DEPLOYMENT_BLOCK` stays at the **registry** block `92127803` so discovery does not skip registry events.

Ownership can later move to a Safe through Ownable2Step. Formal `mainnet-release.sh` still requires a contract owner and an audit digest; these broadcasts were explicit user-requested admin deploys.

## What is included

- Vite, React, and TypeScript frontend. No Next.js and no application database.
- Wallet sign-in through [Reown AppKit](https://reown.com/appkit) (browser wallets and WalletConnect). Email, social, onramp, and swap are disabled.
- Connected account opens as a compact panel hinged on the wallet chip, not a full-height drawer.
- Direct ERC-20 tipping to creator wallets.
- Claimable `TipVault` deposits, campaigns, immutable collaborator splits, and EIP-712 sponsored claims. Studio labels the two claim paths as **Claim — you pay gas** and **Claim — we pay gas**.
- Self-service `CreatorRegistry` profiles. Metadata URIs stay provider-neutral `ipfs://bafkrei…` values.
- Cloudflare Worker for signed uploads and sponsored claims. Objects live in R2 under content-addressed CID keys; `GET /ipfs/:cid` is the first metadata gateway.
- Serialized Worker relayer with simulation, claim caps, deadlines, and a dedicated low-balance key that can only submit creator-signed claims.
- Optional Verse Analytics / Plausible-compatible event tracking.
- Foundry unit, fork, fuzz, and stateful invariant tests.

## Live Worker

- URL: `https://versetip-api.goodness-mbakara.workers.dev`
- `/health` reports `storage: ready` and `relayer: ready`
- R2 bucket: `versetip-metadata` (binding `METADATA_BUCKET`)
- Allowed origins: local Vite, `https://versetip.vercel.app`, and the Vercel team alias
- Relayer address: `0x4cecE710dD12753d588D7299eC339dF18953B5d6` (Foundry account `versetip-relayer`)

## Frontend hosting

The Vite app deploys from the personal fork `Goodnessmbakara/Payments-and-merchant-solutions-` to Vercel project `versetip-app` (`prj_4B9wjt4bd7jl6lKGxPVdmF90a1Hq`).

- Production alias: [https://versetip-app.vercel.app](https://versetip-app.vercel.app)
- Build: `pnpm install --frozen-lockfile` then `pnpm --filter @versetip/web build`, output `apps/web/dist`
- Vite `VITE_*` values are set on that Vercel project
- SPA fallback is in `vercel.json`
- Pushes to `main` on the fork trigger Vercel

Add the live Vercel origin in the Reown Cloud allowed domains list if wallet connect refuses the hosted origin.

Storacha was the original upload target. `up.storacha.network` does not resolve, so uploads moved to R2 while keeping `ipfs://` URIs that the already-deployed `MetadataURI` contract accepts.

## Repository map

```text
apps/web/       Frontend application
contracts/      Foundry contracts, scripts, and tests
services/api/   R2 upload and sponsored-claim Cloudflare Worker
docs/           Architecture, metadata, security, network, and operations guides
                Source references and chronological implementation record
```

## Local development

Requirements: Node.js 20+, pnpm 10+, and Foundry.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
# fill Reown project ID plus the live registry, vault, Worker URLs, and registry block
pnpm dev
```

Vite embeds `VITE_*` values at startup. Restart the dev server after changing `.env`.

Local `apps/web/.env` already points at the live contracts and Worker. Restart Vite, then run a small mainnet smoke test before treating the product as wired end to end.

Run the Worker locally only when you need to iterate on upload or relayer code:

```bash
cp services/api/.dev.vars.example services/api/.dev.vars
pnpm --filter @versetip/api dev
```

Never place a relayer private key, deployer secret, keystore password, or wallet seed in a `VITE_*` variable.

### Foundry accounts (local only)

These are named Foundry keystores. Passwords live in the macOS login keychain. Do not print them.

| Name | Address | Role |
| --- | --- | --- |
| `versetip-deployer` | `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24` | Official VerseTip release sender and current vault owner |
| `goodnessonweb3` | `0x323811A100dBF486909066AA68b8C0E1A609d733` | General test-contract wallet and funding source |
| `versetip-relayer` | `0x4cecE710dD12753d588D7299eC339dF18953B5d6` | Dedicated claim submitter; private key is a Worker secret only |

The browser / MetaMask wallet is a fourth identity. The agent cannot spend it.

## Verification

```bash
pnpm lint
pnpm build
pnpm --filter @versetip/web test
pnpm --filter @versetip/api typecheck
pnpm --filter @versetip/api deploy:check
pnpm test:contracts
pnpm format:contracts
```

Profile publishing preflight (after env is filled):

```bash
pnpm preflight:profiles
```

The Polygon fork suite uses `POLYGON_RPC_URL` when supplied and otherwise uses the public fallback declared in the test. A production CI pipeline should provide a private RPC endpoint.

## What is still open

1. Smoke-test the hosted app on Polygon: publish a real profile, small direct tip, vault deposit, self-paid claim, and sponsored claim.
2. Verify contract source on PolygonScan.
3. Confirm the live Vercel origin is allowed in the Reown Cloud project if AppKit blocks it.
4. Create a Polygon Safe and transfer vault ownership via Ownable2Step (`transferOwnership` then `acceptOwnership`). A single EOA should not remain the admin of the fund-holding vault. Then obtain an independent audit.

## Reference guides

- [Architecture](docs/ARCHITECTURE.md)
- [Network support](docs/NETWORKS.md)
- [Metadata and IPFS](docs/METADATA.md)
- [Security model and release gates](docs/SECURITY.md)
- [Independent audit handoff](docs/AUDIT_HANDOFF.md)
- [Mainnet deployment runbook](docs/DEPLOYMENT.md)
- [Storage, relayer, and incident operations](docs/OPERATIONS.md)
- [Implementation journal](docs/BUILD_JOURNAL.md)
- [Agent handoff](docs/HANDOFF.md)
- [Verse ecosystem onboarding](docs/VERSE-Ecosystem-Onboarding.md)
- [Verse developer tool reference](docs/VERSE%20DEVELOPER%20TOOL.pdf)
- [Verse whitepaper](docs/verse-whitepaper.pdf)
- [Buildathon announcement](docs/Verse-Buildathon-Announcement.docx)
- [Contract guide](contracts/README.md)
