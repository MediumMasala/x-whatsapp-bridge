/**
 * Types for the X → WhatsApp Bridge service
 */

/** Configuration for a URL slug */
export interface SlugConfig {
  slug: string;
  baseText: string;
  phoneOverride?: string;
  defaultUtmCampaign?: string;
}

/** Map of slug names to their configurations */
export interface SlugConfigMap {
  [slug: string]: SlugConfig;
}

/** Click record stored in database */
export interface ClickRecord {
  id?: number;
  cid: string;
  slug: string;
  created_at: string;
  twclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  user_agent?: string | null;
  referer?: string | null;
  ip_hash?: string | null;
}

/** Data needed to render the landing page */
export interface LandingPageData {
  cid: string;
  slug: string;
  phoneNumber: string;
  messageText: string;
  waHttpsUrl: string;
  waDeepLinkUrl: string;
}

/** Environment configuration */
export interface EnvConfig {
  WHATSAPP_NUMBER: string;
  DATABASE_URL?: string;
  ADMIN_TOKEN?: string;
  IP_HASH_SALT?: string;
  NODE_ENV?: string;
}
