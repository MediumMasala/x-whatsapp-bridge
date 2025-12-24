/**
 * WhatsApp URL generation utilities
 * Generates both HTTPS (wa.me) and deep link (whatsapp://) URLs
 */

// Maximum message length to prevent abuse (WhatsApp practical limit is ~65536)
const MAX_MESSAGE_LENGTH = 2000;

// Phone number validation: E.164 format digits only (no +)
const PHONE_REGEX = /^[1-9]\d{6,14}$/;

/**
 * Validate phone number format
 * Must be E.164 format digits without the + prefix
 * Examples: "14155552671" (US), "919876543210" (India)
 */
export function isValidPhoneNumber(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

/**
 * Sanitize and truncate message text
 * - Trims whitespace
 * - Removes null bytes
 * - Truncates to max length
 */
export function sanitizeMessageText(text: string): string {
  return text
    .trim()
    .replace(/\0/g, '') // Remove null bytes
    .slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Build the final message text with cid appended
 * Format: "baseText (cid:ABC123DEF0)"
 */
export function buildMessageWithCid(baseText: string, cid: string): string {
  const sanitized = sanitizeMessageText(baseText);
  return `${sanitized} (cid:${cid})`;
}

/**
 * Generate WhatsApp HTTPS URL (wa.me format)
 * This is the universal link that works across all platforms
 */
export function generateWaHttpsUrl(phone: string, text: string): string {
  if (!isValidPhoneNumber(phone)) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }

  const sanitizedText = sanitizeMessageText(text);
  const encodedText = encodeURIComponent(sanitizedText);

  return `https://wa.me/${phone}?text=${encodedText}`;
}

/**
 * Generate WhatsApp deep link URL (whatsapp:// protocol)
 * This attempts to open WhatsApp directly (may fail in some browsers)
 */
export function generateWaDeepLinkUrl(phone: string, text: string): string {
  if (!isValidPhoneNumber(phone)) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }

  const sanitizedText = sanitizeMessageText(text);
  const encodedText = encodeURIComponent(sanitizedText);

  return `whatsapp://send?phone=${phone}&text=${encodedText}`;
}

/**
 * Generate both URL formats for a given phone and message
 */
export function generateWhatsAppUrls(phone: string, baseText: string, cid: string): {
  messageText: string;
  httpsUrl: string;
  deepLinkUrl: string;
} {
  const messageText = buildMessageWithCid(baseText, cid);

  return {
    messageText,
    httpsUrl: generateWaHttpsUrl(phone, messageText),
    deepLinkUrl: generateWaDeepLinkUrl(phone, messageText),
  };
}
