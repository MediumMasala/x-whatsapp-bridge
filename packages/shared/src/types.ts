/**
 * Types for the X → WhatsApp Bridge service
 */

/** Configuration for a URL slug */
export interface SlugConfig {
  slug: string;
  baseText: string;
  phoneOverride?: string; // E.164 format without +
  defaultUtmCampaign?: string;
}

/** Map of slug names to their configurations */
export interface SlugConfigMap {
  [slug: string]: SlugConfig;
}

/** UTM parameters extracted from query string */
export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}

/** Query parameters from the incoming request */
export interface RequestParams extends UtmParams {
  text?: string;         // Optional override for message text
  twclid?: string;       // X/Twitter click ID
  [key: string]: string | undefined; // Other passthrough params
}

/** Click record stored in database */
export interface ClickRecord {
  id?: number;
  cid: string;           // Our generated click ID
  slug: string;          // URL slug used
  created_at: string;    // ISO timestamp
  twclid?: string | null;       // X click ID if present
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  user_agent?: string | null;
  referer?: string | null;
  ip_hash?: string | null;      // SHA256 of IP + salt (never store raw IP)
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
  DATABASE_URL?: string;      // Postgres connection string for production
  ADMIN_TOKEN?: string;       // Token for admin API access
  IP_HASH_SALT?: string;      // Salt for IP hashing
  NODE_ENV?: string;
}
