# VerseTip Build Journal

This journal records the end-to-end construction of VerseTip as it happens. It is intended to become both an implementation history and source material for the final reference guide.

## 2026-08-16

### Product direction established

- Defined VerseTip as a mainnet creator-economy reference application for the Verse ecosystem.
- Initially evaluated Ethereum mainnet and its canonical VERSE contract. This decision was superseded by the organizer-confirmed Polygon-mainnet requirement documented under **Network research** below.
- Selected two settlement rails:
  - Direct ERC-20 transfer for the cheapest one-transaction tip.
  - Claimable vault deposits for campaigns, collaborator splits, messages, batching, and sponsored claims.
- Extended the original 24-hour prototype into an audited multi-day build because the vault holds user funds.
- Selected Vite + React + TypeScript for the frontend and Foundry for contracts.
- Studied the Verse whitepaper, developer tool sheet, ecosystem onboarding guide, Verse Impact Hub, official contracts, and Cencori design system.
- Established a dark-first, dense-but-breathable visual direction with an original VerseTip identity.

### Controlled creator categories

- Replaced the free-text creator category field with an accessible native dropdown.
- Added a stable category taxonomy so discovery filters do not split equivalent categories because of spelling or capitalization differences.
- Styled the dropdown for light, dark, keyboard, and mobile use while preserving the selected value in published IPFS metadata.
- Enforced the same taxonomy at the signed Worker upload boundary.
- Added an onchain slug-ownership preflight before uploading to IPFS, avoiding orphan uploads when a slug is unavailable or immutable.
- Bound discovery metadata to both the publishing wallet and reserved onchain slug hash, preventing mismatched IPFS metadata from impersonating another route.
- Invalidated the creator catalog after confirmation and added a direct post-publish path to the live profile.
- Added a storage-readiness handshake before the browser requests a signature and exposed non-secret component readiness through the Worker health endpoint.
- Added a Polygon-locked standalone registry deployment script and a repeatable profile-publishing preflight covering chain, bytecode, deployment block, Worker reachability, and Storacha readiness.
- Wrapped the standalone registry deployment in its own audit-scope, named-keystore, chain-ID, report-digest, and explicit-broadcast release gate; no deployment was broadcast.
- Verified the local Worker health contract reports storage and relayer readiness independently; both correctly remain `unconfigured` until their secrets are provisioned.

### Profile registry funding preflight

- Re-ran the standalone `CreatorRegistry` deployment simulation against Polygon mainnet chain ID `137` using the dedicated deployer `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`.
- Confirmed the deployer balance remains exactly `0 POL`; no funding or deployment transaction was submitted.
- The observed simulation estimated `878,192` gas and `0.5115448760992304 POL`, so the current buffered funding target is `0.70 POL`. This estimate must be refreshed if funding or deployment is delayed.
- Confirmed the funded browser wallet is not available through the controllable wallet provider and its signing key is not stored in the repository or Foundry keystore. Funding therefore remains a user-confirmed MetaMask transfer rather than an unattended transaction.

### Right-side account drawer

- Replaced the centered connected-account dialog with a floating right-side drawer on desktop and an accessible bottom sheet on narrow mobile screens.
- Reorganized the account surface around Polygon network status, full wallet identity, copy and PolygonScan actions, the active tipping asset, self-custody assurance, and a visually separated sign-out action.
- Added purpose-built light and dark treatments, responsive address truncation, safe-area spacing, and directional drawer motion while preserving Radix focus trapping and keyboard dismissal.
- Verified the frontend lint, all 16 frontend tests, and the production build after the account-drawer redesign.
- Promoted the drawer into a connected creator profile card backed by the onchain registry and wallet-bound IPFS metadata, including the profile image, name, handle, category, bio, and public profile route.
- Added an explicit unpublished-profile state that routes the connected user to Creator Studio without ever presenting a demo record as their identity.
- Kept payout address, network, tipping asset, PolygonScan, custody assurance, and sign-out controls subordinate to the public creator identity.
- Deferred the creator-catalog request until a wallet is connected and added a regression test for wallet-to-profile matching; the frontend now passes all 17 tests.

### Repository initialized

- Created the Foundry project in `contracts/`.
- Installed `forge-std` and OpenZeppelin Contracts.
- Created the frontend, shared-package, relayer, and documentation directory structure.
- Added a root package manifest and workspace foundation.

### First contract implementation

- Implemented `TipVault.sol` with:
  - Claimable VERSE balances.
  - Standard allowance-based tips.
  - EIP-2612 permit-based tips.
  - Campaign creation with bounded collaborator splits.
  - Campaign deposits and deterministic rounding allocation.
  - Direct creator claims and alternate-recipient claims.
  - EIP-712 signed claims that can be submitted by a gas sponsor.
  - Per-creator nonces and signature deadlines.
  - Deposit pause controls that intentionally do not block claims.
  - Reentrancy protection and `SafeERC20` transfers.
  - A contract-level solvency assertion after every balance-changing operation.
