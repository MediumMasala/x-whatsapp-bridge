/**
 * Health check endpoint
 * GET /api/healthz
 */

import { NextResponse } from 'next/server';
import { getEnvConfig, validateEnvConfig } from '@/lib/slug-config';

export const runtime = 'nodejs';

export async function GET() {
  const config = getEnvConfig();
  const errors = validateEnvConfig(config);

  const status = errors.length === 0 ? 'healthy' : 'degraded';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...(errors.length > 0 ? { warnings: errors } : {}),
    },
    {
      status: status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
