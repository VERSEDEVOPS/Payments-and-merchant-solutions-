# Metadata and IPFS reference

VerseTip stores only CIDv1 base32 `ipfs://b...` URIs onchain. Gateway URLs are presentation details and must never be written into `CreatorRegistry` or `TipVault`.

## Profile document

```json
{
  "version": 1,
  "kind": "profile",
  "slug": "maya-builds",
  "name": "Maya Okafor",
  "bio": "Building useful self-custody tools.",
  "category": "Product design",
  "xHandle": "@mayabuilds",
  "website": "https://example.com",
  "image": "ipfs://bafy...",
  "publisher": "0x..."
}
```

`xHandle` and `website` are optional. `image` and `publisher` are added by the upload service after it verifies the signed request. The frontend accepts a profile only when the publisher matches the wallet that owns the registry entry.

Profile categories use a controlled taxonomy: Builder, Product design, Open source, Visual art, Education, Community, Music, and Writing. The frontend and upload service enforce the same values so discovery filters remain stable.

## Profile publishing sequence

1. Normalize the chosen slug and read the current wallet profile plus `creatorForSlug` from Polygon.
2. Reject a slug owned by another wallet or an attempt to change an existing wallet's permanent slug before uploading anything.
3. Confirm that the Worker reports Storacha storage as ready.
4. Hash the exact metadata JSON and image bytes, then request the wallet signature documented below.
5. Verify the signature, schema, image size/type/magic bytes, and per-wallet rate limit in the Worker.
6. Upload the image and enriched metadata document to Storacha and return provider-neutral `ipfs://` URIs.
7. Ask the wallet to anchor the metadata URI in `CreatorRegistry.setProfile` on Polygon mainnet.
8. After confirmation, invalidate the creator catalog. Discovery accepts the profile only when its publisher and slug hash match the registry record.

An upload can succeed while the subsequent wallet transaction is rejected or abandoned. That content remains an unanchored immutable CID and is never shown as a registered profile.

## Campaign document

```json
{
  "version": 1,
  "kind": "campaign",
  "slug": "self-custody-kit",
  "title": "Ship the self-custody starter kit",
  "description": "A practical guide for new Verse users.",
  "goal": "1000000000000000000000000",
  "image": "ipfs://bafy...",
  "publisher": "0x..."
}
```

`goal` is an 18-decimal base-unit string. The contract anchors the metadata URI and enforces the recipient split; the goal is presentation data and does not stop deposits automatically.

## Upload authentication

The browser hashes the exact pre-upload JSON bytes followed by the image bytes and asks the publisher to sign:

```text
Publish public VerseTip metadata
Wallet: <checksummed address>
Kind: profile|campaign
Content hash: <keccak256>
Issued at: <unix seconds>
Chain ID: 137
```

The Worker accepts signatures for five minutes, validates image magic bytes, caps images at 5 MB, validates the schema, adds `image` and `publisher`, uploads both files to Storacha, and returns provider-neutral URIs.

## Storacha operating characteristics

- The Storacha key and delegation proof are server secrets and never ship to the browser.
- Upload availability depends on the Worker, the Storacha account/delegation, and service quotas.
- Public gateway latency varies; use several gateways and timeouts.
- Content addressing makes published versions immutable. Updating a profile publishes a new CID; old content may remain retrievable.
- An abandoned wallet transaction can leave an uploaded but unanchored CID. It is harmless to contract state but still consumes storage.
- Keep an optional second pin for important release assets and retain original files offline.
- Do not promise permanent deletion for public IPFS content.

## Versioning

Schema version `1` is strict. Add new optional fields compatibly. A breaking change requires a new version and readers that support both versions during migration.
