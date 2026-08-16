import { useEffect } from "react";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  CircleDollarSign,
  Landmark,
  Layers3,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useCreatorCatalog } from "../lib/onchainCreators";
import { compactNumber } from "../lib/format";
import { VerseTokenMark } from "../components/VerseTokenMark";

export function HomePage() {
  const { hash } = useLocation();
  const { creators, isFallback } = useCreatorCatalog();
  const spotlight = creators[0];

  useEffect(() => {
    if (hash !== "#how-onchain-tips-work") return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById("how-onchain-tips-work")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  return (
    <div className="home-page">
      <section className="hero section-shell">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1>
            Support the work
            <br />
            that <em>moves you.</em>
          </h1>
          <p>
            Send VERSE directly to creators, fund meaningful campaigns, and keep
            every contribution transparent and onchain.
          </p>
          <div className="hero-actions">
            <Link className="button primary large" to={`/${spotlight.slug}`}>
              Send your first tip <ArrowRight size={17} />
            </Link>
            <Link className="button secondary large" to="/studio">
              Start creating
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <CheckCircle2 size={15} />
              Non-custodial
            </span>
            <span>
              <CheckCircle2 size={15} />
              Polygon mainnet
            </span>
            <span>
              <CheckCircle2 size={15} />
              Built with fxVERSE
            </span>
          </div>
        </motion.div>
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <div className="hero-atmosphere" aria-hidden="true">
            <span className="hero-nebula" />
            <i />
            <i />
            <i />
          </div>
          <div
            className="hero-payment-scene"
            aria-label="An fxVERSE tip moving from a supporter to a creator and settling on Polygon"
          >
            <div className="scene-status">
              <span className="scene-live">
                <i /> Product flow
              </span>
              <span className="scene-network">
                Polygon mainnet <CheckCircle2 size={13} />
              </span>
            </div>

            <div className="scene-flow">
              <div className="scene-node scene-supporter">
                <span className="scene-node-icon">
                  <WalletCards size={20} />
                </span>
                <div className="scene-node-copy">
                  <small>Supporter</small>
                  <strong>0x34…a2Bd</strong>
                </div>
                <div className="scene-amount">
                  <strong>25K</strong>
                  <small>fxVERSE</small>
                </div>
              </div>

              <div className="scene-route" aria-label="Direct or vault settlement">
                <div className="scene-route-line">
                  <span className="scene-route-start" />
                  <span className="scene-token">
                    <VerseTokenMark size={28} decorative />
                  </span>
                  <ArrowRight size={15} />
                </div>
                <div className="scene-route-options">
                  <span className="active">
                    <ArrowRight size={12} /> Direct
                  </span>
                  <span>
                    <Landmark size={12} /> Vault
                  </span>
                </div>
              </div>

              <div className="scene-node scene-creator">
                <div className="scene-creator-heading">
                  <span className={`avatar ${spotlight.accent}`}>
                    {spotlight.initials}
                  </span>
                  <CheckCircle2 size={17} />
                </div>
                <div className="scene-node-copy">
                  <small>Creator</small>
                  <strong>{spotlight.name}</strong>
                  <span>{spotlight.campaign}</span>
                </div>
                <div className="scene-delivery">
                  <i /> Delivered
                </div>
              </div>
            </div>

            <div className="scene-receipt">
              <span className="scene-receipt-icon">
                <Blocks size={19} />
              </span>
              <div>
                <small>Polygon receipt</small>
                <strong>{isFallback ? "Illustrative transaction" : "Tip confirmed"}</strong>
              </div>
              <code>0x8f…91c</code>
            </div>

            <div className="scene-caption">
              <span>One approval</span>
              <i />
              <span>Public proof</span>
              <i />
              <span>Creator controlled</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="stats-strip">
        <div>
          <strong>Direct</strong>
          <span>Creator settlement</span>
        </div>
        <div>
          <strong>Claimable</strong>
          <span>Campaign vaults</span>
        </div>
        <div>
          <strong>Onchain</strong>
          <span>Public proof</span>
        </div>
        <div>
          <strong>Open</strong>
          <span>Reference implementation</span>
        </div>
      </section>

      <section className="section-shell featured-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Discover creators</span>
            <h2>Fund something worth following.</h2>
          </div>
          <Link to="/discover">
            Explore all <ArrowRight size={15} />
          </Link>
        </div>
        {isFallback && (
          <div className="catalog-notice" role="status">
            Showcase profiles are illustrative. Publishing and tipping become available after the audited mainnet contracts are configured.
          </div>
        )}
        <div className="creator-grid">
          {creators.map((creator) => (
            <Link
              key={creator.slug}
              to={`/${creator.slug}`}
              className="creator-card"
            >
              <div
                className={`creator-card-art ${creator.accent}`}
                style={creatorImageStyle(creator.image)}
              >
                <span className={`avatar ${creator.accent}`}>
                  {creator.initials}
                </span>
                <span className="category-pill">{creator.category}</span>
              </div>
              <div className="creator-card-copy">
                <div>
                  <h3>{creator.name}</h3>
                  {creator.verified && <ShieldCheck size={16} />}
                </div>
                <p>{creator.bio}</p>
                <div className="mini-progress">
                  <span
                    style={{
                      width: `${Math.min((creator.raised / creator.goal) * 100, 100)}%`,
                    }}
                  />
                </div>
                <footer>
                  <span>
                    <strong>{compactNumber(creator.raised)}</strong> VERSE
                  </span>
                  <span>{creator.supporters} supporters</span>
                </footer>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="how-onchain-tips-work"
        className="section-shell how-section"
      >
        <div className="section-heading centered">
          <span className="eyebrow">Onchain tipping</span>
          <h2>How onchain tips work.</h2>
          <p>
            Choose a creator, pick the settlement path, and verify the result
            directly on Polygon.
          </p>
        </div>
        <div className="step-grid">
          <article>
            <span>
              <Layers3 size={20} />
            </span>
            <small>01</small>
            <h3>Choose a creator</h3>
            <p>Find work you believe in or open a creator’s shared page.</p>
          </article>
          <article>
            <span>
              <CircleDollarSign size={20} />
            </span>
            <small>02</small>
            <h3>Choose how to tip</h3>
            <p>
              Transfer fxVERSE directly, or deposit through a claimable campaign
              vault with a message and collaborator splits.
            </p>
          </article>
          <article>
            <span>
              <Sparkles size={20} />
            </span>
            <small>03</small>
            <h3>See it settle</h3>
            <p>
              Confirm the transaction on Polygon and keep a permanent onchain
              receipt.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

function creatorImageStyle(image?: string) {
  return image
    ? {
        backgroundImage: `linear-gradient(to top, rgba(9, 9, 11, .55), rgba(9, 9, 11, .06)), url("${image}")`,
        backgroundPosition: "center 18%",
        backgroundSize: "cover",
      }
    : undefined;
}
