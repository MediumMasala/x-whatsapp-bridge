/**
 * Configuration loading and slug management
 */

import type { SlugConfig, SlugConfigMap, EnvConfig } from './types';

// Default slug configuration used as fallback
const DEFAULT_SLUG_CONFIG: SlugConfig = {
  slug: 'default',
  baseText: 'Hi Tal',
  defaultUtmCampaign: 'x-default',
};

// In-memory cache for slug configs
let slugConfigCache: SlugConfigMap | null = null;

/**
 * Load slug configurations from JSON
 * In production, this could be loaded from a file, database, or env var
 */
export function loadSlugConfigs(configJson?: string | SlugConfigMap): SlugConfigMap {
  if (slugConfigCache) {
    return slugConfigCache;
  }

  if (!configJson) {
    // Return default config if nothing provided
    slugConfigCache = { default: DEFAULT_SLUG_CONFIG };
    return slugConfigCache;
  }

  try {
    const configs = typeof configJson === 'string'
      ? JSON.parse(configJson) as SlugConfigMap
      : configJson;

    // Validate each config has required fields
    for (const [key, config] of Object.entries(configs)) {
      if (!config.slug || !config.baseText) {
        throw new Error(`Invalid config for slug "${key}": missing required fields`);
      }
    }

    slugConfigCache = configs;
    return configs;
  } catch (err) {
    console.error('Failed to parse slug configs:', err);
    slugConfigCache = { default: DEFAULT_SLUG_CONFIG };
    return slugConfigCache;
  }
}

/**
 * Get configuration for a specific slug
 * Falls back to 'default' if slug not found
 */
export function getSlugConfig(slug: string, configs?: SlugConfigMap): SlugConfig {
  const allConfigs = configs || slugConfigCache || loadSlugConfigs();

  // Look for exact match first
  if (allConfigs[slug]) {
    return allConfigs[slug];
  }

  // Fall back to default
  if (allConfigs['default']) {
    return allConfigs['default'];
  }

  // Ultimate fallback
  return DEFAULT_SLUG_CONFIG;
}

/**
 * Clear the config cache (useful for testing)
 */
export function clearConfigCache(): void {
  slugConfigCache = null;
}

/**
 * Get environment configuration with defaults
 */
export function getEnvConfig(): EnvConfig {
  return {
    WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || '',
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    IP_HASH_SALT: process.env.IP_HASH_SALT || 'x-wa-bridge-default-salt',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

/**
 * Validate that required environment variables are set
 */
export function validateEnvConfig(config: EnvConfig): string[] {
  const errors: string[] = [];

  if (!config.WHATSAPP_NUMBER) {
    errors.push('WHATSAPP_NUMBER is required');
  } else if (!/^[1-9]\d{6,14}$/.test(config.WHATSAPP_NUMBER)) {
    errors.push('WHATSAPP_NUMBER must be E.164 format digits (no +)');
  }

  return errors;
}
