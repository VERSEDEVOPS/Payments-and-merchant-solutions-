import { Link } from "react-router-dom";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="VerseTip home">
      <img src="/versetip-mark.svg" alt="" width="36" height="36" />
      {!compact && (
        <span className="brand-wordmark">
          Verse<span>Tip</span>
        </span>
      )}
    </Link>
  );
}
