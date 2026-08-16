export function publicServiceUrl(
  value: string,
  isProduction: boolean,
): string {
  const normalized = value.trim().replace(/\/+$/, "");
  if (!normalized || normalized.startsWith("/")) return normalized;

  try {
    const hostname = new URL(normalized).hostname;
    const isLoopback =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]";
    return isProduction && isLoopback ? "" : normalized;
  } catch {
    return "";
  }
}
