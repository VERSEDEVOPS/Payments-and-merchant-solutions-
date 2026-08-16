# Welcome to the VERSE Ecosystem
### A new member's catch-up guide to Bitcoin.com's rewards and utility token

*Last updated: 2026-06-06*

---

## Read this first

Welcome aboard. This is your one-sitting briefing. By the end you will know what VERSE is, what it powers, why the design is genuinely clever, and how to start building in the ecosystem if that is your thing.

If you remember one sentence: **VERSE is the rewards and utility token that ties together Bitcoin.com's products, backed by one of the most recognised brands and largest user funnels in crypto.**

---

## 1. What VERSE is

VERSE is the rewards and utility token of Bitcoin.com, the company that owns the bitcoin.com domain and has been welcoming newcomers into crypto since 2015.

It is an ERC-20 token, cross-chain and EVM compatible, living on Ethereum and SmartBCH. Think of it as loyalty and utility rolled into one tradeable asset. You earn it by using Bitcoin.com products, you hold it for perks and discounts, you spend it across the apps, and you can stake it for rewards.

The mission is simple and likeable: accelerate adoption of self-custodial crypto through incentives and gamification, rewarding people for buying, selling, storing, using, and learning about cryptocurrency. It is built with newcomers in mind, which is rare and valuable in a space that usually assumes you already speak the language.

---

## 2. The brand and the reach

This is the strongest card in the deck, so it goes near the top.

- Bitcoin.com owns one of the most valuable and trusted domains in the entire industry.
- It has created tens of millions of self-custody wallets through its app, with figures quoted between 40 and 50 million.
- Its news portal pulls over 2.5 million monthly readers.
- It offers 24-hour human support and a deep library of education resources.

For a token, distribution is everything, and VERSE is plugged straight into one of the widest on-ramps in crypto. Most tokens fight for an audience. This one was born next to a very large one.

---

## 3. The ecosystem map

Here is the world you are joining, and it keeps growing.

**Bitcoin.com Wallet**
A multichain self-custodial wallet at the heart of everything. You buy, sell, trade, earn, and use crypto, and you alone hold the keys. Secure, simple, and built for people who are new to this.

**Verse DEX**
A full-featured decentralised exchange where you swap cryptocurrencies instantly, provide liquidity to pools to earn fees, and farm for higher rewards. Permissionless and non-custodial, open to anyone with a web3 wallet.

**Verse Staking**
Stake VERSE to earn rewards. A newer programme even lets you stake VERSE to earn BTC, which is a genuinely attractive twist, turning your utility token into a way to accumulate Bitcoin.

**Verse Farms**
Deposit liquidity-provider tokens into farm contracts to earn rewards on top of the trading fees you already collect. Funded from the ecosystem incentives pool.

**Bitcoin.com News**
The 2.5-million-reader portal, where advertisers can buy placements with VERSE, giving the token a real-world demand sink.

**Bitcoin.com Card**
A crypto-backed debit card that pays cashback in VERSE and offers discounts when you pay in the token. Everyday spending that quietly earns.

**NFTs, dApps and more**
- Verse Voyager: a 10,000-piece NFT collection launched 2024-04 with collaborators from the Cool Cats and Genzee collections, unlocking holder benefits.
- Verse Scratcher: a provably fair scratch-and-win dApp on Polygon, using Chainlink VRF for fair randomness.
- Verse Explorer: a built-in web3 browser for interacting with dApps.
- Verse Portal: send tokens through it to uncover rewards.
- A growing set of AI-powered tools is being added to the ecosystem.

**Verse Lounge**
A space for committed holders to talk directly with builders, vote on proposals, and get early access. This is where the community shapes direction.

The loop in one line: **earn it by using the products, hold it for perks, spend it in the apps, stake it for yield, and even earn BTC along the way.**

---

## 4. Why the token design is smart

The tokenomics are thoughtfully engineered, and this is worth appreciating.

**Fixed supply**
A hard cap of 210 billion VERSE, a deliberate nod to Bitcoin's 21 million, scaled up. No infinite printing.

**Generous community allocation**
The lion's share of supply, around 69%, is reserved for community and ecosystem development, with 35% specifically allocated to rewards distributed through farming, staking, airdrops, and similar programmes. The token is built to be given back to the people who use it.

**Aligned team incentives**
The core team's allocation vests over four years, longer than the schedules for sale participants. That is the right way round and signals long-term commitment.

**The Verse Burn Engine**
This is the elegant part. Bitcoin.com buys VERSE on the open market and routes it to a Burn Engine, where it accumulates until a burn is triggered, and anyone can trigger it. The amount flowing in scales with activity across the ecosystem, so the more the ecosystem is used, the more supply is removed. Deflation tied to real usage rather than empty promises.

**Community-driven scarcity**
In 2025-10, the community approved the Verse Mega Burn Initiative, an 86 billion token burn cutting total supply by roughly 38 to 42%. A decisive, community-backed move to tighten supply and reward conviction.

