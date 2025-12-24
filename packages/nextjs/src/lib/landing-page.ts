/**
 * Landing page HTML generator
 */

import type { LandingPageData } from './types';
import { escapeHtml } from './security';

export function generateLandingPageHtml(data: LandingPageData): string {
  const { cid, messageText, waHttpsUrl, waDeepLinkUrl } = data;

  const safeMessageText = escapeHtml(messageText);
  const safeWaHttpsUrl = escapeHtml(waHttpsUrl);
  const safeWaDeepLinkUrl = escapeHtml(waDeepLinkUrl);
  const safeCid = escapeHtml(cid);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="robots" content="noindex, nofollow">
  <title>Open WhatsApp to chat with Tal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #075e54 0%, #128c7e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #fff;
    }
    .container {
      background: #fff;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    .logo { width: 80px; height: 80px; margin-bottom: 20px; }
    h1 { color: #1a1a1a; font-size: 22px; font-weight: 600; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .cta-button {
      display: block;
      width: 100%;
      background: #25d366;
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 16px 24px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s, transform 0.1s;
      -webkit-tap-highlight-color: transparent;
    }
    .cta-button:hover { background: #20bd5a; }
    .cta-button:active { transform: scale(0.98); }
    .message-preview {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 20px 0;
      text-align: left;
    }
    .message-preview-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .message-preview-text { color: #333; font-size: 14px; word-break: break-word; }
    .copy-button {
      background: none;
      border: 1px solid #ddd;
      color: #666;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.2s;
    }
    .copy-button:hover { border-color: #25d366; color: #25d366; }
    .copy-button.copied { border-color: #25d366; background: #e8f8ee; color: #25d366; }
    .fallback { margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee; }
    .fallback-link { color: #666; font-size: 13px; text-decoration: underline; cursor: pointer; }
    .fallback-instructions {
      display: none;
      background: #fffbe6;
      border: 1px solid #f0e68c;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
      text-align: left;
      font-size: 13px;
      color: #666;
    }
    .fallback-instructions.show { display: block; }
    .fallback-instructions ol { margin-left: 18px; }
    .fallback-instructions li { margin-bottom: 6px; }
    .cid-tag { color: #aaa; font-size: 10px; margin-top: 16px; }
    @media (max-width: 380px) {
      .container { padding: 24px 16px; }
      h1 { font-size: 20px; }
      .cta-button { font-size: 16px; padding: 14px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <svg class="logo" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#25D366"/>
      <path d="M55.5 24.5C51.4 20.4 45.9 18 40 18c-12.2 0-22 9.8-22 22 0 3.9 1 7.7 2.9 11L18 62l11.3-2.9c3.2 1.7 6.8 2.7 10.6 2.7h.1c12.2 0 22-9.8 22-22 0-5.9-2.3-11.4-6.5-15.5zM40 57.9c-3.3 0-6.5-.9-9.3-2.5l-.7-.4-6.9 1.8 1.8-6.7-.4-.7c-1.8-2.9-2.8-6.2-2.8-9.6 0-10.1 8.2-18.3 18.3-18.3 4.9 0 9.5 1.9 13 5.4 3.4 3.4 5.3 8 5.3 12.9-.1 10.1-8.3 18.3-18.3 18.3zm10-13.7c-.5-.3-3.2-1.6-3.7-1.8-.5-.2-.9-.3-1.2.3-.4.5-1.4 1.8-1.7 2.2-.3.4-.6.4-1.2.1-.5-.3-2.3-.8-4.3-2.7-1.6-1.4-2.7-3.2-3-3.7-.3-.5 0-.8.2-1.1.3-.3.5-.5.8-.8.2-.3.3-.5.5-.8.2-.3.1-.6 0-.9-.1-.3-1.2-3-1.7-4.1-.4-1.1-.9-1-.9-1l-1 .1c-.3 0-.9.1-1.4.6-.5.5-1.9 1.8-1.9 4.5s2 5.2 2.2 5.5c.3.3 3.8 5.8 9.2 8.2 1.3.6 2.3.9 3.1 1.2 1.3.4 2.5.4 3.4.2 1-.1 3.2-1.3 3.6-2.6.5-1.3.5-2.4.3-2.6-.1-.3-.5-.4-1-.7z" fill="white"/>
    </svg>
    <h1>Open WhatsApp to chat with Tal</h1>
    <p class="subtitle">Tap the button below to start a conversation</p>
    <button id="cta" class="cta-button">Continue to WhatsApp</button>
    <div class="message-preview">
      <div class="message-preview-label">Your message will be:</div>
      <div id="messageText" class="message-preview-text">${safeMessageText}</div>
      <button id="copyBtn" class="copy-button">Copy message</button>
    </div>
    <div class="fallback">
      <a id="fallbackToggle" class="fallback-link">Having trouble? Tap here for help</a>
      <div id="fallbackInstructions" class="fallback-instructions">
        <p><strong>If WhatsApp doesn't open:</strong></p>
        <ol>
          <li>Tap the <strong>•••</strong> menu in the top right corner of X</li>
          <li>Select "<strong>Open in browser</strong>" or "<strong>Open in Safari/Chrome</strong>"</li>
          <li>Then tap "Continue to WhatsApp" again</li>
        </ol>
        <p style="margin-top: 10px;">Or <a href="${safeWaHttpsUrl}" target="_blank" rel="noopener" style="color: #25d366;">open WhatsApp directly</a></p>
      </div>
    </div>
    <div class="cid-tag">ref: ${safeCid}</div>
  </div>
  <script>
    (function() {
      var waDeepLink = "${safeWaDeepLinkUrl.replace(/"/g, '\\"')}";
      var waHttps = "${safeWaHttpsUrl.replace(/"/g, '\\"')}";
      var messageText = "${safeMessageText.replace(/"/g, '\\"')}";
      var ctaBtn = document.getElementById('cta');
      var copyBtn = document.getElementById('copyBtn');
      var fallbackToggle = document.getElementById('fallbackToggle');
      var fallbackInstructions = document.getElementById('fallbackInstructions');
      ctaBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = waDeepLink;
        setTimeout(function() { window.location.href = waHttps; }, 800);
      });
      copyBtn.addEventListener('click', function() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(messageText).then(function() {
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(function() { copyBtn.textContent = 'Copy message'; copyBtn.classList.remove('copied'); }, 2000);
          });
        }
      });
      fallbackToggle.addEventListener('click', function(e) {
        e.preventDefault();
        fallbackInstructions.classList.toggle('show');
      });
    })();
  </script>
</body>
</html>`;
}
