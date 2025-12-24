/**
 * Tests for WhatsApp URL generation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isValidPhoneNumber,
  sanitizeMessageText,
  buildMessageWithCid,
  generateWaHttpsUrl,
  generateWaDeepLinkUrl,
  generateWhatsAppUrls,
} from '../whatsapp';

describe('isValidPhoneNumber', () => {
  it('should accept valid E.164 phone numbers', () => {
    expect(isValidPhoneNumber('14155552671')).toBe(true);  // US
    expect(isValidPhoneNumber('919876543210')).toBe(true); // India
    expect(isValidPhoneNumber('447911123456')).toBe(true); // UK
    expect(isValidPhoneNumber('1234567')).toBe(true);      // Minimum length
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('0')).toBe(false);           // Can't start with 0
    expect(isValidPhoneNumber('01234567890')).toBe(false); // Starts with 0
    expect(isValidPhoneNumber('+14155552671')).toBe(false); // Has + prefix
    expect(isValidPhoneNumber('123')).toBe(false);          // Too short
    expect(isValidPhoneNumber('123456789012345678')).toBe(false); // Too long
    expect(isValidPhoneNumber('1234567abc')).toBe(false);  // Non-digits
  });
});

describe('sanitizeMessageText', () => {
  it('should trim whitespace', () => {
    expect(sanitizeMessageText('  hello  ')).toBe('hello');
    expect(sanitizeMessageText('\n\ttest\n')).toBe('test');
  });

  it('should remove null bytes', () => {
    expect(sanitizeMessageText('hello\x00world')).toBe('helloworld');
  });

  it('should truncate long messages', () => {
    const longMessage = 'a'.repeat(3000);
    const result = sanitizeMessageText(longMessage);
    expect(result.length).toBe(2000);
  });

  it('should preserve normal text', () => {
    const text = 'Hello! How are you? 😊';
    expect(sanitizeMessageText(text)).toBe(text);
  });
});

describe('buildMessageWithCid', () => {
  it('should append cid to message', () => {
    const result = buildMessageWithCid('Hi Tal', 'ABC123DEF0');
    expect(result).toBe('Hi Tal (cid:ABC123DEF0)');
  });

  it('should handle empty base text', () => {
    const result = buildMessageWithCid('', 'ABC123DEF0');
    expect(result).toBe(' (cid:ABC123DEF0)');
  });

  it('should trim the base text', () => {
    const result = buildMessageWithCid('  Hello  ', 'ABC123DEF0');
    expect(result).toBe('Hello (cid:ABC123DEF0)');
  });
});

describe('generateWaHttpsUrl', () => {
  it('should generate valid wa.me URL', () => {
    const url = generateWaHttpsUrl('14155552671', 'Hello');
    expect(url).toBe('https://wa.me/14155552671?text=Hello');
  });

  it('should URL encode the message', () => {
    const url = generateWaHttpsUrl('14155552671', 'Hello World!');
    expect(url).toBe('https://wa.me/14155552671?text=Hello%20World!');
  });

  it('should handle special characters', () => {
    const url = generateWaHttpsUrl('14155552671', 'Hi! How are you? 😊');
    expect(url).toContain('https://wa.me/14155552671?text=');
    expect(url).toContain('%20');  // Space encoded
  });

  it('should throw for invalid phone number', () => {
    expect(() => generateWaHttpsUrl('invalid', 'Hello')).toThrow();
  });
});

describe('generateWaDeepLinkUrl', () => {
  it('should generate valid whatsapp:// URL', () => {
    const url = generateWaDeepLinkUrl('14155552671', 'Hello');
    expect(url).toBe('whatsapp://send?phone=14155552671&text=Hello');
  });

  it('should URL encode the message', () => {
    const url = generateWaDeepLinkUrl('14155552671', 'Hello World!');
    expect(url).toBe('whatsapp://send?phone=14155552671&text=Hello%20World!');
  });

  it('should throw for invalid phone number', () => {
    expect(() => generateWaDeepLinkUrl('invalid', 'Hello')).toThrow();
  });
});

describe('generateWhatsAppUrls', () => {
  it('should generate both URL formats with cid', () => {
    const result = generateWhatsAppUrls('14155552671', 'Hi Tal', 'ABC123DEF0');

    expect(result.messageText).toBe('Hi Tal (cid:ABC123DEF0)');
    expect(result.httpsUrl).toContain('https://wa.me/14155552671');
    expect(result.httpsUrl).toContain('cid%3AABC123DEF0'); // : encoded as %3A
    expect(result.deepLinkUrl).toContain('whatsapp://send');
    expect(result.deepLinkUrl).toContain('cid%3AABC123DEF0');
  });

  it('should properly encode the full message', () => {
    const result = generateWhatsAppUrls('919876543210', 'Hello from Chennai!', 'XYZ987ABC1');

    expect(result.messageText).toBe('Hello from Chennai! (cid:XYZ987ABC1)');
    // Verify URL encoding
    const decoded = decodeURIComponent(result.httpsUrl.split('text=')[1]);
    expect(decoded).toBe('Hello from Chennai! (cid:XYZ987ABC1)');
  });
});
