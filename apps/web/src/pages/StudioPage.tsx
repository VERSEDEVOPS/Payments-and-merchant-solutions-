import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Copy,
  ExternalLink,
  LoaderCircle,
  Users,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  useAccount,
  useReadContract,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, isHex, type Hex } from "viem";
import { toast } from "sonner";
import {
  ACTIVE_CHAIN,
  EXPLORER_URL,
  RELAYER_URL,
  TIP_VAULT_ADDRESS,
  tipVaultAbi,
  TOKEN_SYMBOL,
} from "../lib/config";
import { compactNumber, readableError, shortAddress } from "../lib/format";
import { WalletButton } from "../components/WalletButton";
import { ProfileEditor } from "../features/profile/ProfileEditor";
import { CampaignEditor } from "../features/campaigns/CampaignEditor";
import { useOnchainStudio } from "../lib/onchainStudio";

export function StudioPage() {
  const [claimError, setClaimError] = useState("");
  const [relayHash, setRelayHash] = useState<Hex>();
  const [relayPending, setRelayPending] = useState(false);
  const confirmedClaimHash = useRef<`0x${string}` | undefined>(undefined);
  const { address, isConnected, chainId } = useAccount();
  const studio = useOnchainStudio(address);
  const hasVault =
    TIP_VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000";
  const { data: claimable, refetch: refetchClaimable } = useReadContract({
    address: TIP_VAULT_ADDRESS,
    abi: tipVaultAbi,
    functionName: "claimable",
    args: address ? [address] : undefined,
    query: { enabled: hasVault && Boolean(address) },
  });
  const { data: claimNonce } = useReadContract({
    address: TIP_VAULT_ADDRESS,
    abi: tipVaultAbi,
    functionName: "claimNonces",
    args: address ? [address] : undefined,
    query: { enabled: hasVault && Boolean(address) },
  });
  const { signTypedDataAsync } = useSignTypedData();
  const {
    data: claimHash,
    writeContract: writeClaim,
    isPending: claimPending,
    error: claimWriteError,
  } = useWriteContract();
  const claimReceipt = useWaitForTransactionReceipt({ hash: claimHash });
  const relayReceipt = useWaitForTransactionReceipt({ hash: relayHash });
  const wrongChain = isConnected && chainId !== ACTIVE_CHAIN.id;

  useEffect(() => {
    if (
      !claimReceipt.isSuccess ||
      !claimHash ||
      confirmedClaimHash.current === claimHash
    )
      return;
    confirmedClaimHash.current = claimHash;
    setClaimError("");
    void refetchClaimable();
    toast.success("Claim confirmed", {
      description: `Your ${TOKEN_SYMBOL} has been sent to your wallet.`,
      action: {
        label: "View",
        onClick: () =>
          window.open(`${EXPLORER_URL}/tx/${claimHash}`, "_blank", "noopener"),
      },
    });
  }, [claimHash, claimReceipt.isSuccess, refetchClaimable]);

  useEffect(() => {
    if (
      !relayReceipt.isSuccess ||
      !relayHash ||
      confirmedClaimHash.current === relayHash
    )
      return;
    confirmedClaimHash.current = relayHash;
    setClaimError("");
    void refetchClaimable();
    toast.success("Sponsored claim confirmed", {
      description: `Your ${TOKEN_SYMBOL} arrived without spending POL.`,
      action: {
        label: "View",
        onClick: () =>
          window.open(`${EXPLORER_URL}/tx/${relayHash}`, "_blank", "noopener"),
      },
    });
  }, [refetchClaimable, relayHash, relayReceipt.isSuccess]);

  function claimAll() {
    setClaimError("");
    if (!hasVault || !claimable || claimable <= 0n || wrongChain) return;
    writeClaim({
      address: TIP_VAULT_ADDRESS,
      abi: tipVaultAbi,
      functionName: "claim",
      args: [claimable],
    });
  }

  async function claimWithoutGas() {
    setClaimError("");
    if (
      !RELAYER_URL ||
      !address ||
      !hasVault ||
      !claimable ||
      claimable <= 0n ||
      claimNonce === undefined ||
      wrongChain
    )
      return;

    setRelayPending(true);
    try {
      const deadline = Math.floor(Date.now() / 1_000) + 10 * 60;
      const signature = await signTypedDataAsync({
        account: address,
        domain: {
          name: "VerseTip Vault",
          version: "1",
          chainId: ACTIVE_CHAIN.id,
          verifyingContract: TIP_VAULT_ADDRESS,
        },
        types: {
          Claim: [
            { name: "creator", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        primaryType: "Claim",
        message: {
          creator: address,
          to: address,
          amount: claimable,
          nonce: claimNonce,
          deadline: BigInt(deadline),
        },
      });
      const response = await fetch(`${RELAYER_URL}/v1/claims/relay`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          creator: address,
          to: address,
          amount: claimable.toString(),
          deadline,
          signature,
        }),
      });
      const result = (await response.json()) as {
        transactionHash?: string;
        error?: string;
      };
      if (
        !response.ok ||
        !result.transactionHash ||
        !isHex(result.transactionHash) ||
        result.transactionHash.length !== 66
      ) {
        throw new Error(
          result.error || "The sponsored claim was not accepted.",
        );
      }
      setRelayHash(result.transactionHash);
    } catch (cause) {
      setClaimError(
        cause instanceof Error
          ? cause.message
          : "The sponsored claim could not be submitted.",
      );
    } finally {
      setRelayPending(false);
    }
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Payout wallet copied");
    } catch {
      toast.error("Could not copy the wallet address");
    }
  }

  if (!isConnected)
    return (
      <div className="studio-gate section-shell">
        <div className="dialog-icon">
          <BarChart3 size={22} />
        </div>
        <h1>Your creator studio</h1>
        <p>
          Sign in with the wallet that owns your creator profile to view earnings,
          campaigns, and claims.
        </p>
        <WalletButton />
      </div>
    );
  const claimableVerse = claimable ? Number(formatUnits(claimable, 18)) : 0;
  const vaultSupport = studio.data
    ? Number(formatUnits(studio.data.vaultSupport, 18))
    : 0;
  const campaignChartData = [...(studio.data?.campaigns ?? [])]
    .reverse()
    .map((campaign) => ({
      d: campaign.title.length > 14 ? `${campaign.title.slice(0, 12)}…` : campaign.title,
      v: Number(formatUnits(campaign.raised, 18)),
    }));
  const displayedClaimError =
    claimError ||
    (claimWriteError ? readableError(claimWriteError) : "") ||
    (claimReceipt.error ? readableError(claimReceipt.error) : "") ||
    (relayReceipt.error ? readableError(relayReceipt.error) : "");
  return (
    <div className="section-shell studio-page page-stack">
      <div className="studio-header">
        <div>
          <span className="eyebrow">Creator studio</span>
          <h1>Good morning, creator.</h1>
          <p>Track support, manage campaigns, and claim your VERSE.</p>
        </div>
        <div className="studio-actions">
          <ProfileEditor />
          <CampaignEditor />
        </div>
      </div>
      <div className="studio-grid">
        <section className="balance-panel">
          <div>
            <span className="eyebrow">Available to claim</span>
            <h2>
              {compactNumber(claimableVerse)} <small>{TOKEN_SYMBOL}</small>
            </h2>
            <p>
              {hasVault
                ? "Vault tips wait here until you claim, including tips sent before you published a profile. Direct tips already went to your wallet."
                : "Vault address will appear after deployment."}
            </p>
          </div>
          <div className="balance-action">
            <button
              className="button light"
              disabled={
                !hasVault ||
                !claimable ||
                claimable <= 0n ||
                wrongChain ||
                claimPending ||
                claimReceipt.isLoading ||
                relayPending ||
                relayReceipt.isLoading
              }
              onClick={claimAll}
            >
              {claimPending || claimReceipt.isLoading ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <ArrowDownToLine size={16} />
              )}
              {claimPending
                ? "Confirm in wallet"
                : claimReceipt.isLoading
                  ? "Confirming onchain"
                  : "Claim — you pay gas"}
            </button>
            {RELAYER_URL && (
              <button
                className="button secondary sponsored-claim"
                disabled={
                  !hasVault ||
                  !claimable ||
                  claimable <= 0n ||
                  claimNonce === undefined ||
                  wrongChain ||
                  relayPending ||
                  relayReceipt.isLoading ||
                  claimPending ||
                  claimReceipt.isLoading
                }
                onClick={claimWithoutGas}
              >
                {relayPending || relayReceipt.isLoading ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <ArrowDownToLine size={16} />
                )}
                {relayPending
                  ? "Sign claim"
                  : relayReceipt.isLoading
                    ? "VerseTip submitting"
                    : "Claim — we pay gas"}
              </button>
            )}
            {RELAYER_URL && (
              <p className="balance-note">
                Both send the same fxVERSE to you. The first uses your POL. The
                second only needs a signature.
              </p>
            )}
            {wrongChain && (
              <p className="balance-note">
                Switch your wallet to Polygon mainnet.
              </p>
            )}
            {displayedClaimError && (
              <p className="balance-note error" role="alert">
                {displayedClaimError}
              </p>
            )}
          </div>
        </section>
        <article className="metric-card">
          <span>
            <ArrowUpRight size={17} />
          </span>
          <small>Vault support</small>
          <strong>{studio.isPending ? "—" : compactNumber(vaultSupport)}</strong>
          <p>{TOKEN_SYMBOL} deposited across direct vault tips and campaigns</p>
        </article>
        <article className="metric-card">
          <span>
            <Users size={17} />
          </span>
          <small>Unique vault supporters</small>
          <strong>{studio.isPending ? "—" : (studio.data?.supporters ?? 0)}</strong>
          <p>Derived from public TipVault events</p>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Campaign support</h2>
              <p>Confirmed vault deposits by campaign</p>
            </div>
          </div>
          {campaignChartData.length ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={campaignChartData}>
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--accent-blue)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent-blue)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="d"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--accent-blue)"
                  strokeWidth={2}
                  fill="url(#chartFill)"
                />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="studio-empty">
              Campaign activity will appear here after the first onchain deposit.
            </div>
          )}
        </section>
        <section className="campaign-list-panel">
          <div className="panel-heading">
            <div>
              <h2>Campaigns</h2>
              <p>{studio.data?.campaigns.length ?? 0} onchain campaigns</p>
            </div>
          </div>
          {studio.data?.campaigns.length ? (
            studio.data.campaigns.slice(0, 4).map((campaign) => (
              <article key={campaign.id}>
                <div className="campaign-symbol">{campaign.title.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{campaign.title}</strong>
                  <span>
                    {compactNumber(Number(formatUnits(campaign.raised, 18)))} {TOKEN_SYMBOL} · {campaign.supporters} supporters · {campaign.active ? "active" : "paused"}
                  </span>
                </div>
                <a
                  aria-label="View campaign creation on PolygonScan"
                  href={`${EXPLORER_URL}/address/${TIP_VAULT_ADDRESS}#events`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} />
                </a>
              </article>
            ))
          ) : (
            <div className="studio-empty compact">
              No campaign has been created by this wallet yet.
            </div>
          )}
          <div className="campaign-wallet">
            <span>Payout wallet</span>
            <code>{shortAddress(address)}</code>
            <button aria-label="Copy payout wallet" onClick={copyAddress}>
              <Copy size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
