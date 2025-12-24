/**
 * Landing page route handler for /x/:slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCid } from '@/lib/cid';
import { getSlugConfig, getEnvConfig } from '@/lib/slug-config';
import { generateWhatsAppUrls } from '@/lib/whatsapp';
import { generateLandingPageHtml } from '@/lib/landing-page';
import { getSecurityHeaders, hashIp, extractClientIp } from '@/lib/security';
import { getDatabase, createClickRecord } from '@/lib/database';
import type { LandingPageData } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const searchParams = request.nextUrl.searchParams;

  const envConfig = getEnvConfig();

  if (!envConfig.WHATSAPP_NUMBER) {
    return new NextResponse('Server configuration error: WHATSAPP_NUMBER not set', {
      status: 500,
    });
  }

  const slugConfig = getSlugConfig(slug);

  const textOverride = searchParams.get('text');
  const twclid = searchParams.get('twclid');
  const utm_source = searchParams.get('utm_source');
  const utm_medium = searchParams.get('utm_medium');
  const utm_campaign = searchParams.get('utm_campaign') || slugConfig.defaultUtmCampaign;
  const utm_content = searchParams.get('utm_content');

  const cid = generateCid();
  const baseText = textOverride || slugConfig.baseText;
  const phoneNumber = slugConfig.phoneOverride || envConfig.WHATSAPP_NUMBER;

  const { messageText, httpsUrl, deepLinkUrl } = generateWhatsAppUrls(
    phoneNumber,
    baseText,
    cid
  );

  const headers: Record<string, string | string[] | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const clientIp = extractClientIp(headers);
  const ipHash = hashIp(clientIp);

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

  try {
    const db = await getDatabase();
    await db.insertClick(clickRecord);
  } catch (err) {
    console.error('Failed to store click:', err);
  }

  const pageData: LandingPageData = {
    cid,
    slug,
    phoneNumber,
    messageText,
    waHttpsUrl: httpsUrl,
    waDeepLinkUrl: deepLinkUrl,
  };

  const html = generateLandingPageHtml(pageData);
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