- Added a permit-enabled mock VERSE token.
- Added a mainnet deployment script with the canonical VERSE address.
- Enabled optimizer, IR compilation, CI fuzzing, invariant configuration, and RPC configuration in Foundry.

### Verification in progress

- Ran the Foundry formatter and corrected formatting drift.
- Diagnosed hanging online compiler checks and switched deterministic local builds to Foundry's offline mode.
- Fixed a missing explicit `ERC20` import in the mock token constructor.
- Completed Solidity compilation successfully with Solc 0.8.24.
- Added eight initial unit tests covering standard tips, permit tips, campaign split rounding, invalid splits, claims, sponsored-claim replay protection, pause behavior, and excess-claim rejection.
- All eight tests pass.

### Frontend implementation started

- Created the Vite + React + TypeScript application.
- Added wagmi, viem, WalletConnect/Reown support, TanStack Query, Supabase adapter, Radix dialogs, motion, charts, and testing dependencies.
- Created the original VerseTip vector mark and dark-first interface foundation.
- Implemented initial routes for landing, creator profiles, discovery, creator studio, ecosystem education, and security.
- Implemented the direct VERSE tipping transaction flow with balance, chain, confirmation, receipt, and error states.
- Kept the vault flow configuration-gated until audited deployment.

### Network research

- Evaluated the user-provided Polygon token address `0xc708d6f2153933daa50b2d0758955be0a93a8fec`.
- Verified it directly through Polygon JSON-RPC as `Verse (FXERC20)`, symbol `fxVERSE`, 18 decimals, on Polygon mainnet.
- Confirmed that this is a second mainnet deployment, not a testnet token.
- Searched the supplied Notion link, public search indexes, Sepolia explorer results, and Bitcoin.com GitHub sources; no publicly verifiable canonical Sepolia VERSE address was found.
- Received direct confirmation from the organizer that there is no supported Verse testnet token and builders must use Polygon mainnet directly.
- Corrected the earlier testnet-guide plan: no Sepolia deployment or testnet-token instructions will be published. `MockVerse` exists strictly as a local automated-test fixture and must never be presented as an official network.
- Pivoted the production app and Foundry deployment target to Polygon mainnet (chain ID `137`) using `fxVERSE` at `0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc`.
- Confirmed via live contract calls that Polygon `fxVERSE` does not implement EIP-2612 permit. Removed the permit deposit path from `TipVault` to keep the mainnet contract aligned with the actual token and minimize attack surface.

### Current external release gates

- Independent security audit and remediation sign-off are required before mainnet deployment.
- Multisig owner address is required for the final deployment.
- Production RPC, WalletConnect project ID, Supabase credentials, analytics specification/app ID, hosting access, and relayer funding will be required before production release.

### Polygon pivot verification

- Updated the wallet connection, token reads, direct-transfer flow, vault approval/deposit flow, gas balance, explorer links, interface copy, and environment template for Polygon mainnet.
- Added `docs/NETWORKS.md` with an explicit warning that no official Verse testnet exists.
- Completed a clean production frontend build after the network pivot.
- Re-ran the Foundry suite after removing unsupported token permits: all 7 tests pass.

### Superseded Amoy experiment

- Adopted an explicit two-environment workflow: a VerseTip-owned mock on Polygon Amoy followed by the real fxVERSE integration on Polygon mainnet.
- Kept the documentation distinction explicit: Verse still has no official testnet token; `tVERSE` is an unofficial project fixture with no value.
- Changed `MockVerse` to mirror fxVERSE's ordinary ERC-20 approval flow and removed permit support.
- Added a public test-token faucet and a Foundry script that deploys both `tVERSE` and `TipVault` on Amoy.
- Made the frontend network, token address, token symbol, RPC, expected chain, and explorer configurable between Amoy and Polygon mainnet.
- Generated a dedicated Amoy deployer as an encrypted Foundry-compatible keystore, stored under the git-ignored `.secrets/` directory with owner-only filesystem permissions. No private key or password was printed to logs or chat.
- Researched live Amoy-funding workarounds after established faucets rejected the brand-new deployer. Documented Chainlink's 0.5 POL faucet, OpenFaucet's no-history browser proof-of-work route, a CAPTCHA fallback, and ETHGlobal's authenticated faucet.
- Simulated the complete Amoy deployment against the live RPC: `3,585,874` estimated gas and approximately `0.108 POL` at the observed 30 gwei price. Set `0.15 POL` as the safe pre-deployment funding target.

### Final network decision

