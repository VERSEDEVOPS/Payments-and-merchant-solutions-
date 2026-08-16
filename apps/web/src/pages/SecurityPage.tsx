import {
  CheckCircle2,
  ExternalLink,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  CREATOR_REGISTRY_ADDRESS,
  EXPLORER_URL,
  TIP_VAULT_ADDRESS,
} from "../lib/config";

const SAFE_CREATE_URL =
  "https://app.safe.global/new-safe/create?chain=matic";

export function SecurityPage() {
  const vaultLive =
    TIP_VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000";
  const controls = [
    "Non-upgradeable vault architecture",
    "Claims remain open if deposits are paused",
    "You can claim yourself or sign a gasless claim that VerseTip submits",
    "Bounded campaign collaborator loops",
    "Solvency checked after every state-changing transfer",
    "No administrator access to creator liabilities",
  ];
  return (
    <div className="section-shell page-stack security-page">
      <div className="page-heading">
        <span className="eyebrow">Security</span>
        <h1>Designed for verifiable trust.</h1>
        <p>
          VerseTip never asks for private keys and never takes custody of direct
          tips. Vault tips stay in the contract until you claim them.
        </p>
      </div>
      <div className="security-hero">
        <span>
          <ShieldCheck size={26} />
        </span>
        <div>
          <h2>
            {vaultLive
              ? "Polygon vault is live"
              : "Mainnet vault pending deployment"}
          </h2>
          <p>
            {vaultLive
              ? "This version is owned by the deployer key, not a Safe. Direct tips never pass through the vault."
              : "Direct creator transfers remain available until the vault is configured."}
          </p>
        </div>
      </div>
      <div className="security-upgrade">
        <span>
          <ShieldAlert size={26} />
        </span>
        <div>
          <h2>Upgrade to a Safe</h2>
          <p>
            A single EOA can pause deposits or recover excess tokens if the
            key is lost or compromised. For security, create a Polygon Safe,
            transfer ownership of the vault to that Safe, then accept
            ownership from the Safe. The vault uses two-step Ownable, so the
            Safe must accept before admin rights move.
          </p>
          <ol>
            <li>Create a 2-of-3 or stronger Safe on Polygon.</li>
            <li>
              From the deployer, call <code>transferOwnership(safe)</code>.
            </li>
            <li>
              From the Safe, call <code>acceptOwnership()</code> and confirm
              the vault <code>owner()</code> is the Safe.
            </li>
          </ol>
          <a href={SAFE_CREATE_URL} target="_blank" rel="noreferrer">
            Create a Polygon Safe <ExternalLink size={14} />
          </a>
        </div>
      </div>
      <div className="security-columns">
        <section>
          <div className="subsection-heading">
            <div>
              <LockKeyhole size={17} />
              <h2>Contract controls</h2>
            </div>
          </div>
          {controls.map((control) => (
            <p key={control}>
              <CheckCircle2 size={16} />
              {control}
            </p>
          ))}
        </section>
        <section>
          <h2>Verify everything</h2>
          <p>
            Check the live Polygon contracts yourself. An independent vault
            audit has not been completed for this version.
          </p>
          {vaultLive && (
            <a
              href={`${EXPLORER_URL}/address/${TIP_VAULT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              TipVault on PolygonScan <ExternalLink size={14} />
            </a>
          )}
          {CREATOR_REGISTRY_ADDRESS !==
            "0x0000000000000000000000000000000000000000" && (
            <a
              href={`${EXPLORER_URL}/address/${CREATOR_REGISTRY_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              CreatorRegistry on PolygonScan <ExternalLink size={14} />
            </a>
          )}
          <a
            href="https://verse.bitcoin.com/audits/"
            target="_blank"
            rel="noreferrer"
          >
            View Verse ecosystem audits <ExternalLink size={14} />
          </a>
        </section>
      </div>
    </div>
  );
}
