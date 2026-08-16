import * as Popover from "@radix-ui/react-popover";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  ShieldCheck,
  UserRoundPlus,
  WalletCards,
} from "lucide-react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { toast } from "sonner";
import { shortAddress } from "../lib/format";
import { track } from "../lib/analytics";
import { NETWORK_NAME, TOKEN_SYMBOL, WALLETCONNECT_PROJECT_ID } from "../lib/config";
import { useCreatorCatalog } from "../lib/onchainCreators";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const {
    creators: catalogCreators,
    isLoading: isProfileLoading,
    isFallback: isProfileFallback,
  } = useCreatorCatalog(Boolean(address && isConnected));
  const connectedCreator =
    address && !isProfileFallback
      ? catalogCreators.find(
          (creator) => creator.address.toLowerCase() === address.toLowerCase(),
        )
      : undefined;

  if (isConnected && address) {
    return (
      <Popover.Root>
        <Popover.Trigger asChild>
          <button className="wallet-chip" type="button">
            <span className="wallet-avatar">
              {address.slice(2, 4).toUpperCase()}
              <i className="status-dot" />
            </span>
            <span className="wallet-chip-copy">
              <strong>{shortAddress(address)}</strong>
              <small>Polygon</small>
            </span>
            <ChevronDown className="wallet-chip-caret" size={14} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="wallet-panel"
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={12}
            aria-label={connectedCreator ? "Your profile" : "Your account"}
          >
            <div className="wallet-panel-head">
              <span className="wallet-network-status">
                <i /> Polygon mainnet
              </span>
            </div>
            <h2>{connectedCreator ? "Your profile" : "Your account"}</h2>
            <p>
              {connectedCreator
                ? "Your public creator identity and connected payout account."
                : `Signed in securely on ${NETWORK_NAME}. You remain in full control of your assets.`}
            </p>
            {isProfileLoading ? (
              <div className="wallet-profile-card loading" aria-label="Loading creator profile">
                <span className="wallet-profile-skeleton avatar" />
                <div>
                  <span className="wallet-profile-skeleton title" />
                  <span className="wallet-profile-skeleton line" />
                </div>
              </div>
            ) : connectedCreator ? (
              <section className="wallet-profile-card published">
                <div className="wallet-profile-identity">
                  <span className={`wallet-profile-avatar ${connectedCreator.accent}`}>
                    {connectedCreator.image ? (
                      <img src={connectedCreator.image} alt="" />
                    ) : (
                      connectedCreator.initials
                    )}
                    <i />
                  </span>
                  <div>
                    <span className="wallet-profile-category">{connectedCreator.category}</span>
                    <h3>{connectedCreator.name}</h3>
                    <p>{connectedCreator.handle}</p>
                  </div>
                </div>
                <p className="wallet-profile-bio">{connectedCreator.bio}</p>
                <Popover.Close asChild>
                  <Link className="wallet-profile-link" to={`/${connectedCreator.slug}`}>
                    View public profile <ArrowRight size={15} />
                  </Link>
                </Popover.Close>
              </section>
            ) : (
              <section className="wallet-profile-card empty">
                <span className="wallet-empty-profile-icon">
                  <UserRoundPlus size={20} />
                </span>
                <div>
                  <h3>Create your creator profile</h3>
                  <p>Publish your work, reserve a profile link, and start receiving support.</p>
                </div>
                <Popover.Close asChild>
                  <Link className="wallet-profile-link" to="/studio">
                    Open creator studio <ArrowRight size={15} />
                  </Link>
                </Popover.Close>
              </section>
            )}
            <div className="wallet-account-card">
              <span className="wallet-account-avatar">
                {address.slice(2, 4).toUpperCase()}
                <i />
              </span>
              <div className="wallet-account-copy">
                <span>{connectedCreator ? "Payout account" : "Signed-in account"}</span>
                <strong>{shortAddress(address)}</strong>
                <code>{address}</code>
              </div>
              <button
                className="wallet-copy-button"
                type="button"
                aria-label="Copy wallet address"
                onClick={() => {
                  void navigator.clipboard.writeText(address);
                  toast.success("Address copied");
                }}
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="wallet-detail-grid">
              <div>
                <span>Network</span>
                <strong>Polygon</strong>
              </div>
              <div>
                <span>Tips asset</span>
                <strong>{TOKEN_SYMBOL}</strong>
              </div>
            </div>
            <a
              className="wallet-explorer-link"
              href={`https://polygonscan.com/address/${address}`}
              target="_blank"
              rel="noreferrer"
            >
              View account on PolygonScan <ExternalLink size={15} />
            </a>
            <div className="wallet-panel-footer">
              <div className="wallet-drawer-assurance">
                <ShieldCheck size={15} />
                <span>VerseTip never takes custody of your funds.</span>
              </div>
              <button
                className="button secondary full disconnect-button"
                type="button"
                onClick={() => disconnect()}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <button
      className="wallet-connect-button"
      onClick={() => {
        if (!WALLETCONNECT_PROJECT_ID) {
          toast.error("Wallet sign-in is not configured.");
          return;
        }
        track("wallet_connect_started", { connector: "reown" });
        void open({ view: "Connect" });
      }}
    >
      <span className="wallet-connect-icon"><WalletCards size={17} /></span>
      <span className="wallet-connect-copy">
        <strong>Sign in</strong>
        <small>Polygon mainnet</small>
      </span>
      <ArrowRight className="wallet-connect-arrow" size={15} />
    </button>
  );
}
