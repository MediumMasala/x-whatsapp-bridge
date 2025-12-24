/**
 * Security utilities
 */

import { createHash } from 'crypto';

/**
 * Hash an IP address with salt
 */
export function hashIp(ip: string, salt?: string): string {
  const actualSalt = salt || process.env.IP_HASH_SALT || 'default-salt';
  const hash = createHash('sha256');
  hash.update(ip + actualSalt);
  return hash.digest('hex');
}

/**
 * Extract client IP from request headers
 */
export function extractClientIp(headers: Record<string, string | string[] | undefined>): string {
  const cfIp = headers['cf-connecting-ip'];
  if (cfIp) {
    return Array.isArray(cfIp) ? cfIp[0] : cfIp;
  }

  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  const vercelIp = headers['x-real-ip'];
  if (vercelIp) {
    return Array.isArray(vercelIp) ? vercelIp[0] : vercelIp;
  }

  return 'unknown';
}

/**
 * Validate admin token for protected endpoints
 */
export function validateAdminToken(providedToken: string | undefined): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return false;
  }
  return providedToken === adminToken;
}

/**
 * Security headers
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; '),
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Sanitize a string to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getSecurityHeaders(): Record<string, string> {
  return { ...SECURITY_HEADERS };
}