- Received the Verse product manager's explanation that their Polygon testnet and mainnet integrations are not one-to-one and that builders are encouraged to validate on Polygon mainnet because production fees are low.
- Superseded the experimental Amoy plan. Removed the Amoy deployment script, frontend network switching, testnet token configuration, faucet instructions, and public-testnet RPC configuration.
- Retained `MockVerse` only for local automated tests. The production validation path is now local testing, Polygon-mainnet forking against real fxVERSE, external audit, and minimal-value mainnet smoke tests.
- Added stateful invariant handlers for deposits and claims. Solvency, liability accounting, and zero-native-balance invariants passed 256 runs each, totaling 384,000 handler calls without a revert.
- Added Polygon-mainnet fork tests against the live fxVERSE bytecode. Verified contract code, name, symbol, decimals, vault binding, initial solvency, and absence of EIP-2612 permit support; both fork tests pass.

### Frontend completion and storage architecture

- Implemented the creator claim transaction in Studio, including wallet confirmation, Polygon receipt tracking, balance refresh, explorer linking, actionable errors, and payout-address copying.
- Added route-level code splitting. The initial production bundle no longer triggers Vite's oversized-chunk warning; the charting code is isolated to the Studio route.
- Removed the unused Supabase adapter, environment variables, package, and lockfile dependencies. VerseTip will not require an application database.
- Selected an onchain-first metadata model: contracts and events are the source of truth, while public profile and campaign JSON uses provider-neutral `ipfs://` content identifiers.
- Selected Storacha for canonical IPFS/Filecoin persistence with an optional second-provider pin. No Storacha- or Pinata-specific gateway URL will be committed onchain.
- Reserved Verse Analytics integration for the organizer's self-hosted Plausible-compatible service at `analytics.vgdh.io`; no invented event API will be used.

### Onchain discovery and creator publishing

- Added the adminless `CreatorRegistry` for wallet-owned profiles. A wallet permanently owns its slug, may update its IPFS metadata anchor, and may deactivate or reactivate discovery without an administrator.
- Added strict CIDv1 base32 `ipfs://` validation shared by creator profiles and campaign metadata.
- Implemented the creator profile editor and campaign editor. Both bind the exact metadata and image bytes to a wallet signature before upload, then anchor the returned CID on Polygon.
- Implemented collaborator campaign splits for up to eight total recipients with exact 10,000-basis-point accounting, unique wallets, and a required positive creator share.
- Replaced database-backed discovery with registry event scanning, current-state reads, publisher verification, and redundant IPFS gateways.

### Storacha and Worker implementation

- Added a Cloudflare Worker upload route backed by Storacha. Server-side key/delegation material never reaches the browser.
- Added strict metadata schemas, a 5 MB image cap, content-length limits, PNG/JPEG/WebP magic-byte checks, a five-minute signature window, and per-wallet rate limiting.
- Documented Storacha tradeoffs: gateway variability, service/delegation quotas, immutable old versions, possible unanchored uploads after rejected wallet transactions, and optional second-provider pinning.
- Added a gas-sponsored claim route with a dedicated low-balance relayer, per-creator rate limits, a configurable cap, a fifteen-minute signature deadline, live claimable checks, and pre-submission simulation.
- Serialized relay submissions through one Durable Object to prevent nonce races.
- Hardened CORS to reject unknown browser origins and support an explicit comma-separated production allowlist.

### Security hardening and product-integrity pass

- Added `recoverExcess`, which allows the multisig owner to recover only fxVERSE above `totalLiability`; creator liabilities remain mathematically unavailable to the owner.
- Rejected zero campaign slugs and added regression tests for zero-slug creation, excess recovery, owner limits, and non-owner access.
- Bounded sponsored-claim signature payloads while retaining support for longer ERC-1271 contract-wallet signatures.
- Identified that showcase profiles could appear live before deployment. Marked all fallback content as illustrative, removed explorer claims for demo wallets, and disabled every approval/transfer path to demo recipients.
- Completed desktop and mobile browser QA across landing, discover, creator, and studio routes with no browser warnings or errors.
- Added frontend unit tests for the onchain metadata trust boundary, address/error formatting, and mutable gateway rejection.
- Current automated result: 24 Foundry tests pass, including three 256-run stateful invariants totaling 384,000 calls; six frontend tests pass; Solidity medium/high lint, frontend lint/build, Worker typecheck, and Worker dry-run bundle are clean.
- Foundry coverage after the hardening pass measured 90.51% lines, 87.61% statements, 52.94% branches, and 84.62% functions across the suite. Additional branch coverage remains a target for the independent audit/remediation cycle.
- Replaced the connected Studio's static design metrics with live `TipVault` event and state reads. Vault support, unique supporters, campaign status, campaign totals, and campaign activity now derive from Polygon rather than placeholder analytics.
- Extended metadata upload verification to Polygon RPC so EOA signatures and ERC-1271 smart-wallet signatures are both supported.
- Completed a non-broadcast Polygon-mainnet deployment simulation for both contracts. The script bound the vault to the canonical fxVERSE address and produced a successful chain-137 gas estimate without sending a transaction.
- Finished the interaction sweep by wiring the previously decorative discovery filter into real, accessible category filtering.

### Reference and release documentation

