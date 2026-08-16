import {
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Flame,
  Layers3,
  Shield,
  Sparkles,
} from "lucide-react";
import { VerseTokenMark } from "../components/VerseTokenMark";

const features = [
  {
    icon: CircleDollarSign,
    title: "Verse DEX",
    copy: "Acquire VERSE, swap assets, and explore permissionless liquidity.",
    href: "https://verse.bitcoin.com",
  },
  {
    icon: Layers3,
    title: "Staking & farms",
    copy: "Discover ways to put VERSE and liquidity positions to work.",
    href: "https://verse.bitcoin.com/farms/",
  },
  {
    icon: Flame,
    title: "Burn engine",
    copy: "Follow transparent supply reduction driven by ecosystem activity.",
    href: "https://verse.bitcoin.com",
  },
  {
    icon: Bot,
    title: "Bitcoin.com AI",
    copy: "Access private AI experiences and earn credits through VERSE utility.",
    href: "https://verse.bitcoin.com",
  },
  {
    icon: Shield,
    title: "Security audits",
    copy: "Review published third-party audits for Verse contracts and products.",
    href: "https://verse.bitcoin.com/audits/",
  },
  {
    icon: Sparkles,
    title: "Impact Hub",
    copy: "Verify participation, register applications, and contribute to Verse.",
    href: "https://hub.vgdh.io",
  },
];

export function EcosystemPage() {
  return (
    <div className="section-shell page-stack ecosystem-page">
      <div className="page-heading">
        <span className="eyebrow">Built with Verse</span>
        <h1>One token. A growing world of utility.</h1>
        <p>
          VerseTip is one reference implementation inside a broader ecosystem of
          self-custodial tools, rewards, markets, and community-led products.
        </p>
      </div>
      <div className="ecosystem-feature">
        <div>
          <span>fxVERSE ON POLYGON</span>
          <h2>Support is only the beginning.</h2>
          <p>
            Tip creators, then explore swapping, staking, liquidity, games, AI,
            and community participation through the official Verse ecosystem.
          </p>
          <a
            className="button light"
            href="https://verse.bitcoin.com"
            target="_blank"
            rel="noreferrer"
          >
            Explore Verse <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="ecosystem-orbit">
          <VerseTokenMark size={86} title="fxVERSE token" />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="ecosystem-grid">
        {features.map(({ icon: Icon, ...feature }) => (
          <a
            key={feature.title}
            href={feature.href}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              <Icon size={19} />
            </span>
            <ArrowUpRight className="card-arrow" size={16} />
            <h2>{feature.title}</h2>
            <p>{feature.copy}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
