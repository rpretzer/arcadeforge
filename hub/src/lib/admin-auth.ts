/**
 * Admin session verification.
 * Uses Web Crypto API for Edge compatibility (middleware runs on Edge).
 */

async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison to prevent timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies that the admin session cookie is valid by checking that
 * hash(admin_session) === admin_session_check. Both cookies are set
 * together on login, so only the legitimate session passes.
 */
export async function verifyAdminSession(
  sessionToken: string | undefined,
  storedHash: string | undefined
): Promise<boolean> {
  if (!sessionToken || !storedHash) return false;
  const computedHash = await sha256Hex(sessionToken);
  return timingSafeEqual(computedHash, storedHash);
}
