/**
 * Admin API endpoint for retrieving click data
 * GET /api/click/:cid
 *
 * Protected by X-Admin-Token header
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDatabase,
  validateAdminToken,
  isValidCid,
  getSecurityHeaders,
} from '@x-whatsapp-bridge/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const { cid } = params;
  const securityHeaders = getSecurityHeaders();

  // Validate admin token
  const adminToken = request.headers.get('X-Admin-Token');
  if (!validateAdminToken(adminToken || undefined)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      {
        status: 401,
        headers: securityHeaders,
      }
    );
  }

  // Validate CID format
  if (!isValidCid(cid)) {
    return NextResponse.json(
      { error: 'Invalid cid format' },
      {
        status: 400,
        headers: securityHeaders,
      }
    );
  }

  try {
    // Fetch click from database
    const db = await getDatabase();
    const click = await db.getClickByCid(cid);

    if (!click) {
      return NextResponse.json(
        { error: 'Click not found' },
        {
          status: 404,
          headers: securityHeaders,
        }
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
      {
        status: 500,
        headers: securityHeaders,
      }
    );
  }
}
