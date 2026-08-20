# Handoff: VerseTip continuation

## Next session purpose

Continue VerseTip from the live personal-fork Vercel deploy: smoke-test the product on Polygon, add the Vercel origin in Reown, then take the next product/security step (Safe ownership or requested UI).

## Status

- Done:
  - Vite + React + TS frontend, Foundry contracts, Cloudflare Worker (R2 + relayer)
  - Polygon mainnet `CreatorRegistry` and `TipVault` (EOA-owned, not audited)
  - Reown AppKit sign-in, chip-hinged account panel
  - Automatic unique profile slugs; tip any `0x` address; vault claimable is address-keyed
  - Real recent-support list with PolygonScan tx hashes
  - Creator photos framed from the top (profile + Discover cards)
  - Unregistered tip page is a wallet destination layout, not an empty profile banner
  - Cloudflare Pages project `versetip` deleted (`versetip.pages.dev` is gone)
  - Personal GitHub fork + Vercel project `versetip-app` is live
- In progress:
  - Reown Cloud allowed-domain list for the Vercel origin (wallet may still warn)
  - End-to-end smoke test on the Vercel host
- Not started:
  - PolygonScan source verification
  - Safe ownership transfer + independent audit
  - Custom domain (no zone on the Cloudflare account)

## Hard constraints

- **Polygon mainnet only (137).** No official Verse testnet. Token is fxVERSE `0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc`.
- **pnpm only.** Never npm/yarn.
- **Vite + React + TS, not Next.js.** Foundry for contracts.
- Do not print or commit keys, keystore passwords, relayer secrets, or `.env` values.
- Do not invent an audit. Vault owner is the deployer EOA by explicit user request.
- Do not use MetaMask keys. Agent cannot spend the browser wallet.
- ETH on Ethereum cannot pay Polygon gas.
- Formal `mainnet-release.sh` still requires a contract owner + audit digest; live deploys skipped those gates on purpose.
- Preserve unrelated files. No `git reset --hard` / force-push without explicit confirmation.
- Frontend deps stay in frontend packages; backend deps stay in Worker.

## Decisions already made

| Decision | Choice | Why |
|----------|--------|-----|
| Chain / token | Polygon 137 + fxVERSE | Organizer requirement |
| Vault owner | Deployer EOA for this version | User skipped Safe; Ownable2Step later |
| Metadata storage | Cloudflare R2 CID keys, `ipfs://bafkrei…` URIs | Storacha `up.storacha.network` is NXDOMAIN |
| Metadata gateway | Worker `GET /ipfs/:cid` first | Public Storacha/w3s gateways 301/CORS/DNS fail |
| Wallet connect | Reown AppKit only | No custom injected list |
| Account UI | Chip-hinged panel | Not a full-height drawer |
| Profile slugs | Auto from display name, wallet suffix if taken | Immutable on-chain; user asked automatic + unique |
| Unregistered tips | Allowed; vault keyed by address | Register later, same wallet claims |
| Frontend host | Vercel `versetip-app` on personal fork | Pages.dev flagged malicious; CF Pages deleted |
| Git remotes | `origin` = VERSEDEVOPS, `fork` = Goodnessmbakara | User asked to fork to their account |

## Live facts (do not invent new addresses)

| Thing | Value |
|-------|--------|
| Workspace | `/Users/abba/Desktop/verse_ecosystem` |
| Branch | `main` @ `3a6b17e` (matches `origin` and `fork`) |
| Origin | `https://github.com/VERSEDEVOPS/Payments-and-merchant-solutions-.git` |
| Fork | `https://github.com/Goodnessmbakara/Payments-and-merchant-solutions-` |
| Live app | https://versetip-app.vercel.app |
| Vercel project | `versetip-app` / `prj_4B9wjt4bd7jl6lKGxPVdmF90a1Hq` on Goodness Mbakara team |
| Worker | https://versetip-api.goodness-mbakara.workers.dev (`storage: ready`, `relayer: ready`) |
| CreatorRegistry | `0xFaaa9315Af9E0711Bc01Ecd717243117b816A268` tx `0x804a…7e8a` block `92127803` |
| TipVault | `0x706DB138a532b59Df3664f3e8aB86e36a744DD00` tx `0x8a73…eb16` block `92128710` |
| Vault / deployer | `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24` (`versetip-deployer`) |
| Ops wallet | `0x323811A100dBF486909066AA68b8C0E1A609d733` (`goodnessonweb3`) |
| Relayer | `0x4cecE710dD12753d588D7299eC339dF18953B5d6` (`versetip-relayer`) |
| Published profile | slug `melody-builds`, wallet `goodnessonweb3` |
| Frontend `VITE_DEPLOYMENT_BLOCK` | registry block `92127803` (do not move to vault block) |

