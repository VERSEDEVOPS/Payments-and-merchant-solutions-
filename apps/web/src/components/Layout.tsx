import { BookOpen, Compass, LayoutDashboard } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Brand } from "./Brand";
import { ThemePreferences } from "./ThemePreferences";
import { WalletButton } from "./WalletButton";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Primary navigation">
            <NavLink to="/discover"><Compass size={15} />Discover</NavLink>
            <NavLink to="/studio"><LayoutDashboard size={15} />Studio</NavLink>
            <NavLink to="/ecosystem"><BookOpen size={15} />Ecosystem</NavLink>
          </nav>
          <div className="header-actions">
            <WalletButton />
            <ThemePreferences />
          </div>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div><Brand compact /><span>Built for the Verse ecosystem.</span></div>
        <div><Link to="/security">Security</Link><a href="https://verse.bitcoin.com" target="_blank" rel="noreferrer">Verse</a><a href="https://hub.vgdh.io" target="_blank" rel="noreferrer">Impact Hub</a></div>
      </footer>
      <nav className="mobile-tab-bar" aria-label="Mobile navigation">
        <NavLink to="/discover"><Compass size={19} /><span>Discover</span></NavLink>
        <NavLink to="/studio"><LayoutDashboard size={19} /><span>Studio</span></NavLink>
        <NavLink to="/ecosystem"><BookOpen size={19} /><span>Ecosystem</span></NavLink>
      </nav>
    </div>
  );
}
