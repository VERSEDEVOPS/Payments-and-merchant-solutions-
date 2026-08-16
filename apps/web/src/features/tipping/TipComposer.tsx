import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Fuel,
  Info,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  encodePacked,
  formatEther,
  formatUnits,
  keccak256,
  parseUnits,
  zeroHash,
} from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { VerseTokenMark } from "../../components/VerseTokenMark";
import type { Creator } from "../../lib/data";
import {
  ACTIVE_CHAIN,
  erc20Abi,
  EXPLORER_URL,
  NETWORK_NAME,
  TIP_VAULT_ADDRESS,
  tipVaultAbi,
  TOKEN_SYMBOL,
  VERSE_ADDRESS,
} from "../../lib/config";
import { compactNumber, readableError, shortAddress } from "../../lib/format";
import { track } from "../../lib/analytics";
import { WalletButton } from "../../components/WalletButton";

const presets = [5_000, 10_000, 25_000, 50_000];

export function TipComposer({ creator }: { creator: Creator }) {
  const [amount, setAmount] = useState("10000");
  const [message, setMessage] = useState("");
  const [rail, setRail] = useState<"direct" | "vault">("direct");
  const [error, setError] = useState("");
  const { address, isConnected, chainId } = useAccount();
  const { data: polBalance } = useBalance({ address });
  const { data: verseBalance } = useReadContract({
    address: VERSE_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();
  const {
    data: approvalHash,
    writeContract: approve,
    isPending: approvalPending,
    error: approvalError,
  } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const approvalReceipt = useWaitForTransactionReceipt({ hash: approvalHash });
  const parsedAmount = parseTipAmount(amount);
  const hasVault =
    TIP_VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000";
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: VERSE_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && hasVault ? [address, TIP_VAULT_ADDRESS] : undefined,
    query: { enabled: Boolean(address && hasVault && rail === "vault") },
  });
  const enoughVerse =
    verseBalance === undefined || verseBalance >= parsedAmount;
  const wrongChain = isConnected && chainId !== ACTIVE_CHAIN.id;
  const needsApproval =
    rail === "vault" && hasVault && (allowance ?? 0n) < parsedAmount;
  const displayedError =
    error ||
    (writeError ? readableError(writeError) : "") ||
    (approvalError ? readableError(approvalError) : "");

  useEffect(() => {
    if (approvalReceipt.isSuccess) void refetchAllowance();
  }, [approvalReceipt.isSuccess, refetchAllowance]);

  useEffect(() => {
    if (receipt.isSuccess) {
      track("tip_confirmed", {
        rail,
        creator: creator.slug,
        amount: Number(amount),
      });
    }
  }, [receipt.isSuccess, rail, creator.slug, amount]);

  function submitTip() {
    setError("");
    if (creator.isDemo) {
      setError("This is a showcase profile. Mainnet tipping is intentionally disabled.");
      return;
    }
    if (!address || parsedAmount <= 0n || wrongChain || !enoughVerse) return;
    track("tip_submitted", {
      rail,
      creator: creator.slug,
      amount: Number(amount),
    });
    if (rail === "direct") {
      writeContract({
        address: VERSE_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [creator.address, parsedAmount],
      });
      return;
    }
    if (!hasVault) {
      setError(
        "The audited vault address has not been configured yet. Use Direct tip for now.",
      );
      return;
    }
    const messageHash = message.trim()
      ? keccak256(encodePacked(["string"], [message.trim()]))
      : zeroHash;
    writeContract({
      address: TIP_VAULT_ADDRESS,
      abi: tipVaultAbi,
      functionName: "tip",
      args: [creator.address, parsedAmount, messageHash],
    });
  }

  function approveVault() {
    setError("");
    if (
      creator.isDemo ||
      !address ||
      !hasVault ||
      parsedAmount <= 0n ||
      wrongChain ||
      !enoughVerse
    )
      return;
    approve({
      address: VERSE_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [TIP_VAULT_ADDRESS, parsedAmount],
    });
  }

  if (receipt.isSuccess && hash) {
    return (
      <aside className="tip-card success-card" aria-live="polite">
        <div className="success-orbit">
          <Check size={27} />
        </div>
        <span className="eyebrow">Tip confirmed</span>
        <h2>{compactNumber(Number(amount))} VERSE sent</h2>
        <p>
          Your support for {creator.name} is now recorded on {NETWORK_NAME}.
        </p>
        <div className="receipt-row">
          <span>Recipient</span>
          <code>{shortAddress(creator.address)}</code>
        </div>
        <div className="receipt-row">
          <span>Settlement</span>
          <strong>{rail === "direct" ? "Direct" : "Creator vault"}</strong>
        </div>
        <a
          className="button primary full"
          href={`${EXPLORER_URL}/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
        >
          View on PolygonScan <ExternalLink size={15} />
        </a>
        <button
          className="button ghost full"
          onClick={() => {
            reset();
            setMessage("");
          }}
        >
          Send another tip
        </button>
      </aside>
    );
  }

  return (
    <aside className="tip-card">
      <div className="tip-card-heading">
        <div>
          <span className="eyebrow">Support this work</span>
          <h2>Send a tip</h2>
        </div>
        <div className="token-pill">
          <VerseTokenMark size={21} decorative />
          VERSE
        </div>
      </div>
      <div className="rail-switch" role="tablist" aria-label="Settlement type">
        <button
          className={rail === "direct" ? "active" : ""}
          onClick={() => setRail("direct")}
          role="tab"
        >
          Direct
        </button>
        <button
          className={rail === "vault" ? "active" : ""}
          onClick={() => setRail("vault")}
          role="tab"
        >
          Vault
        </button>
      </div>
      <p className="rail-description">
        {rail === "direct"
          ? "One transaction, delivered immediately to this wallet."
          : creator.unregistered
            ? "Held for this address. They can claim in Studio after connecting — no profile required."
            : "Add a message and let the creator claim tips together."}
      </p>
      <label className="field-label" htmlFor="tip-amount">
        Amount
      </label>
      <div className="amount-input">
        <input
          id="tip-amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value.replace(/[^0-9.]/g, ""))
          }
          aria-describedby="amount-unit"
        />
        <span id="amount-unit">VERSE</span>
      </div>
      <div className="preset-grid">
        {presets.map((preset) => (
          <button
            key={preset}
            className={Number(amount) === preset ? "active" : ""}
            onClick={() => setAmount(String(preset))}
          >
            {compactNumber(preset)}
          </button>
        ))}
      </div>
      {rail === "vault" && (
        <div className="message-field">
          <label className="field-label" htmlFor="tip-message">
            Message <span>optional · stored as a hash</span>
          </label>
          <textarea
            id="tip-message"
            maxLength={180}
            placeholder="Say something kind…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <span className="character-count">{message.length}/180</span>
        </div>
      )}
      {isConnected && (
        <div className="balance-strip">
          <div>
            <Wallet size={14} />
            <span>
              {verseBalance === undefined
                ? "—"
                : compactNumber(Number(formatUnits(verseBalance, 18)))}{" "}
              {TOKEN_SYMBOL}
            </span>
          </div>
          <div>
            <Fuel size={14} />
            <span>
              {polBalance
                ? Number(formatEther(polBalance.value)).toFixed(4)
                : "—"}{" "}
              POL
            </span>
          </div>
        </div>
      )}
      {wrongChain && (
        <div className="inline-alert warning">
          <Info size={16} />
          Switch your wallet to {NETWORK_NAME}.
        </div>
      )}
      {creator.isDemo && (
        <div className="inline-alert warning" role="status">
          <Info size={16} />
          Showcase profile only. No transaction will be offered for this recipient.
        </div>
      )}
      {!enoughVerse && (
        <div className="inline-alert warning">
          <Info size={16} />
          You need more VERSE for this amount.{" "}
          <a href="https://verse.bitcoin.com" target="_blank" rel="noreferrer">
            Get VERSE
          </a>
        </div>
      )}
      {displayedError && (
        <div className="inline-alert error" role="alert">
          <Info size={16} />
          {displayedError}
        </div>
      )}
      {creator.isDemo ? (
        <button className="button primary full tip-submit" disabled>
          Demo tipping disabled
        </button>
      ) : !isConnected ? (
        <WalletButton />
      ) : needsApproval ? (
        <button
          className="button primary full tip-submit"
          disabled={
            approvalPending ||
            approvalReceipt.isLoading ||
            wrongChain ||
            !enoughVerse ||
            parsedAmount <= 0n
          }
          onClick={approveVault}
        >
          {approvalPending || approvalReceipt.isLoading ? (
            <>
              <LoaderCircle className="spin" size={17} />
              {approvalPending ? "Approve in wallet" : "Confirming approval"}
            </>
          ) : (
            <>
              Approve {amount ? compactNumber(Number(amount)) : "0"}{" "}
              {TOKEN_SYMBOL} <ArrowRight size={16} />
            </>
          )}
        </button>
      ) : (
        <button
          className="button primary full tip-submit"
          disabled={
            isPending ||
            receipt.isLoading ||
            wrongChain ||
            !enoughVerse ||
            parsedAmount <= 0n
          }
          onClick={submitTip}
        >
          {isPending || receipt.isLoading ? (
            <>
              <LoaderCircle className="spin" size={17} />
              {isPending ? "Confirm in wallet" : "Confirming onchain"}
            </>
          ) : (
            <>
              Tip {amount ? compactNumber(Number(amount)) : "0"} VERSE{" "}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      )}
      <div className="trust-row">
        <LockKeyhole size={14} />
        <span>Non-custodial</span>
        <span className="separator" /> <Sparkles size={14} />
        <span>Powered by Verse</span>
      </div>
    </aside>
  );
}

function parseTipAmount(value: string) {
  try {
    return parseUnits(value || "0", 18);
  } catch {
    return 0n;
  }
}
