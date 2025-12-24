/**
 * Configuration loader for Next.js
 * Loads slug configs from the shared config directory
 */

import { loadSlugConfigs, type SlugConfigMap } from '@x-whatsapp-bridge/shared';
import slugConfigs from '../../../../config/slugs.json';

let initialized = false;

/**
 * Initialize slug configurations
 * Call this once at app startup
 */
export function initializeConfigs(): SlugConfigMap {
  if (!initialized) {
    loadSlugConfigs(slugConfigs as SlugConfigMap);
    initialized = true;
  }
  return slugConfigs as SlugConfigMap;
}

// Auto-initialize on import
initializeConfigs();