Foundry keystores + macOS Keychain only. Never print passwords. Encrypted backup of ops wallet: `.secrets/goodnessonweb3/goodnessonweb3`.

## Key artifacts (paths only)

- Operational notes: `docs/HANDOFF.md` (stale in places; prefer this file + README)
- Journal: `docs/BUILD_JOURNAL.md`
- README: `README.md`
- Frontend: `apps/web/`
- Contracts: `contracts/src/TipVault.sol`, `contracts/src/CreatorRegistry.sol`
- Worker: `services/api/src/index.ts`, `services/api/wrangler.jsonc`
- Vercel: `vercel.json`
- Slug allocation: `apps/web/src/lib/profileMetadata.ts`
- Unregistered recipient: `apps/web/src/lib/recipient.ts`
- Recent support: `apps/web/src/lib/onchainSupport.ts`
- RPC log chunking: `apps/web/src/lib/blockRanges.ts` (dRPC free plan max 10k-block `eth_getLogs`)
- Tests: `apps/web/src/**/*.test.ts(x)`

## How to verify

```bash
pnpm --filter @versetip/web test
pnpm --filter @versetip/web build
curl -sI https://versetip-app.vercel.app | head -15
curl -s https://versetip-api.goodness-mbakara.workers.dev/health
pnpm test:contracts   # Foundry, from repo root
```

Push frontend changes to **`fork`** (`git push fork main`) so Vercel rebuilds. `origin` is the org copy; keep both in sync unless the user says otherwise.

## Open questions

- [ ] Add `https://versetip-app.vercel.app` in Reown Cloud allowed domains?
- [ ] Create/attach a custom domain (none on the Cloudflare account today)?
- [ ] When to create a Polygon Safe and run Ownable2Step?
- [ ] Verify contract source on PolygonScan?
- [ ] Should `origin` stay the default push remote, or switch to `fork`?

## Suggested skills to load

- `handoff` (already used)
- `systematic-debugging` for live RPC/CORS/AppKit failures
- `testing-tdd-discipline` + `testing-strategy` for product changes
- `elite-frontend-engineering` for UI polish
- `verification-before-completion` before claiming done
- `using-superpowers` at session start

## Do NOT re-do

- Redeploy `TipVault` / `CreatorRegistry` (already live)
- Recreate Storacha uploads
- Recreate Cloudflare Pages (`versetip.pages.dev` was deleted on purpose)
- Rebuild a custom injected-wallet picker
- Restore the manual profile-slug field
- Restore demo “Recent support” rows
- Print or rotate Foundry / relayer keys unless the user asks
- Invent an audit digest to satisfy `mainnet-release.sh`

## First actions for next agent

1. Read `README.md`, this file, then latest `docs/BUILD_JOURNAL.md` entries.
2. Open https://versetip-app.vercel.app and confirm Discover, `/melody-builds`, and Studio.
3. If the user wants product work: implement the asked change, test with `pnpm --filter @versetip/web test` and `pnpm --filter @versetip/web build`, then `git push origin main && git push fork main`.
4. If wallet connect fails on Vercel: Reown allowlist + remind `*.vercel.app` can still trip MetaMask/Blockaid without a custom domain.
5. If they want security next: Polygon Safe, then `transferOwnership` / `acceptOwnership` — do not skip the two-step.

## Known failure modes (already diagnosed)

| Symptom | Root cause | Fix already in tree |
|---------|------------|---------------------|
| MetaMask “Malicious site” on Pages | `*.pages.dev` phishing heuristics | Pages deleted; moved to Vercel |
| Catalog empty after publish | dRPC `eth_getLogs` > 10k blocks → 400 | `getLogsInChunks` in `blockRanges.ts` |
| Metadata 404 / Storacha CORS | Dead public IPFS; R2 is source of truth | Worker gateway first via `fetchIpfsJson` |
| Vercel build fail lightningcss | Orphaned CSS after `.activity-empty` | Removed in `bf40ccc` |
| Org Vercel could not see repo | Vercel GitHub app not on `VERSEDEVOPS` | Deployed from personal fork instead |
