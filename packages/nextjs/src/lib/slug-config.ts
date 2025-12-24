/**
 * Slug configuration
 */

import type { SlugConfig, SlugConfigMap } from './types';

// Hardcoded slug configs for Vercel deployment
const SLUG_CONFIGS: SlugConfigMap = {
  "default": {
    "slug": "default",
    "baseText": "Hi I want to know more about grapevine",
    "defaultUtmCampaign": "x-general"
  },
  "pune": {
    "slug": "pune",
    "baseText": "Hi I want to know more about grapevine",
    "defaultUtmCampaign": "x-pune"
  },
  "chennai": {
    "slug": "chennai",
    "baseText": "Hi I want to know more about grapevine",
    "defaultUtmCampaign": "x-chennai"
  }
};

const DEFAULT_SLUG_CONFIG: SlugConfig = {
  slug: 'default',
  baseText: 'Hi I want to know more about grapevine',
  defaultUtmCampaign: 'x-default',
};

/**
 * Get configuration for a specific slug
 */
export function getSlugConfig(slug: string): SlugConfig {
  if (SLUG_CONFIGS[slug]) {
    return SLUG_CONFIGS[slug];
  }
  if (SLUG_CONFIGS['default']) {
    return SLUG_CONFIGS['default'];
  }
  return DEFAULT_SLUG_CONFIG;
}

/**
 * Get environment configuration
 */
export function getEnvConfig() {
  return {
    WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || '',
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    IP_HASH_SALT: process.env.IP_HASH_SALT || 'x-wa-bridge-default-salt',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

/**
 * Validate environment config
 */
export function validateEnvConfig(config: { WHATSAPP_NUMBER: string }): string[] {
  const errors: string[] = [];
  if (!config.WHATSAPP_NUMBER) {
    errors.push('WHATSAPP_NUMBER is required');
  } else if (!/^[1-9]\d{6,14}$/.test(config.WHATSAPP_NUMBER)) {
    errors.push('WHATSAPP_NUMBER must be E.164 format digits (no +)');
  }
  return errors;
}
