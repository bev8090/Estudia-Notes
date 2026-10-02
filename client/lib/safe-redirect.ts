// Only allow same-origin relative paths as post-login destinations.
// Blocks open redirects like `?next=//evil.com` or `?next=https://evil.com`.
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
