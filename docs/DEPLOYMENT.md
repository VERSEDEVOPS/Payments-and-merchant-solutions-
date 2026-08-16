# Polygon mainnet deployment runbook

This runbook intentionally starts after the audit gate. It does not authorize a deployment by itself.

## 1. Freeze and verify

Record the release commit or source archive hash. From `contracts/` run:

```bash
forge fmt --check
forge lint src script test --severity high med --offline
FOUNDRY_PROFILE=ci forge test --offline
forge build --offline --sizes
```

Set a private Polygon RPC and run the fork suite against the release source. Confirm chain ID `137`, fxVERSE address `0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc`, symbol `fxVERSE`, and 18 decimals.

## 2. Prepare identities

- `TIP_VAULT_OWNER`: audited production multisig.
- Deployer: dedicated keystore or hardware-backed account holding only enough POL for deployment.
- Relayer: separate dedicated account holding only its capped operating balance.

The deployment script rejects every chain except Polygon mainnet (`137`) and rejects an owner address with no deployed bytecode. Create and verify the multisig before simulation; an EOA or counterfactual address will not pass the release script.

Never deploy with the relayer or a personal wallet. Never paste a private key into shell history, source files, `.env`, CI logs, or chat.

## 3. Simulate

```bash
export POLYGON_RPC_URL="<private Polygon RPC>"
export TIP_VAULT_OWNER="<checksummed multisig>"
forge script script/DeployTipVault.s.sol:DeployTipVault --rpc-url "$POLYGON_RPC_URL"
```

Review the simulated sender, owner, token, bytecode sizes, gas, and predicted addresses with a second person. The script deploys `TipVault` and the adminless `CreatorRegistry`.

If the profile system is released separately from the funds-holding vault, use `script/profile-release.sh simulate` after the registry/storage audit scope is frozen. The runner calls the Polygon-locked `DeployCreatorRegistry` script and has no owner input because the registry is adminless. Its `broadcast` mode still requires a matching named keystore, independent profile audit-report digest, and explicit one-time mainnet confirmation. Record the resulting deployment block for frontend discovery.

On the configured release machine, `script/mainnet-release.sh simulate` performs the same simulation after checking chain `137`, owner bytecode, audit-scope digest, and the Keychain-backed named deployer.

## 4. Broadcast and verify

Use a named Foundry keystore or hardware wallet. An example command shape is:

```bash
forge script script/DeployTipVault.s.sol:DeployTipVault \
  --rpc-url "$POLYGON_RPC_URL" \
  --account "<named deployer keystore>" \
  --broadcast
```

Verify source through the PolygonScan-supported verification flow and record deployment transaction hashes, addresses, constructor arguments, compiler `0.8.24`, optimizer runs `10000`, and `viaIR=true`. Do not configure the frontend until verified bytecode and ownership have been independently checked.

The configured release runner additionally requires a 64-character `AUDIT_REPORT_SHA256` and the one-time environment confirmation `CONFIRM_MAINNET_BROADCAST=DEPLOY_VERSETIP_CHAIN_137` before its `broadcast` action will send transactions.

## 5. Configure services

Set Worker variables and secrets:

- `ALLOWED_ORIGIN`: exact production origin(s), comma separated.
- `TIP_VAULT_ADDRESS`: verified deployment.
- `POLYGON_RPC_URL`: production RPC.
- `MAX_SPONSORED_CLAIM_WEI`: reviewed claim cap.
- `METADATA_BUCKET`: R2 binding for content-addressed profile and campaign files.
- `RELAYER_PRIVATE_KEY`: secret binding for sponsored claims only.

Set frontend variables from `apps/web/.env.example`, including vault, registry, deployment block, Worker URL, WalletConnect project ID if used, and the approved Verse Analytics domain.

Run `pnpm preflight:profiles` from the workspace root after setting the frontend environment. It verifies chain `137`, registry bytecode, deployment block, Worker reachability, and Storacha readiness without printing credentials.

Use `apps/web/.env.production.example` as the production shape. Never carry the local `http://localhost:8787` Worker value into a release: in a user's browser it resolves to that user's own machine. Set both `VITE_STORAGE_API_URL` and `VITE_RELAYER_URL` to the deployed Worker's HTTPS custom domain (preferred) or its temporary `workers.dev` URL, then rebuild the frontend because Vite embeds `VITE_*` values at build time. The frontend deliberately treats loopback service URLs as unconfigured in production and disables publishing instead of issuing requests to localhost.

## 6. Minimal-value smoke sequence

1. Confirm owner, token address, initial `totalLiability == 0`, and `isSolvent() == true`.
2. Publish one production creator profile and resolve it from a second browser/network.
3. Execute the smallest practical direct fxVERSE tip.
4. Approve an exact small vault allowance and deposit a tip.
5. Confirm claimable amount and liability equal the vault balance attributable to the deposit.
6. Claim part directly; confirm liability and balance decrease together.
7. Test one capped sponsored claim from the dedicated relayer.
8. Create a two-recipient campaign, deposit a minimal amount, verify rounding allocation, and claim both shares.
9. Confirm Verse Analytics receives only the approved product events.

Stop immediately on any mismatch. Pause new vault deposits while investigating; do not block claims.

## 7. Publish the deployment record

Add a versioned deployment file containing chain ID, block, addresses, transaction hashes, explorer links, source commit, audit report hash/link, multisig, compiler settings, and smoke-test transactions. Never include secret material.