- Added architecture, IPFS metadata, security model, Polygon deployment, and operations/incident runbooks.
- Replaced the default Foundry README with a VerseTip-specific contract guide.
- Made the mainnet release gate explicit: independent audit, remediation sign-off, frozen reproducible source, multisig verification, simulations, monitoring, and a recorded human broadcast approval.
- Superseded the earlier infrastructure needs list: Supabase is not used. Production still requires reviewed hosting, RPC, WalletConnect configuration if selected, Storacha delegation, Verse Analytics domain, relayer secret/funding, and audited contract addresses.

### Brand and wallet experience refinement

- Replaced the early placeholder `V.` tile with a production SVG identity, then simplified it after visual review into a flat monochrome geometric mark: a V whose rising arm resolves into an upward tip arrow. The final mark uses no gradient, glow, decorative dot, or fine detail that disappears at favicon size.
- Added a tighter VerseTip wordmark treatment and installed the mark as the browser favicon and wallet-connection metadata icon.
- Removed the navbar divider and changed the sticky header to a soft transparent blur so the navigation flows into each page.
- Rebuilt the disconnected wallet button as a compact dark network-aware capsule and the connected state as an address/network identity chip.
- Redesigned both wallet dialogs with branded hierarchy, clearer connector descriptions, a self-custody assurance, improved focus states, and responsive mobile proportions.
- Visually verified the new header and wallet modal on desktop and 390px mobile layouts with no console warnings or errors.

### Theme preferences

- Added a first-class Preferences dialog to the global header with Dark, Light, and System appearance choices.
- Centralized theme state at the application root so routes, dialogs, form controls, wallet surfaces, and toast notifications resolve the same active theme.
- Persisted the user's preference locally and added live operating-system change handling when System is selected.
- Added a full light palette with purpose-built contrast overrides for the sticky header, wallet controls, primary actions, progress tracks, and wallet connection dialogs.
- Added unit coverage for explicit and system-resolved themes. Frontend lint, production build, and all eight tests pass.
- Visually verified the preferences flow and creator/tipping page in both dark and light modes, confirmed the light choice survives reload, and found no browser runtime errors.

### Wallet language refinement

- Replaced the crypto-native “Connect wallet” interface language with the more familiar “Sign in” model.
- Updated the entry button, sign-in dialog, Studio gate, signed-in account label, and sign-out action while preserving explicit Polygon mainnet context and self-custody assurances.

### Mobile experience hardening

- Audited the landing, discovery, creator tipping, Studio, ecosystem, security, sign-in, and Preferences experiences as one phone journey.
- Added a safe-area-aware mobile bottom navigation bar after identifying that hiding the desktop navigation left phone users without persistent access to Discover, Studio, or Ecosystem.
- Converted phone dialogs into scroll-safe bottom sheets with dynamic viewport-height limits, larger close controls, and safe-area padding.
- Standardized primary mobile touch targets at 44 pixels or larger across navigation, filters, presets, creator actions, account controls, and wallet choices.
- Increased compact phone copy where the desktop typography was too small, protected decorative hero content from horizontal overflow, and made the footer stack cleanly on narrow screens.
- Set interactive form text to at least 16 pixels on phones to prevent unwanted iOS Safari zoom while preserving the larger amount-entry treatment.
- Rechecked all six routes for runtime errors and horizontal overflow, exercised both global dialogs, and completed clean frontend lint, production build, and eight-test runs.

### Discovery filter correction

- Reproduced the category-filter interaction and found that its state logic worked, but the original unlabeled chip row was visually weak enough to appear broken.
- Replaced the ambiguous “Filters” control with an explicit All Categories selector and a structured category panel showing creator counts and the active option.
- Made category selection filter the grid immediately, close the panel, update the result summary, and expose a one-click clear-filter action.
- Improved the phone layout by stacking search and category controls and keeping every filter choice touch-friendly.
- Added an interaction regression test covering open, select, filtered results, and clear. Frontend verification now passes nine tests alongside lint and the production build.

### Light-theme and color identity refinement

- Rebalanced the light appearance around a cooler neutral canvas, clearer white surfaces, firmer borders, and cooler shadows so cards and controls retain hierarchy without feeling washed out.
- Corrected intentionally dark showcase surfaces—including creator spotlights, floating receipts, profile art, campaign balances, and token marks—so their internal text and badges remain legible when the rest of the application is light.
- Increased clarity in the light wallet entry control and added subtle surface depth to discovery, campaign, Studio, ecosystem, and security cards.
- Reworked the SVG mark into a restrained four-ink identity using separate blue, violet, coral, and amber shapes. The logo contains no gradients and remains a single scalable asset for the header, favicon, and wallet metadata.
- Visually verified the landing hero, discovery search/results, creator cards, and Preferences dialog in the refreshed light appearance.
- Completed the refinement with clean frontend lint and production build runs; all nine frontend tests pass.

### Documentation consolidation

