import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Heart,
  Link2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOnchainCreator } from "../lib/onchainCreators";
import { useRecentSupport } from "../lib/onchainSupport";
import {
  compactNumber,
  relativeTime,
  shortAddress,
  shortHash,
} from "../lib/format";
import { TipComposer } from "../features/tipping/TipComposer";
import { EXPLORER_URL, TOKEN_SYMBOL } from "../lib/config";
import { formatUnits } from "viem";

export function CreatorPage() {
  const { slug } = useParams();
  const { creator, isLoading } = useOnchainCreator(slug);
  const support = useRecentSupport(
    creator && !creator.isDemo ? creator.address : undefined,
  );
  if (!creator && isLoading)
    return (
      <div className="route-loader">
        <span /> Loading onchain profile…
      </div>
    );
  if (!creator) return <Navigate to="/discover" replace />;
  const progress = Math.min((creator.raised / creator.goal) * 100, 100);

  return (
    <div className="creator-page section-shell">
      <section className="creator-main">
        <div
          className={`creator-banner ${creator.accent}${creator.image ? " has-photo" : ""}`}
        >
          {creator.image && (
            <img
              className="creator-banner-photo"
              src={creator.image}
              alt=""
            />
          )}
          <div className="banner-grid" />
          <span className={`avatar xl ${creator.accent}`}>
            {creator.image ? (
              <img src={creator.image} alt={creator.name} />
            ) : (
              creator.initials
            )}
          </span>
        </div>
        <div className="creator-header-copy">
          <div className="creator-title">
            <div>
              <div className="name-row">
                <h1>{creator.name}</h1>
                {creator.unregistered ? (
                  <span className="verified-badge demo-badge">
                    <Wallet size={15} />
                    Unregistered
                  </span>
                ) : creator.isDemo ? (
                  <span className="verified-badge demo-badge">
                    <Sparkles size={15} />
                    Demo profile
                  </span>
                ) : creator.verified ? (
                  <span className="verified-badge">
                    <ShieldCheck size={15} />
                    Verified
                  </span>
                ) : null}
              </div>
              <p>{creator.handle}</p>
            </div>
            <div className="creator-actions">
              <button
                aria-label="Copy creator link"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  toast.success("Creator link copied");
                }}
              >
                <Link2 size={17} />
              </button>
              <button
                aria-label="Copy payout address"
                onClick={() => {
                  void navigator.clipboard.writeText(creator.address);
                  toast.success("Wallet address copied");
                }}
              >
                <Copy size={17} />
              </button>
            </div>
          </div>
          <p className="creator-bio">{creator.bio}</p>
          <div className="creator-wallet">
            <span className="status-dot" />
            <code>{shortAddress(creator.address)}</code>
            {!creator.isDemo && (
              <a
                href={`https://polygonscan.com/address/${creator.address}`}
                target="_blank"
                rel="noreferrer"
                aria-label="View creator wallet on PolygonScan"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        {creator.unregistered ? (
        <article className="campaign-card">
          <div className="campaign-top">
            <div>
              <span className="eyebrow">Unregistered recipient</span>
              <h2>Tips are waiting at this wallet</h2>
            </div>
          </div>
          <p>
            Direct tips arrive immediately. Vault tips stay claimable until this
            person connects the same wallet in Studio. Publishing a profile is
            optional and does not move the funds.
          </p>
        </article>
        ) : (
        <article className="campaign-card">
          <div className="campaign-top">
            <div>
              <span className="eyebrow">{creator.isDemo ? "Campaign preview" : "Current campaign"}</span>
              <h2>{creator.campaign}</h2>
            </div>
            <span className="campaign-status">
              <span />
              {creator.isDemo ? "Demo" : "Funding"}
            </span>
          </div>
          <p>
            Help turn this idea into a finished, freely available resource for
            the Verse community.
          </p>
          <div className="campaign-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="campaign-numbers">
            <div>
              <strong>{compactNumber(creator.raised)} VERSE</strong>
              <span>raised of {compactNumber(creator.goal)}</span>
            </div>
            <div>
              <strong>{creator.supporters}</strong>
              <span>supporters</span>
            </div>
            <div>
              <strong>{progress.toFixed(0)}%</strong>
              <span>funded</span>
            </div>
          </div>
        </article>
        )}

        <section className="supporter-section">
          <div className="subsection-heading">
            <div>
              <Heart size={17} />
              <h2>Recent support</h2>
            </div>
            <span>
              {creator.isDemo ? "Illustrative profile" : "Public on Polygon"}
            </span>
          </div>
          <div className="activity-list">
            {creator.isDemo ? (
              <p className="activity-empty">
                Showcase profiles do not list live tips.
              </p>
            ) : support.isLoading ? (
              <p className="activity-empty">Loading onchain tips…</p>
            ) : support.data?.length ? (
              support.data.map((item) => (
                <article key={item.hash}>
                  <span className="supporter-avatar">
                    {item.from.slice(2, 4)}
                  </span>
                  <div>
                    <div>
                      <code>{shortAddress(item.from)}</code>
                      <span>{relativeTime(item.timestamp)}</span>
                    </div>
                    <p>
                      {item.rail === "vault" ? "Vault tip" : "Direct tip"}
                      {" · "}
                      <a
                        href={`${EXPLORER_URL}/tx/${item.hash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {shortHash(item.hash)}
                      </a>
                    </p>
                  </div>
                  <strong>
                    +{compactNumber(Number(formatUnits(item.amount, 18)))}{" "}
                    <small>{TOKEN_SYMBOL}</small>
                  </strong>
                  <CheckCircle2 size={16} />
                </article>
              ))
            ) : (
              <p className="activity-empty">No onchain tips yet.</p>
            )}
          </div>
          <Link to="/#how-onchain-tips-work" className="text-link">
            Learn how onchain tips work
          </Link>
        </section>
      </section>
      <div className="tip-column">
        <TipComposer creator={creator} />
      </div>
    </div>
  );
}
