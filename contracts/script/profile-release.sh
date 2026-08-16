#!/usr/bin/env bash

set -euo pipefail

release_action="${1:-simulate}"
contracts_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace_dir="$(cd "$contracts_dir/.." && pwd)"

if [[ "$release_action" != "simulate" && "$release_action" != "broadcast" ]]; then
  echo "Usage: script/profile-release.sh [simulate|broadcast]" >&2
  exit 2
fi

cd "$contracts_dir"

if [[ ! -f .env ]]; then
  echo "contracts/.env is missing." >&2
  exit 1
fi

set -a
source .env
set +a

: "${ETH_KEYSTORE_ACCOUNT:?Set ETH_KEYSTORE_ACCOUNT in contracts/.env}"
: "${DEPLOYER_ADDRESS:?Set DEPLOYER_ADDRESS in contracts/.env}"
: "${POLYGON_RPC_URL:?Set a private POLYGON_RPC_URL in contracts/.env}"
: "${PROFILE_AUDIT_SCOPE_SHA256:?Set PROFILE_AUDIT_SCOPE_SHA256 in contracts/.env}"

chain_id="$(cast chain-id --rpc-url "$POLYGON_RPC_URL")"
if [[ "$chain_id" != "137" ]]; then
  echo "Refusing release on chain $chain_id; Polygon mainnet is 137." >&2
  exit 1
fi

scope_digest="$({
  printf '%s\n' \
    contracts/src/CreatorRegistry.sol \
    contracts/src/libraries/MetadataURI.sol \
    contracts/script/DeployCreatorRegistry.s.sol \
    contracts/script/profile-release.sh \
    contracts/test/CreatorRegistry.t.sol \
    apps/web/src/features/profile/ProfileEditor.tsx \
    apps/web/src/features/profile/ProfileEditor.test.tsx \
    apps/web/src/lib/config.ts \
    apps/web/src/lib/onchainCreators.ts \
    apps/web/src/lib/onchainCreators.test.ts \
    apps/web/src/lib/profileMetadata.ts \
    scripts/profile-publishing-preflight.mjs \
    services/api/src/index.ts \
    services/api/src/storage.ts \
    services/api/wrangler.jsonc
} | while IFS= read -r file; do
  shasum -a 256 "$workspace_dir/$file"
done | shasum -a 256 | awk '{print $1}')"

if [[ "$scope_digest" != "$PROFILE_AUDIT_SCOPE_SHA256" ]]; then
  echo "Profile audit scope changed: expected $PROFILE_AUDIT_SCOPE_SHA256, got $scope_digest." >&2
  echo "Freeze and re-audit the new scope before release." >&2
  exit 1
fi

keychain_account="$(id -un)"
keystore_password="$(security find-generic-password -a "$keychain_account" -s versetip-foundry-deployer -w)"
derived_deployer="$(cast wallet address --account "$ETH_KEYSTORE_ACCOUNT" --password "$keystore_password")"
normalized_derived="$(printf '%s' "$derived_deployer" | tr '[:upper:]' '[:lower:]')"
normalized_expected="$(printf '%s' "$DEPLOYER_ADDRESS" | tr '[:upper:]' '[:lower:]')"
if [[ "$normalized_derived" != "$normalized_expected" ]]; then
  unset keystore_password
  echo "Named keystore does not match DEPLOYER_ADDRESS." >&2
  exit 1
fi

release_args=(
  forge script script/DeployCreatorRegistry.s.sol:DeployCreatorRegistry
  --rpc-url "$POLYGON_RPC_URL"
  --account "$ETH_KEYSTORE_ACCOUNT"
  --password "$keystore_password"
)

if [[ "$release_action" == "broadcast" ]]; then
  if [[ ! "${PROFILE_AUDIT_REPORT_SHA256:-}" =~ ^[0-9a-fA-F]{64}$ ]]; then
    unset keystore_password
    echo "A valid independent PROFILE_AUDIT_REPORT_SHA256 is required to broadcast." >&2
    exit 1
  fi
  if [[ "${CONFIRM_PROFILE_MAINNET_BROADCAST:-}" != "DEPLOY_VERSETIP_PROFILE_CHAIN_137" ]]; then
    unset keystore_password
    echo "Set CONFIRM_PROFILE_MAINNET_BROADCAST=DEPLOY_VERSETIP_PROFILE_CHAIN_137 for the reviewed release." >&2
    exit 1
  fi
  release_args+=(--broadcast)
fi

"${release_args[@]}"
unset keystore_password