- Moved the implementation journal, Verse onboarding guide, developer-tool reference, whitepaper, and Buildathon announcement into the central `docs/` directory.
- Kept the repository `README.md` at the root for GitHub project discovery and updated its repository map and reference links to the new document locations.

### Header alignment refinement

- Reduced the appearance preference trigger to an accessible icon-only control and moved it to the outermost right position after the wallet sign-in control.
- Shifted the desktop primary-navigation pill slightly right to create a more deliberate balance between the compact brand and the denser account controls.
- Visually verified the updated creator-page header and completed clean lint, production build, and nine-test runs.

### Onchain education link correction

- Rewired the creator-page “Learn how onchain tips work” action away from the generic Verse ecosystem directory and into a dedicated homepage explainer.
- Added reliable hash-based scrolling and aligned the explainer copy with the actual direct-transfer, claimable-vault, and Polygon confirmation paths.
- Exercised the link in-browser and confirmed it lands with the explainer heading correctly offset beneath the sticky header; lint, build, and all nine frontend tests pass.

### Mainnet activation preflight

- Populated the local frontend environment with the public Polygon RPC, local storage Worker, and Verse Analytics script settings while leaving vault, registry, deployment block, relayer, and analytics domain unset until verified production values exist.
- Verified the canonical token directly on Polygon chain `137`: `Verse (FXERC20)`, symbol `fxVERSE`, and 18 decimals.
- Re-ran contract formatting, medium/high lint, the 24-test CI suite, all three 256-run invariants, the Polygon fork checks, and bytecode size reporting successfully.
- Added deployment-script guards that reject non-Polygon chains and reject an EOA or undeployed address as the production vault owner.
- Confirmed the independent audit/remediation record, production multisig, named deployer keystore, private deployment RPC, relayer, and production service endpoints are not yet configured; no mainnet transaction was broadcast.
- Fixed a WalletConnect metadata initialization bug revealed by enabling the real local project ID, making the configuration safe to import in non-browser test environments.
- Forced a full release build after discovering that a lint-only Foundry artifact omitted script bytecode, then successfully reran the hardened deployment as a no-broadcast Polygon simulation.
- At Polygon block `92121070`, the simulation estimated `4,150,259` gas and approximately `2.541 POL` at the then-current public-RPC gas estimate. The returned addresses are simulation-only and were not copied into frontend configuration.

### Transparent brand mark

- Removed the dark rounded tile and border from the shared VerseTip SVG in both themes, leaving the four flat color shapes on a transparent canvas.
- Tightened the SVG view box so the standalone mark retains visual weight in the header, favicon, footer, wallet metadata, and sign-in dialog.
- Removed the sign-in dialog's extra logo-tile background and shadow so it uses the same container-free identity.
- Visually verified the transparent mark in both light and dark appearances; lint, build, and all nine frontend tests pass.

### Deployer and audit handoff configuration

- Created a dedicated encrypted Foundry keystore named `versetip-deployer`; its password is stored in the macOS login keychain under `versetip-foundry-deployer` and is not present in the repository or chat.
- Recorded only the public deployer address, `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`; it currently holds no POL or fxVERSE.
- Added an ignored contract environment file that selects the named keystore and leaves the private RPC, production multisig owner, and independent report hash pending.
- Prepared `docs/AUDIT_HANDOFF.md` with the exact review scope, aggregate source digest, security questions, tested properties, reproduction commands, required deliverables, and remediation-record requirements.
- Added a Keychain-backed mainnet release runner that defaults to simulation and blocks broadcast on the wrong chain, an undeployed owner, a changed audit scope, the wrong named keystore, a missing independent report hash, or a missing explicit broadcast confirmation.
- Verified the runner's executable mode and shell syntax, confirmed the named keystore resolves locally, reproduced the frozen audit-scope digest, and confirmed it stops safely while the private RPC is unset.

### Hero payment-flow illustration

- Replaced the generic oversized profile-card mockup with a purpose-built fxVERSE payment-flow scene.
- The new illustration communicates the actual product path from supporter wallet through Direct or Vault routing to creator delivery and a Polygon receipt.
- Kept the artwork code-native, theme-aware, responsive, and sharp at every density, with a restrained token-travel motion that respects reduced-motion preferences.
- Marked fallback data as illustrative so the homepage does not imply that a demo transaction was broadcast.
- Visually checked the finished composition in dark and light appearances, then completed clean frontend lint, production build, and nine-test runs.

### Hero announcement removal

- Removed the “Now building on Verse” announcement pill so the landing-page headline is the hero's first visual element.
- Removed the pill's unused component import and CSS rules.

### WalletConnect runtime correction

