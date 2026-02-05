# Ingram Micro Pricing Tool

Real-time Price & Availability lookup using the Ingram Micro Reseller API v6.

## Architecture

```
Browser (React UI)  →  Vercel Serverless Functions  →  Ingram Micro API
                         (credentials stay here)
```

- **Frontend**: React + Vite (static build)
- **Backend**: Vercel Serverless Functions (`/api/*`)
- **Auth**: OAuth2 client_credentials flow (server-side)
- **API Credentials**: Stored as environment variables (never exposed to browser)

## Quick Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ingram-pricing.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework: **Vite** (should auto-detect)
4. Click **Deploy**

### 3. Set Environment Variables

In your Vercel project dashboard: **Settings → Environment Variables**

| Variable | Required | Description |
|---|---|---|
| `INGRAM_CLIENT_ID` | ✅ | Your Ingram Micro API Client ID |
| `INGRAM_CLIENT_SECRET` | ✅ | Your Ingram Micro API Client Secret |
| `INGRAM_CUSTOMER_NUMBER` | ✅ | Your Ingram Micro customer number |
| `INGRAM_COUNTRY_CODE` | | Country code (default: `US`) |
| `INGRAM_SENDER_ID` | | Your company identifier |
| `INGRAM_USE_SANDBOX` | | Set to `true` for sandbox (default: `true`) |

After setting variables, **redeploy** (Deployments → Redeploy).

## Local Development

```bash
# Install dependencies
npm install

# Create .env file from example
cp .env.example .env
# Edit .env with your credentials

# Run dev server (frontend on :5173)
npm run dev
```

For local API routes, install the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

This runs both the frontend and serverless functions locally.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | GET | Health check + config verification |
| `/api/auth` | POST | Get OAuth2 access token |
| `/api/pricing` | POST | Fetch price & availability |

### POST /api/pricing

```json
{
  "accessToken": "your-token",
  "products": [
    { "ingramPartNumber": "4A0036" },
    { "vendorPartNumber": "E2016HV" }
  ]
}
```

Response includes pricing, availability by warehouse, discounts, and product details.

## Project Structure

```
├── api/                    # Vercel Serverless Functions
│   ├── auth.js             # OAuth2 token endpoint
│   ├── pricing.js          # Price & Availability proxy
│   └── status.js           # Health check
├── src/
│   ├── components/
│   │   ├── PartInput.jsx   # Part number entry + CSV import
│   │   ├── ResultsTable.jsx# Pricing results with warehouse detail
│   │   └── StatusBar.jsx   # Connection status indicator
│   ├── lib/
│   │   ├── api.js          # Frontend API client (portable)
│   │   └── csv.js          # CSV parser + exporter
│   ├── App.jsx             # Main application
│   ├── index.css           # Design system
│   └── main.jsx            # Entry point
├── vercel.json             # Vercel config
├── vite.config.js          # Vite config with API proxy
└── package.json
```

## Integration Notes

When integrating into your dashboard:

- **`src/lib/api.js`** — Drop-in API client. Change the base URL if your dashboard proxy differs.
- **`src/lib/csv.js`** — Standalone CSV parser/exporter, no dependencies.
- **`api/*.js`** — Serverless functions can be moved to any Express/Node backend.
- **Components** — `PartInput` and `ResultsTable` are self-contained and accept props.

## Features

- CSV/TSV file import with auto-header detection
- Manual part entry (Ingram or Vendor part numbers)
- Auto-batching (50 products per API request)
- Expandable warehouse-level availability detail
- Backorder ETA information
- Special pricing / government discount display
- CSV export of results
- Sandbox/Production toggle via environment variable
