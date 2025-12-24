/**
 * Shared utilities for X → WhatsApp Bridge
 * Export all shared functionality for use in both Next.js and Express implementations
 */

// Types
export * from './types';

// CID generation
export { generateCid, isValidCid, generateCidWithPrefix } from './cid';

// WhatsApp URL utilities
export {
  isValidPhoneNumber,
  sanitizeMessageText,
  buildMessageWithCid,
  generateWaHttpsUrl,
  generateWaDeepLinkUrl,
  generateWhatsAppUrls,
} from './whatsapp';

// Configuration
export {
  loadSlugConfigs,
  getSlugConfig,
  clearConfigCache,
  getEnvConfig,
  validateEnvConfig,
} from './config';

// Security
export {
  hashIp,
  extractClientIp,
  validateAdminToken,
  SECURITY_HEADERS,
  escapeHtml,
  isValidWhatsAppUrl,
} from './security';

// Database
export {
  getDatabase,
  closeDatabase,
  createClickRecord,
  type Database,
} from './database';

// Landing page
export { generateLandingPageHtml, getSecurityHeaders } from './landing-page';