- Traced the apparently unresponsive WalletConnect control to Wagmi's optional WalletConnect provider package being absent from the frontend runtime.
- Added the required Ethereum provider dependency so the QR/deep-link interface can initialize when selected.
- Made the sign-in dialog close before handing control to a wallet and reopen with a visible error message if initialization or authorization fails, removing the previous silent-failure path.
- Restarted the local Vite preview to clear its failed optional-import cache, then exercised the Studio sign-in flow and confirmed that selecting WalletConnect opens its scannable QR interface and wallet search.
- Completed clean frontend lint, production build, and nine-test runs after aligning the connector array typing exposed by the newly installed provider.

### Production storage endpoint guard

- Confirmed that the local `http://localhost:8787` Worker URL cannot serve production browsers and would otherwise resolve to each visitor's own machine.
- Added a production URL template and made the frontend reject loopback service URLs in production, causing profile and campaign publishing to fail closed until a real HTTPS Worker endpoint is configured.
- Added focused URL-boundary tests covering local development, production loopback rejection, HTTPS and same-origin endpoints, trailing-slash normalization, and malformed values.
- Documented that the deployed Worker URL must be supplied at frontend build time and that the Worker's allowed origin must match the final application origin.
- Confirmed that the local Wrangler session is no longer authenticated, so the production Worker URL cannot be issued until Cloudflare authentication is restored.
- Completed clean frontend lint and production build checks with all 13 frontend tests passing.
### Appearance panel refinement

- Replaced the oversized centered Preferences modal with a compact right-side appearance panel on desktop.
- Reduced the theme controls to three clear, accessible rows for Dark, Light, and System, with immediate active-state feedback.
- Preserved a mobile-first bottom sheet so theme selection remains thumb-friendly on small screens.
- Added a focused component test covering panel opening and theme selection.
- Made each theme row's accessible name explicit and completed clean frontend lint, all 18 frontend tests, the production build, and whitespace validation.

### Continuity handoff

- Added `docs/HANDOFF.md` so a new agent can resume without reconstructing decisions from chat history.
- Recorded the product constraints, implementation inventory, deployment and security blockers, public deployer identity, production configuration gaps, current UI work, exact verification commands, and prioritized next actions.
- Kept all secrets out of the handoff and explicitly preserved the independent-audit, multisig, funding, and final-broadcast approval gates.

### Official token mark

- Replaced the generic letter-V token badge on the Ecosystem orbit with the official folded Verse token mark, and reused the same mark in the homepage payment scene and tip composer.
- The orbit now presents fxVERSE as a recognizable token rather than a typographic placeholder.
- Added a focused page test so the orbit cannot regress back to a letter V.

### Immersive homepage settlement scene

- Made the homepage settlement scene immersive: the boxed dashboard card is gone, the right half of the hero is a glowing field, and the supporter/creator plates float inside concentric rings while the fxVERSE mark travels a longer lit path.

### Reown AppKit sign-in

- Replaced the custom injected/WalletConnect connector dialog with Reown AppKit. Sign in now opens the kit modal, which already covers browser wallets and WalletConnect, so MetaMask no longer opens its own install QR through wagmi's injected connector.
- Disabled AppKit email, social, onramp, and swap features so the product remains self-custodial.

### Connected-account expansion

- Changed the connected account surface from a full-height right drawer into a compact expansion hinged on the wallet chip. Clicking the signed-in control now reveals profile, payout, network, and sign-out details without a detached modal overlay.

### Deployment funding clarification

- Confirmed `VITE_TIP_VAULT_ADDRESS` and `VITE_CREATOR_REGISTRY_ADDRESS` cannot be filled yet: only dry-run broadcasts exist, and the predicted addresses have no Polygon bytecode.
- Distinguished three identities:
  - Browser/MetaMask wallet: user-controlled; the agent cannot spend it.
  - Mainnet Foundry deployer `versetip-deployer`: `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`, still 0 POL and 0 ETH.
  - `.secrets/amoy` test keystore: `0x323811A100dBF486909066AA68b8C0E1A609d733`, leftover Amoy material, about 0.00153 ETH on Ethereum and 0 POL on Polygon. Not MetaMask and not the mainnet deployer.
- Recorded that ETH on Ethereum cannot pay Polygon gas. The deployer must receive native POL on Polygon.
- Published the mainnet deployer public key for the user; funding still uses the address, not the public key.
- Did not print private keys, keystore passwords, or spend from `.secrets`.

### Agent-controlled funding hop

- User designated `.secrets/amoy` address `0x323811A100dBF486909066AA68b8C0E1A609d733` as the wallet they will fund, so the agent can forward POL to the official mainnet deployer.
- This address remains a funding hop only. It is not MetaMask and it does not replace Foundry deployer `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`.
- Rechecked balances: hop has ~0.00153 ETH on Ethereum, 0 POL and 0 fxVERSE on Polygon; deployer still has 0 POL.
- No transfer or bridge was sent. Existing Ethereum ETH stays put until the user sends native POL on Polygon or explicitly authorizes a bridge.

### Foundry-managed ops wallet

