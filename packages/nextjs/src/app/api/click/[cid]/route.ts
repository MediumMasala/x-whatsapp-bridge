/**
 * Admin API endpoint for retrieving click data
 * GET /api/click/:cid
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { validateAdminToken, getSecurityHeaders } from '@/lib/security';
import { isValidCid } from '@/lib/cid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const { cid } = params;
  const securityHeaders = getSecurityHeaders();

  const adminToken = request.headers.get('X-Admin-Token');
  if (!validateAdminToken(adminToken || undefined)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: securityHeaders }
    );
  }

  if (!isValidCid(cid)) {
    return NextResponse.json(
      { error: 'Invalid cid format' },
      { status: 400, headers: securityHeaders }
    );
  }

  try {
    const db = await getDatabase();
    const click = await db.getClickByCid(cid);

    if (!click) {
      return NextResponse.json(
        { error: 'Click not found' },
        { status: 404, headers: securityHeaders }
      );
    }

    return NextResponse.json(click, {
      status: 200,
      headers: {
        ...securityHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Failed to fetch click:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders }
    );
  }
}
