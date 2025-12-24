/**
 * Landing page route handler for /x/:slug
 * This is the main X ad destination URL
 *
 * Flow:
 * 1. Extract query params (text, UTMs, twclid, etc.)
 * 2. Generate unique click ID (cid)
 * 3. Store click record in database
 * 4. Render landing page HTML
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateCid,
  getSlugConfig,
  getEnvConfig,
  generateWhatsAppUrls,
  generateLandingPageHtml,
  getSecurityHeaders,
  getDatabase,
  createClickRecord,
  hashIp,
  extractClientIp,
  type LandingPageData,
} from '@x-whatsapp-bridge/shared';
import '@/lib/config'; // Initialize configs on import

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const searchParams = request.nextUrl.searchParams;

  // Get environment config
  const envConfig = getEnvConfig();

  if (!envConfig.WHATSAPP_NUMBER) {
    return new NextResponse('Server configuration error: WHATSAPP_NUMBER not set', {
      status: 500,
    });
  }

  // Get slug configuration
  const slugConfig = getSlugConfig(slug);

  // Extract query parameters
  const textOverride = searchParams.get('text');
  const twclid = searchParams.get('twclid');
  const utm_source = searchParams.get('utm_source');
  const utm_medium = searchParams.get('utm_medium');
  const utm_campaign = searchParams.get('utm_campaign') || slugConfig.defaultUtmCampaign;
  const utm_content = searchParams.get('utm_content');

  // Generate click ID
  const cid = generateCid();

  // Determine message text
  const baseText = textOverride || slugConfig.baseText;

  // Determine phone number
  const phoneNumber = slugConfig.phoneOverride || envConfig.WHATSAPP_NUMBER;

  // Generate WhatsApp URLs
  const { messageText, httpsUrl, deepLinkUrl } = generateWhatsAppUrls(
    phoneNumber,
    baseText,
    cid
  );

  // Extract and hash client IP
  const headers: Record<string, string | string[] | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const clientIp = extractClientIp(headers);
  const ipHash = hashIp(clientIp);

  // Create click record
  const clickRecord = createClickRecord(cid, slug, {
    twclid: twclid || undefined,
    utm_source: utm_source || undefined,
    utm_medium: utm_medium || undefined,
    utm_campaign: utm_campaign || undefined,
    utm_content: utm_content || undefined,
    user_agent: request.headers.get('user-agent') || undefined,
    referer: request.headers.get('referer') || undefined,
    ip_hash: ipHash,
  });

  // Store in database (non-blocking, don't fail the request)
  try {
    const db = await getDatabase();
    await db.insertClick(clickRecord);
  } catch (err) {
    console.error('Failed to store click:', err);
    // Continue - don't fail the page render
  }

  // Prepare landing page data
  const pageData: LandingPageData = {
    cid,
    slug,
    phoneNumber,
    messageText,
    waHttpsUrl: httpsUrl,
    waDeepLinkUrl: deepLinkUrl,
  };

  // Generate HTML
  const html = generateLandingPageHtml(pageData);

  // Return response with security headers
  const securityHeaders = getSecurityHeaders();

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...securityHeaders,
    },
  });
}