- Renamed the user-funded development wallet to Foundry account `goodnessonweb3` at `0x323811A100dBF486909066AA68b8C0E1A609d733`.
- Password is in the login keychain as `goodnessonweb3-foundry`. Keystore permissions are `600` under `~/.foundry/keystores/goodnessonweb3`.
- Removed the plaintext private key and password from the project tree. Only an encrypted backup remains at `.secrets/goodnessonweb3/goodnessonweb3`.
- This account is the user's general test-contract wallet, not VerseTip-specific. Official VerseTip mainnet release sender remains `versetip-deployer` / `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`.

### Deployer gas funded

- Confirmed `goodnessonweb3` received native POL on Polygon, then sent `1 POL` to `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`.
- After the transfer: deployer holds `1.0 POL`; `goodnessonweb3` holds about `25.56 POL` and `100,000 fxVERSE`.
- No fxVERSE was moved. No contract was broadcast.

### CreatorRegistry mainnet deploy

- User requested an immediate deploy after the deployer was funded with 1 POL.
- Did not deploy `TipVault`: it still requires a deployed multisig `TIP_VAULT_OWNER` and an independent audit-report digest. The vault script refuses an EOA owner.
- Simulated then broadcast `DeployCreatorRegistry` from `versetip-deployer` on Polygon chain `137`.
- Registry address: `0xFaaa9315Af9E0711Bc01Ecd717243117b816A268`
- Transaction: `0x804a265506d1b97b092bcfdb026650ae3082d3f2721f3853c98d0ddf7b727e8a`
- Deployment block: `92127803`
- Verified on-chain bytecode is present. Deployer remaining balance is about `0.74 POL`.
- Wrote `VITE_CREATOR_REGISTRY_ADDRESS` and `VITE_DEPLOYMENT_BLOCK` into `apps/web/.env`. Left `VITE_TIP_VAULT_ADDRESS` empty.
- This registry broadcast did not go through the formal `PROFILE_AUDIT_REPORT_SHA256` release runner; it was an explicit user-requested adminless registry deploy so discovery/profile work can continue.

### TipVault single-operator deploy

- User chose to skip Safe for this version and own the vault with the deployer EOA.
- Changed `DeployTipVault.s.sol` to deploy only `TipVault` (registry already exists) and to accept a non-zero EOA owner. Formal `mainnet-release.sh` still requires a contract owner and an audit digest.
- Set `TIP_VAULT_OWNER=0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`.
- Simulation required about `2.09 POL`; topped the deployer with `2 POL` from `goodnessonweb3`, then broadcast.
- Vault address: `0x706DB138a532b59Df3664f3e8aB86e36a744DD00`
- Transaction: `0x8a73e82ae788ff6ed82866ad5a2f9b343e1b81dca6c59a5fabac45753881eb16`
- Block: `92128710`
- Verified owner is the deployer, token is fxVERSE, vault is unpaused, `totalLiability` is 0.
- Wrote `VITE_TIP_VAULT_ADDRESS` into `apps/web/.env`. Left `VITE_DEPLOYMENT_BLOCK` at the earlier registry block `92127803` so discovery does not skip registry events.
- This is a single-operator vault. Ownership can later move to a Safe via Ownable2Step.

### Cloudflare Worker deploy

- Wrangler is authenticated as `amicablembakara50@gmail.com` on the Goodness Mbakara account.
- Deployed `versetip-api` to `https://versetip-api.goodness-mbakara.workers.dev`.
- Set Worker `TIP_VAULT_ADDRESS` to the live vault and allowed `http://localhost:5173` and `http://127.0.0.1:5173`.
- `/health` returns `ok: true` with `storage: unconfigured` and `relayer: unconfigured`.
- Pointed `VITE_STORAGE_API_URL` and `VITE_RELAYER_URL` at the workers.dev URL.
- Uploads stay synchronous: the browser needs the IPFS URI before it can register the slug onchain.
- Storacha key/proof and a dedicated relayer key are still missing. Profile publish will fail closed until those Worker secrets exist.

### Storacha login blocked

- Installed `@storacha/cli` under Node 22 (Node 26 cannot build `better-sqlite3`).
- `storacha login amicablembakara50@gmail.com` failed with `ENOTFOUND up.storacha.network`.
- Public DNS (`8.8.8.8`) returns NXDOMAIN for `up.storacha.network`. That is the default upload/access service URL hardcoded in `@storacha/client@2.1.4`.
- `docs.storacha.network` now redirects to Fil One, an S3-compatible product, not the UCAN upload API this Worker uses.
- Worker remains live. Storage stays `unconfigured` until a working Storacha endpoint exists or the upload backend is replaced.

### R2 content-addressed storage

- Replaced Storacha with Cloudflare R2 because `up.storacha.network` does not resolve.
- Created R2 bucket `versetip-metadata` and bound it as `METADATA_BUCKET`.
- Uploads now SHA-256 the file, store it under `cid/<cidv1-raw>`, and still return `ipfs://bafkrei…` so the already-deployed `MetadataURI` contract accepts the URI.
- The Worker serves `GET /ipfs/:cid` as the first metadata gateway.
- Removed `@storacha/client`. Uploads remain synchronous because the wallet needs the URI before the registry transaction.
- `/health` now reports `storage: ready`. Relayer remains unconfigured.

