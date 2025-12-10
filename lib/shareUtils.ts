import { randomBytes, createHash } from "crypto";

/**
 * Generate a unique share code (8 chars, URL-safe)
 */
export function generateShareCode(): string {
  return randomBytes(6).toString("base64url").slice(0, 8);
}

/**
 * Hash a password for storage
 */
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Hash an IP address for privacy-safe storage
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Check if a share is currently accessible
 */
export function isShareAccessible(share: {
  is_active?: boolean | null;
  is_revoked?: boolean | null;
  expires_at?: Date | null;
  starts_at?: Date | null;
}): { accessible: boolean; reason?: string } {
  if (!share.is_active) {
    return { accessible: false, reason: "This link is no longer active." };
  }
  if (share.is_revoked) {
    return { accessible: false, reason: "This link has been revoked." };
  }
  const now = new Date();
  if (share.expires_at && new Date(share.expires_at) < now) {
    return { accessible: false, reason: "This link has expired." };
  }
  if (share.starts_at && new Date(share.starts_at) > now) {
    return { accessible: false, reason: "This link is not yet active." };
  }
  return { accessible: true };
}
