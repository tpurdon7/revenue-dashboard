import 'server-only';

const HUBSPOT_SEARCH_URL = 'https://api.hubapi.com/crm/v3/objects/deals/search';
const ROLLING_WINDOW_DAYS = 180;
const REQUIRED_PROPERTIES = ['amount', 'closedate', 'dealname'] as const;

type HubSpotDeal = {
  id: string;
  properties: Partial<Record<(typeof REQUIRED_PROPERTIES)[number], string | null>>;
};

type HubSpotSearchResponse = {
  results: HubSpotDeal[];
  paging?: {
    next?: {
      after: string;
    };
  };
};

export type Deal = {
  id: string;
  dealname: string;
  amount: number;
  closedate: string | null;
};

export type FetchClosedWonRevenueInput = {
  startDate?: string;
  endDate?: string;
};

export type FetchClosedWonRevenueResult = {
  totalRevenue: number;
  dealsCount: number;
  deals: Deal[];
  startDateUsed: string;
  endDateUsed: string;
};

function toIsoFromMs(value: number): string {
  if (Number.isNaN(value)) {
    throw new Error('Invalid timestamp');
  }
  return new Date(value).toISOString();
}

function sanitizeAmount(amount: string | null | undefined): number {
  if (!amount) {
    return 0;
  }

  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapDeal(deal: HubSpotDeal): Deal {
  return {
    id: deal.id,
    dealname: deal.properties.dealname ?? 'Untitled Deal',
    amount: sanitizeAmount(deal.properties.amount),
    closedate: deal.properties.closedate ?? null
  };
}

function sortDealsByCloseDateDesc(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) => {
    const aTime = a.closedate ? new Date(a.closedate).getTime() : 0;
    const bTime = b.closedate ? new Date(b.closedate).getTime() : 0;
    return bTime - aTime;
  });
}

export async function fetchClosedWonRevenue({
  startDate,
  endDate
}: FetchClosedWonRevenueInput = {}): Promise<FetchClosedWonRevenueResult> {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    throw new Error('Missing HUBSPOT_PRIVATE_APP_TOKEN environment variable');
  }

  const endMs = endDate ? new Date(endDate).getTime() : Date.now();
  if (Number.isNaN(endMs)) {
    throw new Error(`Invalid endDate: ${endDate}`);
  }
  const startMs = startDate
    ? new Date(startDate).getTime()
    : endMs - ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (Number.isNaN(startMs)) {
    throw new Error(`Invalid startDate: ${startDate}`);
  }
  if (startMs > endMs) {
    throw new Error('startDate must be before endDate');
  }
  const startDateUsed = toIsoFromMs(startMs);
  const endDateUsed = toIsoFromMs(endMs);

  let after: string | undefined;
  const deals: Deal[] = [];

  while (true) {
    const response = await fetch(HUBSPOT_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_is_closed_won',
                operator: 'EQ',
                value: 'true'
              },
              {
                propertyName: 'closedate',
                operator: 'GTE',
                value: String(startMs)
              }
            ]
          },
          {
            filters: [
              {
                propertyName: 'dealstage',
                operator: 'EQ',
                value: 'closedwon'
              },
              {
                propertyName: 'closedate',
                operator: 'GTE',
                value: String(startMs)
              }
            ]
          }
        ],
        properties: REQUIRED_PROPERTIES,
        sorts: ['-closedate'],
        limit: 100,
        ...(after ? { after } : {})
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HubSpot API error ${response.status}: ${errorText}`);
    }

    const payload = (await response.json()) as HubSpotSearchResponse;
    deals.push(...payload.results.map(mapDeal));

    after = payload.paging?.next?.after;
    if (!after) {
      break;
    }
  }

  const sortedDeals = sortDealsByCloseDateDesc(deals);
  const totalRevenue = sortedDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const closedateMs = sortedDeals
    .map((deal) => (deal.closedate ? new Date(deal.closedate).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value));
  const earliestClosedate =
    closedateMs.length > 0 ? new Date(Math.min(...closedateMs)).toISOString() : null;
  const latestClosedate =
    closedateMs.length > 0 ? new Date(Math.max(...closedateMs)).toISOString() : null;

  console.info('[hubspot] closed won summary', {
    totalDealsFetched: sortedDeals.length,
    totalRevenue,
    earliestClosedate,
    latestClosedate,
    startTimestampMs: startMs,
    endTimestampMs: endMs
  });

  return {
    totalRevenue,
    dealsCount: sortedDeals.length,
    deals: sortedDeals,
    startDateUsed,
    endDateUsed
  };
}
