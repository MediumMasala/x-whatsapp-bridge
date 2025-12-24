/**
 * Express server for X → WhatsApp Bridge
 * Deployable to Render, Fly.io, or any Node.js hosting
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import {
  generateCid,
  getSlugConfig,
  getEnvConfig,
  validateEnvConfig,
  loadSlugConfigs,
  generateWhatsAppUrls,
  generateLandingPageHtml,
  getSecurityHeaders,
  getDatabase,
  createClickRecord,
  hashIp,
  extractClientIp,
  validateAdminToken,
  isValidCid,
  type LandingPageData,
  type SlugConfigMap,
} from '@x-whatsapp-bridge/shared';
import slugConfigs from '../../../config/slugs.json';

// Initialize configurations
loadSlugConfigs(slugConfigs as SlugConfigMap);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate IP detection (needed for Render/Fly.io)
app.set('trust proxy', true);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  })
);

// Disable x-powered-by header
app.disable('x-powered-by');

// JSON parsing for API endpoints
app.use(express.json());

/**
 * Health check endpoint
 * GET /healthz
 */
app.get('/healthz', (_req: Request, res: Response) => {
  const config = getEnvConfig();
  const errors = validateEnvConfig(config);

  const status = errors.length === 0 ? 'healthy' : 'degraded';

  res.status(status === 'healthy' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    ...(errors.length > 0 ? { warnings: errors } : {}),
  });
});

/**
 * Landing page route
 * GET /x/:slug
 */
app.get('/x/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const query = req.query as Record<string, string | undefined>;

  // Get environment config
  const envConfig = getEnvConfig();

  if (!envConfig.WHATSAPP_NUMBER) {
    console.error('WHATSAPP_NUMBER not set');
    return res.status(500).send('Server configuration error');
  }

  // Get slug configuration
  const slugConfig = getSlugConfig(slug);

  // Extract query parameters
  const textOverride = query.text;
  const twclid = query.twclid;
  const utm_source = query.utm_source;
  const utm_medium = query.utm_medium;
  const utm_campaign = query.utm_campaign || slugConfig.defaultUtmCampaign;
  const utm_content = query.utm_content;

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
  for (const [key, value] of Object.entries(req.headers)) {
    headers[key] = value;
  }
  const clientIp = extractClientIp(headers);
  const ipHash = hashIp(clientIp);

  // Create click record
  const clickRecord = createClickRecord(cid, slug, {
    twclid: twclid || undefined,
    utm_source: utm_source || undefined,
    utm_medium: utm_medium || undefined,
    utm_campaign: utm_campaign || undefined,
    utm_content: utm_content || undefined,
    user_agent: req.headers['user-agent'] || undefined,
    referer: req.headers['referer'] || undefined,
    ip_hash: ipHash,
  });

  // Store in database (non-blocking)
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

  // Set headers and send response
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.setHeader(key, value);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  res.send(html);
});

/**
 * Admin API: Get click by CID
 * GET /api/click/:cid
 */
app.get('/api/click/:cid', async (req: Request, res: Response) => {
  const { cid } = req.params;
  const securityHeaders = getSecurityHeaders();

  // Set security headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.setHeader(key, value);
  }

  // Validate admin token
  const adminToken = req.headers['x-admin-token'] as string | undefined;
  if (!validateAdminToken(adminToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate CID format
  if (!isValidCid(cid)) {
    return res.status(400).json({ error: 'Invalid cid format' });
  }

  try {
    // Fetch click from database
    const db = await getDatabase();
    const click = await db.getClickByCid(cid);

    if (!click) {
      return res.status(404).json({ error: 'Click not found' });
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(click);
  } catch (err) {
    console.error('Failed to fetch click:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Root route - simple info page
 */
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>X → WhatsApp Bridge</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 400px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 16px;
          color: #1a1a1a;
        }
        p {
          color: #666;
          font-size: 14px;
        }
        .footer {
          color: #999;
          font-size: 12px;
          margin-top: 24px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>X → WhatsApp Bridge</h1>
        <p>This service handles X/Twitter ad redirects to WhatsApp.</p>
        <p class="footer">For TAL</p>
      </div>
    </body>
    </html>
  `);
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    // Initialize database
    const db = await getDatabase();
    console.log('Database initialized');

    // Validate config
    const config = getEnvConfig();
    const errors = validateEnvConfig(config);
    if (errors.length > 0) {
      console.warn('Configuration warnings:', errors);
    }

    app.listen(PORT, () => {
      console.log(`Express server running on port ${PORT}`);
      console.log(`Landing page: http://localhost:${PORT}/x/default`);
      console.log(`Health check: http://localhost:${PORT}/healthz`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  const { closeDatabase } = await import('@x-whatsapp-bridge/shared');
  await closeDatabase();
  process.exit(0);
});
