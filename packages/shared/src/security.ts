/**
 * Security utilities
 * - IP hashing (never store raw IPs)
 * - Input validation
 * - Security headers
 */

import { createHash } from 'crypto';
import { getEnvConfig } from './config';

/**
 * Hash an IP address with salt
 * Uses SHA256 to create a one-way hash
 * This allows us to track unique visitors without storing raw IPs
 */
export function hashIp(ip: string, salt?: string): string {
  const actualSalt = salt || getEnvConfig().IP_HASH_SALT || 'default-salt';
  const hash = createHash('sha256');
  hash.update(ip + actualSalt);
  return hash.digest('hex');
}

/**
 * Extract client IP from request headers
 * Handles various proxy headers (X-Forwarded-For, CF-Connecting-IP, etc.)
 */
export function extractClientIp(headers: Record<string, string | string[] | undefined>): string {
  // Cloudflare
  const cfIp = headers['cf-connecting-ip'];
  if (cfIp) {
    return Array.isArray(cfIp) ? cfIp[0] : cfIp;
  }

  // Standard proxy header
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    // Take the first IP (original client)
    return ips.split(',')[0].trim();
  }

  // Vercel
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
  const config = getEnvConfig();
  if (!config.ADMIN_TOKEN) {
    // If no admin token configured, deny access
    return false;
  }
  return providedToken === config.ADMIN_TOKEN;
}

/**
 * Security headers to add to all responses
 * Prevents common vulnerabilities
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // XSS protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Content Security Policy
  // Only allow resources from same origin, inline scripts for our minimal JS
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Allow inline scripts for our small CTA handler
    "style-src 'self' 'unsafe-inline'",   // Allow inline styles
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; '),

  // Referrer policy - send origin only
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy - disable unnecessary APIs
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Sanitize a string to prevent XSS when inserted into HTML
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate that a URL is a valid WhatsApp URL (not an open redirect)
 */
export function isValidWhatsAppUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow wa.me domain
    return parsed.hostname === 'wa.me' && parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
