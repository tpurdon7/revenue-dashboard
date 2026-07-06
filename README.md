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

- `startDate` in `YYYY-MM-DD` format (closed revenue is floored at `2025-12-31`; open pipeline defaults to `endDate - 180 days`)
- `endDate` ISO date string (default: closed won uses `2026-03-20`, open pipeline uses runtime `now`)

HubSpot filter logic:

- `dealstage EQ closedwon`
- `closedate GTE startDateMs`

Pagination uses HubSpot `after` cursor until all results are fetched.

## Time window used by default

- Closed revenue start: December 31, 2025
- Closed revenue end: March 20, 2026
- Open pipeline start: now minus 180 days
- Open pipeline end: runtime now

Dashboard closed revenue label shows `December 31, 2025 to March 20, 2026` by default.
