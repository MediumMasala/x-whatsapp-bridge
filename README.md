# X → WhatsApp Bridge

A production-ready web service that bridges X/Twitter ads to WhatsApp conversations for TAL.

## Problem

X/Twitter's in-app browser often blocks automatic `whatsapp://` deep link redirects. This service provides an HTTPS landing page that:

1. Captures X click ID (`twclid`) + UTM parameters for attribution
2. Generates a unique click ID (`cid`) embedded in the WhatsApp message
3. Uses a **user tap** to reliably open WhatsApp (with fallbacks)

## Features

- **Two implementations**: Next.js (Vercel) and Express (Render/Fly.io)
- **SQLite** for local development, **PostgreSQL** for production
- **Mobile-first** landing page optimized for in-app browsers
- **Attribution tracking**: Links `twclid` (X click ID) with `cid` (our click ID)
- **Security**: CSP headers, IP hashing, input validation, no open redirects
- **Configurable**: Slug-based message/phone customization via JSON config

## Project Structure

```
x-whatsapp-bridge/
├── config/
│   └── slugs.json          # Slug configurations
├── packages/
│   ├── shared/             # Shared utilities (cid, URLs, DB, security)
│   ├── nextjs/             # Next.js App Router implementation
│   └── express/            # Express server implementation
├── package.json            # Monorepo root
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

```bash
cd x-whatsapp-bridge
npm install
```

### Environment Variables

Create a `.env` file in the root (or set in your deployment platform):

```env
# Required
WHATSAPP_NUMBER=919876543210      # E.164 format WITHOUT + prefix

# Optional
DATABASE_URL=postgresql://...     # Postgres connection (production)
ADMIN_TOKEN=your-secret-token     # For /api/click/:cid endpoint
IP_HASH_SALT=your-random-salt     # Salt for IP hashing
```

### Run Locally

**Next.js (port 3000):**
```bash
npm run dev:nextjs
```

**Express (port 3001):**
```bash
npm run dev:express
```

### Test the Landing Page

Visit: http://localhost:3000/x/default (Next.js) or http://localhost:3001/x/default (Express)

## Routes

### `GET /x/:slug`

The main landing page for X ad destinations.

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `text` | Override the default message text |
| `twclid` | X/Twitter click ID (auto-populated by X) |
| `utm_source` | UTM source |
| `utm_medium` | UTM medium |
| `utm_campaign` | UTM campaign |
| `utm_content` | UTM content |

**Example X Ad Destination URL:**
```
https://your-domain.com/x/pune?utm_source=twitter&utm_medium=paid&utm_campaign=pune-launch
```

### `GET /api/click/:cid`

Retrieve click data for attribution analysis (protected).

**Headers:**
```
X-Admin-Token: your-secret-token
```

**Response:**
```json
{
  "id": 1,
  "cid": "ABC123DEF0",
  "slug": "pune",
  "created_at": "2024-01-15T10:30:00.000Z",
  "twclid": "tw_click_abc123",
  "utm_source": "twitter",
  "utm_medium": "paid",
  "utm_campaign": "pune-launch",
  "utm_content": null,
  "user_agent": "Mozilla/5.0...",
  "referer": "https://twitter.com",
  "ip_hash": "a1b2c3..."
}
```

### `GET /healthz`

Health check endpoint for monitoring.

## Slug Configuration

Edit `config/slugs.json` to customize behavior per slug:

```json
{
  "default": {
    "slug": "default",
    "baseText": "Hi Tal",
    "defaultUtmCampaign": "x-general"
  },
  "pune": {
    "slug": "pune",
    "baseText": "Hi Tal",
    "phoneOverride": "919999999999",
    "defaultUtmCampaign": "x-pune"
  },
  "chennai": {
    "slug": "chennai",
    "baseText": "Hi Tal",
    "defaultUtmCampaign": "x-chennai"
  }
}
```

**Fields:**
- `slug`: URL slug (must match key)
- `baseText`: Default message text
- `phoneOverride`: (optional) Override the default WhatsApp number
- `defaultUtmCampaign`: (optional) Default UTM campaign if not provided in URL

## Deployment

### Vercel (Next.js)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables:
   - `WHATSAPP_NUMBER`
   - `DATABASE_URL` (Vercel Postgres or external)
   - `ADMIN_TOKEN`
   - `IP_HASH_SALT`
4. Deploy

### Render (Express)

1. Create a new Web Service
2. Connect your GitHub repo
3. Set:
   - **Build Command**: `npm install && npm run build:express`
   - **Start Command**: `npm run start:express`
4. Add environment variables
5. Deploy

### Fly.io (Express)

1. Install `flyctl`
2. Create `fly.toml` in `packages/express/`:
   ```toml
   app = "your-app-name"
   primary_region = "bom"

   [build]
     builder = "heroku/buildpacks:20"

   [env]
     PORT = "8080"

   [http_service]
     internal_port = 8080
     force_https = true
   ```
3. Deploy:
   ```bash
   cd packages/express
   fly deploy
   fly secrets set WHATSAPP_NUMBER=919876543210
   fly secrets set DATABASE_URL=postgres://...
   fly secrets set ADMIN_TOKEN=your-token
   ```

## Using in X Ads

### Destination URL Format

```
https://your-domain.com/x/{slug}?utm_source=twitter&utm_medium=paid&utm_campaign={campaign}
```

### Examples

**Default landing:**
```
https://wa-bridge.vercel.app/x/default
```

**Pune campaign with custom text:**
```
https://wa-bridge.vercel.app/x/pune?utm_campaign=pune-diwali&text=Hi%20from%20Pune!
```

**Full tracking:**
```
https://wa-bridge.vercel.app/x/chennai?utm_source=twitter&utm_medium=paid&utm_campaign=chennai-launch&utm_content=ad_v1
```

## Attribution Analysis

### Joining twclid with cid

When a user sends a WhatsApp message, the `cid` is embedded:
```
Hi Tal (cid:ABC123DEF0)
```

Query your database to join with X's click data:

```sql
SELECT
  cid,
  twclid,
  utm_campaign,
  created_at,
  user_agent
FROM clicks
WHERE twclid IS NOT NULL
ORDER BY created_at DESC;
```

### Export for X Ads Attribution

Use the admin API to fetch click data:

```bash
curl -H "X-Admin-Token: your-token" \
  https://your-domain.com/api/click/ABC123DEF0
```

## How It Works

### Flow Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   X Ad      │────▶│  Landing Page   │────▶│  WhatsApp   │
│  (twclid)   │     │  /x/:slug       │     │  (cid)      │
└─────────────┘     └─────────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │   Database      │
                    │ (clicks table)  │
                    └─────────────────┘
```

### Client-Side Behavior

1. User taps "Continue to WhatsApp" button
2. JavaScript attempts `whatsapp://send?phone=...` deep link
3. After 800ms, falls back to `https://wa.me/...` universal link
4. If neither works, user can:
   - Copy the message manually
   - Open in external browser via instructions

## Testing

Run unit tests:

```bash
npm test
```

Tests cover:
- CID generation and validation
- WhatsApp URL encoding
- Slug config parsing
- Database operations (in-memory)

## Security

- **No raw IP storage**: IPs are SHA256 hashed with salt
- **No open redirects**: Only WhatsApp URLs are generated
- **Input validation**: Phone numbers, text length, CID format
- **CSP headers**: Prevent XSS and clickjacking
- **Admin token**: Protected API access

## License

MIT - TAL

---

Built with care for reliable X → WhatsApp attribution.
