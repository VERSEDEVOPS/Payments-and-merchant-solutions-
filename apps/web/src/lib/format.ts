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
