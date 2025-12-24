/**
 * Tests for configuration utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSlugConfigs,
  getSlugConfig,
  clearConfigCache,
  validateEnvConfig,
} from '../config';
import type { SlugConfigMap, EnvConfig } from '../types';

describe('loadSlugConfigs', () => {
  beforeEach(() => {
    clearConfigCache();
  });

  it('should parse valid JSON config', () => {
    const configJson = JSON.stringify({
      default: { slug: 'default', baseText: 'Hi' },
      pune: { slug: 'pune', baseText: 'Hi from Pune' },
    });

    const configs = loadSlugConfigs(configJson);

    expect(configs.default).toBeDefined();
    expect(configs.default.baseText).toBe('Hi');
    expect(configs.pune.baseText).toBe('Hi from Pune');
  });

  it('should accept object config directly', () => {
    const config: SlugConfigMap = {
      test: { slug: 'test', baseText: 'Test message' },
    };

    const configs = loadSlugConfigs(config);
    expect(configs.test.baseText).toBe('Test message');
  });

  it('should return default config if nothing provided', () => {
    const configs = loadSlugConfigs();
    expect(configs.default).toBeDefined();
    expect(configs.default.baseText).toBe('Hi Tal');
  });

  it('should handle invalid JSON gracefully', () => {
    const configs = loadSlugConfigs('not valid json');
    expect(configs.default).toBeDefined();
  });
});

describe('getSlugConfig', () => {
  beforeEach(() => {
    clearConfigCache();
    loadSlugConfigs({
      default: { slug: 'default', baseText: 'Default message', defaultUtmCampaign: 'default-campaign' },
      pune: { slug: 'pune', baseText: 'Pune message', phoneOverride: '919999999999' },
      chennai: { slug: 'chennai', baseText: 'Chennai message' },
    });
  });

  it('should return config for existing slug', () => {
    const config = getSlugConfig('pune');
    expect(config.slug).toBe('pune');
    expect(config.baseText).toBe('Pune message');
    expect(config.phoneOverride).toBe('919999999999');
  });

  it('should return default config for unknown slug', () => {
    const config = getSlugConfig('nonexistent');
    expect(config.slug).toBe('default');
    expect(config.baseText).toBe('Default message');
  });

  it('should include optional fields when present', () => {
    const config = getSlugConfig('default');
    expect(config.defaultUtmCampaign).toBe('default-campaign');
  });
});

describe('validateEnvConfig', () => {
  it('should pass for valid config', () => {
    const config: EnvConfig = {
      WHATSAPP_NUMBER: '14155552671',
    };

    const errors = validateEnvConfig(config);
    expect(errors).toHaveLength(0);
  });

  it('should fail for missing WHATSAPP_NUMBER', () => {
    const config: EnvConfig = {
      WHATSAPP_NUMBER: '',
    };

    const errors = validateEnvConfig(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('WHATSAPP_NUMBER');
  });

  it('should fail for invalid phone number format', () => {
    const config: EnvConfig = {
      WHATSAPP_NUMBER: '+14155552671', // Has + prefix
    };

    const errors = validateEnvConfig(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('E.164');
  });

  it('should fail for phone starting with 0', () => {
    const config: EnvConfig = {
      WHATSAPP_NUMBER: '014155552671',
    };

    const errors = validateEnvConfig(config);
    expect(errors.length).toBeGreaterThan(0);
  });
});