### Dedicated claim relayer

- Created Foundry account `versetip-relayer` at `0x4cecE710dD12753d588D7299eC339dF18953B5d6`.
- Password is in the login keychain as `versetip-foundry-relayer`. The private key was uploaded only as the Worker secret `RELAYER_PRIVATE_KEY` and was not written into the repo or any `VITE_` variable.
- Discarded an unused first key after a failed secret-put attempt; only the address above was funded.
- Sent `0.3 POL` from `goodnessonweb3` to the relayer for claim gas.
- `/health` now reports `relayer: ready`. The relayer can submit creator-signed claims; it cannot invent a claim or redirect payouts.

### Mainnet testing asset budget

- Recorded a market snapshot of approximately `$0.00001835` per VERSE and `$0.07208` per POL; these figures are planning references and must be refreshed immediately before acquiring or funding assets.
- Set `250,000 fxVERSE` as the basic smoke-test floor, `1,000,000 fxVERSE` as the recommended end-to-end product test balance, and `2,000,000 fxVERSE` as the repeated multi-wallet rehearsal tier.
- Recommended splitting the 1M-token balance across direct tips, vault deposit/claim paths, multi-supporter campaign cases, and failure/retry reserves instead of spending it in one large transaction.
- Kept Polygon gas separate from token value: hold roughly `3–5 POL` across the participating test wallets for repeated user-flow transactions, and refresh the Foundry deployment simulation before funding any contract deployment.
- Noted that Polygon fxVERSE liquidity is shallow enough that the team should acquire in modest increments and verify the quote and slippage before confirming a swap.

### README and operational docs synced to live state

- Rewrote `README.md` so it no longer claims the vault is undeployed or that uploads go through Storacha.
- Recorded live registry `0xFaaa9315Af9E0711Bc01Ecd717243117b816A268` (block `92127803`) and vault `0x706DB138a532b59Df3664f3e8aB86e36a744DD00` (block `92128710`).
- Documented Reown AppKit sign-in, the chip-hinged account panel, R2 CID storage, Worker `https://versetip-api.goodness-mbakara.workers.dev`, and relayer `0x4cecE710dD12753d588D7299eC339dF18953B5d6`.
- Stated plainly that the vault is EOA-owned and not independently audited.
- Refreshed `docs/HANDOFF.md` so the next session does not treat deployment, Storacha, or the account drawer as current blockers.
- Remaining product work is unchanged: Vite restart + mainnet smoke test, PolygonScan source verification, production origin, analytics domain, Safe ownership transfer, independent audit, first git commit.

### Security follow-up: move vault ownership to a Safe

- Live `TipVault` `0x706DB138a532b59Df3664f3e8aB86e36a744DD00` is still owned by the deployer EOA `0x8109Ed4dBd91371a6579A757deB5Fc51981d6D24`. That was an explicit skip-Safe deploy so the reference app could go live. It is not the production security target.
- Required upgrade, for security: create a reviewed Polygon Safe (2-of-3 or stronger, hardware-backed, separate signers), then transfer contract ownership with Ownable2Step:
  1. Current owner calls `transferOwnership(safe)`.
  2. The Safe calls `acceptOwnership()`.
  3. Confirm `owner()` is the Safe on PolygonScan before treating the vault as production-ready.
- Why: a single key can pause deposits and recover excess tokens. If that key is lost or compromised, admin of a fund-holding contract is a single point of failure. The owner still cannot seize creator liabilities.
- This is recorded in `docs/SECURITY.md`, README remaining work, and `docs/HANDOFF.md`. The Security page also surfaces the same upgrade path. Ownership has not been transferred yet.

### Cloudflare Pages frontend

- Created Pages project `versetip`. Production URL: `https://versetip.pages.dev`.
- Native Pages GitHub install failed with Cloudflare error `8000011` (Git installation). Deploy path is Direct Upload plus `.github/workflows/deploy-web.yml` on `main`.
- Set Pages production/preview env vars for Node 20, vault, registry, deployment block, Worker URLs, Reown project ID, and `VITE_ANALYTICS_DOMAIN=versetip.pages.dev`.
- Stored `CLOUDFLARE_API_TOKEN` as a GitHub Actions secret (local Wrangler OAuth token; replace with a dedicated API token if it expires).
- Built the Vite app with those values, uploaded to Pages, and confirmed `/` and `/security` return HTML. Vault and Worker URLs are present in the production bundle.
- Added `https://versetip.pages.dev` to Worker `ALLOWED_ORIGIN` and redeployed `versetip-api`. CORS preflight from that origin returns 204.
- SPA fallback is `apps/web/public/_redirects` (`/* /index.html 200`).
