# Revenue to Goal Dashboard

Simple internal Next.js dashboard for Closed Won HubSpot revenue progress against a goal.

## Stack

- Next.js App Router
- Tailwind CSS
- Server-side HubSpot CRM Search API integration

## Requirements

- Node.js 20+
- HubSpot private app token with scope: `crm.objects.deals.read`

## Environment variables

Create `.env.local` in the project root:

```bash
HUBSPOT_PRIVATE_APP_TOKEN=your-private-app-token
REVENUE_GOAL=10000000
```

Notes:

- `REVENUE_GOAL` is optional and defaults to `10000000`.
- `HUBSPOT_PRIVATE_APP_TOKEN` is required.
- Token is used only in server code (`lib/hubspot.ts` and API route), never in browser code.

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

1. Import this project in Vercel.
2. In Project Settings -> Environment Variables, add:
   - `HUBSPOT_PRIVATE_APP_TOKEN`
   - `REVENUE_GOAL` (optional)
3. Deploy.

## API behavior

`GET /api/revenue`

Optional query params:

- `startDate` in `YYYY-MM-DD` format (default: `endDate - 180 days`)
- `endDate` ISO date string (default: runtime `now`)

HubSpot filter logic:

- `dealstage EQ closedwon`
- `closedate GTE startDateMs`

Pagination uses HubSpot `after` cursor until all results are fetched.

## Time window used by default

- Start: now minus 180 days
- End: runtime now

Dashboard label shows `Last 180 Days to Today` for clean display.
