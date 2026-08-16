# VerseTip operations

## Storage service

Monitor request count, 4xx/5xx rates, upload latency, Storacha errors, and account quota. A spike in signature failures may indicate a frontend version mismatch or abuse. Rotate a Storacha delegation by creating the replacement, deploying the Worker secret, testing an upload, and only then revoking the old delegation.

If Storacha is unavailable, profile and campaign publishing should fail closed with a clear message. Existing CIDs and all onchain claims continue to work. Do not substitute mutable HTTP URLs onchain during an outage.

## Claim relayer

Monitor relayer POL, pending nonce, simulation failures, submission failures, rate-limit activity, and receipt status. Refill only to the documented operating ceiling.

If the key may be compromised:

1. Remove or replace `RELAYER_PRIVATE_KEY` immediately.
2. Disable the sponsored-claim endpoint at the edge if rotation is not immediate.
3. Inspect pending/recent transactions.
4. Fund a new dedicated wallet minimally and update the Worker secret.
5. Resume after a successful simulated and minimal-value claim.

A compromised relayer cannot forge creator signatures or withdraw to itself under the API policy. It can waste its own POL and submit already valid signed claims, so deadlines stay short.

## Vault incident response

Pause when deposits could increase exposure: unexpected token behavior, accounting mismatch, active frontend recipient manipulation, or a credible contract vulnerability. Claims intentionally remain live.

After pausing:

- Record the block and transaction.
- Compare vault fxVERSE balance with `totalLiability`.
- Reproduce on a Polygon fork.
- Notify creators with factual scope and claim guidance.
- Do not unpause until root cause, remediation, simulation, and multisig review are complete.

Direct tips are ordinary ERC-20 transfers and cannot be paused by VerseTip.

## Excess recovery

`recoverExcess` is only for fxVERSE transferred directly to the vault without a deposit call. Before a multisig proposal, independently verify:

```text
recoverable = fxVERSE.balanceOf(vault) - totalLiability
```

The proposed amount must not exceed that value. Record the calculation block, destination rationale, simulation, approvals, transaction, and post-transaction solvency check.

## Frontend rollback

If a vault issue is isolated, set `VITE_TIP_VAULT_ADDRESS` to the zero address and redeploy the frontend. Direct tips and discovery can remain available while the vault UI reports that claimable tipping is unavailable. Never silently point an existing release to a different unverified contract.

