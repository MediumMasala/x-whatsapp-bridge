/**
 * WhatsApp URL generation utilities
 */

const MAX_MESSAGE_LENGTH = 2000;
const PHONE_REGEX = /^[1-9]\d{6,14}$/;

export function isValidPhoneNumber(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function sanitizeMessageText(text: string): string {
  return text
    .trim()
    .replace(/\0/g, '')
    .slice(0, MAX_MESSAGE_LENGTH);
}

export function buildMessageWithCid(baseText: string, cid: string): string {
  const sanitized = sanitizeMessageText(baseText);
  return `${sanitized} (cid:${cid})`;
}

export function generateWaHttpsUrl(phone: string, text: string): string {
  if (!isValidPhoneNumber(phone)) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }
  const sanitizedText = sanitizeMessageText(text);
  const encodedText = encodeURIComponent(sanitizedText);
  return `https://wa.me/${phone}?text=${encodedText}`;
}

export function generateWaDeepLinkUrl(phone: string, text: string): string {
  if (!isValidPhoneNumber(phone)) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }
  const sanitizedText = sanitizeMessageText(text);
  const encodedText = encodeURIComponent(sanitizedText);
  return `whatsapp://send?phone=${phone}&text=${encodedText}`;
}

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
