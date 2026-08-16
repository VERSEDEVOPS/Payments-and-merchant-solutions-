import {
  Check,
  ChevronDown,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreatorCatalog } from "../lib/onchainCreators";
import { compactNumber } from "../lib/format";
import { parseRecipientAddress } from "../lib/recipient";

export function DiscoverPage() {
  const { creators, isFallback } = useCreatorCatalog();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const tipAddress = parseRecipientAddress(walletInput.trim());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => ["All", ...new Set(creators.map((creator) => creator.category))],
    [creators],
  );
  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        categories.map((item) => [
          item,
          item === "All"
            ? creators.length
            : creators.filter((creator) => creator.category === item).length,
        ]),
      ),
    [categories, creators],
  );
  const filtered = useMemo(
    () =>
      creators.filter(
        (creator) =>
          (category === "All" || creator.category === category) &&
          `${creator.name} ${creator.category} ${creator.bio}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [category, creators, query],
  );
  return (
    <div className="section-shell page-stack">
      <div className="page-heading">
        <span className="eyebrow">Verse creators</span>
        <h1>Discover work worth supporting.</h1>
        <p>
          Explore builders, artists, educators, and community leaders creating
          value across the Verse ecosystem. You can also tip any Polygon wallet
          — they do not need a profile first.
        </p>
      </div>
      <form
        className="tip-wallet-bar"
        onSubmit={(event) => {
          event.preventDefault();
          if (tipAddress) navigate(`/${tipAddress}`);
        }}
      >
        <label>
          <span>Tip any wallet</span>
          <input
            value={walletInput}
            onChange={(event) => setWalletInput(event.target.value)}
            placeholder="0x…"
            aria-label="Recipient wallet address"
            spellCheck={false}
          />
        </label>
        <button type="submit" className="button primary" disabled={!tipAddress}>
          Open tip page
        </button>
      </form>
      <div className="filter-bar">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creators or categories"
          />
        </label>
        <button
          type="button"
          className={filtersOpen || category !== "All" ? "active" : ""}
          aria-expanded={filtersOpen}
          aria-controls="creator-category-filters"
          onClick={() => setFiltersOpen((current) => !current)}
        >
          <SlidersHorizontal size={16} />
          {category === "All" ? "All categories" : category}
          <ChevronDown className={filtersOpen ? "filter-chevron open" : "filter-chevron"} size={14} />
        </button>
      </div>
      {filtersOpen && (
        <section
          className="category-filter-panel"
          id="creator-category-filters"
          aria-label="Creator categories"
        >
          <div className="category-filter-heading">
            <div>
              <strong>Filter by category</strong>
              <span>Show creators working in a specific area.</span>
            </div>
            <button type="button" aria-label="Close category filters" onClick={() => setFiltersOpen(false)}><X size={15} /></button>
          </div>
          <div className="category-filter-options">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? "active" : ""}
                aria-pressed={category === item}
                onClick={() => {
                  setCategory(item);
                  setFiltersOpen(false);
                }}
              >
                <span>
                  <strong>{item === "All" ? "All creators" : item}</strong>
                  <small>
                    {categoryCounts[item]} {categoryCounts[item] === 1 ? "creator" : "creators"}
                  </small>
                </span>
                {category === item && <Check size={15} />}
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="discover-results-summary" aria-live="polite">
        <span><strong>{filtered.length}</strong> {filtered.length === 1 ? "creator" : "creators"}</span>
        <span>{category === "All" ? "Across all categories" : `In ${category}`}</span>
        {category !== "All" && (
          <button type="button" onClick={() => setCategory("All")}><X size={13} /> Clear filter</button>
        )}
      </div>
      {isFallback && (
        <div className="catalog-notice" role="status">
          You are viewing illustrative profiles. Demo recipients cannot receive mainnet tips.
        </div>
      )}
      <div className="creator-grid discover-grid">
        {filtered.map((creator) => (
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
      {filtered.length === 0 && (
        <div className="empty-state">
          <Search size={24} />
          <h2>No creators found</h2>
          <p>Try a broader name, category, or keyword.</p>
        </div>
      )}
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
