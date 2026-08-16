# VerseTip network support

## Production network

VerseTip targets **Polygon mainnet only** (chain ID `137`). The supported token is the Polygon bridge representation of VERSE:

- Contract: `0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc`
- Onchain name: `Verse (FXERC20)`
- Symbol: `fxVERSE`
- Decimals: `18`
- Explorer: https://polygonscan.com/token/0xc708d6f2153933daa50b2d0758955be0a93a8fec
- Native gas token: `POL`

## No official testnet

There is currently **no official Verse testnet token**. The Verse Buildathon organizer explicitly instructed builders to build on Polygon mainnet directly. Do not spend time searching for or publishing an unofficial testnet address as if it were supported.

## Required validation strategy

The Verse product team has explained that Polygon testnet and Polygon mainnet are not operationally one-to-one for Verse integrations. Their recommendation is to validate the production integration on Polygon mainnet, where fees are low, rather than publish a testnet path that may fail when moved to production.

VerseTip therefore uses three validation layers:

1. Local Foundry unit, fuzz, invariant, and integration tests using `MockVerse` strictly as an in-memory fixture.
2. Polygon-mainnet fork tests against the real fxVERSE bytecode and live contract behavior, without broadcasting transactions.
3. Post-audit Polygon-mainnet smoke tests with a dedicated wallet and the smallest practical real amounts.

There is no Amoy deployment script, public mock-token address, or testnet configuration in the production frontend. This is deliberate so other developers do not waste time treating an unofficial mock as a supported Verse environment.

Before broadcasting any mainnet deployment, require an independent audit, remediation sign-off, multisig ownership, bytecode verification, transaction simulation, and a documented rollback/incident plan.