---

## 5. A quick, honest note

Keeping this short, as promised. VERSE is a small-cap token currently trading well below its past highs, with modest daily liquidity. Treat it as a high-risk, early-stage asset, do your own research, and only ever commit what you are fully prepared to lose. Nothing here is financial advice. That is the whole caveat, said plainly, so you can move on with eyes open.

---

## 6. Build in the ecosystem

This is the section for the engineers, and there is real good news here.

Because VERSE and the Verse DEX run on Ethereum and SmartBCH, and the token is a standard ERC-20, **you do not need a proprietary, walled-garden SDK to build.** You build with the entire mature EVM toolchain you already know. No new language, no lock-in, familiar rails. For an experienced developer that is the dream starting position.

Here are the concrete pathways.

**1. List a token or pool, permissionlessly, through Git**
The cleanest builder on-ramp is the open-source token registry repo, `bitcoin-portal/verse-dex-tokens` on GitHub. To list an ERC-20 or SEP-20 token and its liquidity pairs on the Verse DEX, you simply:
- Open a pull request adding your token config to `tokens.json`, including the symbol, contract address, decimals, and the trading pairs you want.
- Add a 64 by 64 pixel png icon to the `icons` directory.
- Provide a wallet that will seed the initial liquidity.
The team reviews and merges. Permissionless listing by pull request is something most exchanges make painful, and here it is an afternoon's work.

**2. Integrate the DEX directly**
Verse DEX is an automated market maker in the Uniswap lineage, with router, factory, and pair contracts plus LP tokens. You integrate it exactly as you would any Uniswap-style exchange, calling the router for swaps and liquidity through ethers.js or web3.js, signing with WalletConnect or the Bitcoin.com Wallet. Everything you already know transfers across.

**3. Compose on farms and staking contracts**
Verse Farms and Verse Staking are on-chain smart contracts you can read, compose with, and build interfaces or strategies around. Want to build a yield dashboard, an auto-compounder, or a portfolio tracker that surfaces VERSE rewards and the stake-to-earn-BTC programme? The contracts are right there.

**4. Plug into data and infrastructure**
- RPC and node access through standard providers such as Alchemy and Infura, since it is plain EVM.
- Verse DEX market data is on TradingView, searchable with the VERSEETH prefix, for charting and analysis.
- DappRadar tracks the DEX for total value locked and on-chain analytics.
- Verse is listed in the Alchemy dapp store, making discovery easier.

**5. The real prize: distribution**
This is why you would build here rather than on a larger, more crowded DEX. You get a path to Bitcoin.com's tens of millions of wallets, its 2.5-million-reader news portal, and a token whose entire purpose is rewarding user actions. For a consumer-facing dApp aimed at newcomers, that built-in funnel is worth more than another listing on a saturated exchange.

**Honest builder note, kept short**
There is no single large, formal "Verse SDK" with the polish of a major layer-1 developer kit. You build with general-purpose EVM tooling against well-understood AMM contracts, plus the open listing repo. For a seasoned engineer, that is a feature, not a limitation.

---

## 7. Glossary for newcomers

- **ERC-20**: the standard token format on Ethereum, making VERSE compatible with most wallets and tools.
- **Self-custodial**: you control your own keys, so you alone control your funds.
- **DEX**: a decentralised exchange where trades happen through smart contracts, not a custodian.
- **AMM**: automated market maker, the model where liquidity pools and a pricing formula replace a traditional order book.
- **Liquidity pool**: a shared pot of two tokens that enables swaps. Add to it and earn a share of fees.
- **LP tokens**: receipts you get for providing liquidity, which you can stake in farms.
- **Staking**: locking tokens to earn rewards.
- **Farming**: depositing LP tokens or staking in programmes for higher rewards.
- **Burn**: permanently removing tokens from circulation to reduce supply.
- **Router and factory contracts**: the core AMM contracts that create pools and execute swaps.

---

## 8. Your first week checklist

**As a community member**
1. Download the Bitcoin.com Wallet and secure your recovery phrase offline. Do this first.
2. Read the official VERSE white paper and security audits, linked from the Verse site.
3. Try one small swap on the Verse DEX to learn the mechanics.
4. Explore one earning feature, staking or a pool, after reading its terms.
5. Join the community and read recent governance proposals.

**As a builder**
1. Clone and read the `bitcoin-portal/verse-dex-tokens` repo to understand the listing flow.
2. Point your usual EVM stack, ethers.js or web3.js, at an Ethereum RPC provider.
3. Read the Verse DEX router, factory, farm, and staking contracts on a block explorer.
4. Prototype a small read-only integration first, such as fetching a pool price or staking rewards.
5. When ready, open a pull request to list a token or pair, and bring liquidity.

---

Welcome aboard. Read widely, ask questions in the community, build boldly, and trust mechanisms over marketing.
