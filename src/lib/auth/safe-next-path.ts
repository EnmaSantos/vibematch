export function safeNextPath(value: unknown, fallback = "/app") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  const baseUrl = new URL("https://vibematch.local");
  const nextUrl = new URL(value, baseUrl);

  if (nextUrl.origin !== baseUrl.origin) {
    return fallback;
  }

  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}
