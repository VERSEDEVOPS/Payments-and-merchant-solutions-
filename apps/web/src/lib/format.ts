export function compactNumber(value: number | bigint): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
}

export function shortAddress(value?: string): string {
  if (!value) return "";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function shortHash(value?: string): string {
  if (!value) return "";
  return `${value.slice(0, 10)}…${value.slice(-4)}`;
}

export function relativeTime(unixSeconds: number, nowMs = Date.now()): string {
  const delta = Math.max(0, Math.floor(nowMs / 1000) - unixSeconds);
  if (delta < 60) return `${delta}s`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h`;
  return `${Math.floor(delta / 86400)}d`;
}

export function readableError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/rejected|denied/i.test(message))
    return "The request was declined in your wallet.";
  if (/insufficient funds/i.test(message))
    return "Your wallet does not have enough POL for network fees.";
  if (/exceeds balance|transfer amount/i.test(message))
    return "Your VERSE balance is too low for this tip.";
  return "The transaction could not be completed. Please review the details and try again.";
}
