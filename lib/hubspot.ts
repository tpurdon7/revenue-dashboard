import 'server-only';

const HUBSPOT_SEARCH_URL = 'https://api.hubapi.com/crm/v3/objects/deals/search';
const HUBSPOT_OWNERS_URL = 'https://api.hubapi.com/crm/v3/owners';
const ROLLING_WINDOW_DAYS = 180;
const REQUIRED_PROPERTIES = ['amount', 'closedate', 'dealname', 'hubspot_owner_id'] as const;
const EXCLUDED_OWNER_NAME = 'bashar aboudaoud';

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

type HubSpotOwner = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type HubSpotOwnersResponse = {
  results: HubSpotOwner[];
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
  hubspot_owner_id: string;
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
    closedate: deal.properties.closedate ?? null,
    hubspot_owner_id: deal.properties.hubspot_owner_id ?? ''
  };
}

function sortDealsByCloseDateDesc(deals: Deal[]): Deal[] {
  return [...deals].sort((a, b) => {
    const aTime = a.closedate ? new Date(a.closedate).getTime() : 0;
    const bTime = b.closedate ? new Date(b.closedate).getTime() : 0;
    return bTime - aTime;
  });
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isExcludedOwner(owner: HubSpotOwner): boolean {
  const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim().toLowerCase();
  const email = normalizeText(owner.email);
  return fullName === EXCLUDED_OWNER_NAME || email.includes('bashar.aboudaoud');
}

async function fetchExcludedOwnerIds(token: string): Promise<Set<string>> {
  let after: string | undefined;
  const excluded = new Set<string>();

  while (true) {
    const search = new URLSearchParams({
      limit: '500',
      archived: 'false',
      ...(after ? { after } : {})
    });
    const response = await fetch(`${HUBSPOT_OWNERS_URL}?${search.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HubSpot Owners API error ${response.status}: ${errorText}`);
    }

    const payload = (await response.json()) as HubSpotOwnersResponse;
    payload.results.forEach((owner) => {
      if (isExcludedOwner(owner)) {
        excluded.add(owner.id);
      }
    });

    after = payload.paging?.next?.after;
    if (!after) {
      break;
    }
  }

  return excluded;
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
  const excludedOwnerIds = await fetchExcludedOwnerIds(token);

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

  const filteredDeals = deals.filter((deal) => {
    const ownerId = normalizeText(deal.hubspot_owner_id);
    const byOwner = ownerId.length > 0 && excludedOwnerIds.has(ownerId);
    const byName = normalizeText(deal.dealname).includes(EXCLUDED_OWNER_NAME);
    return !byOwner && !byName;
  });
  const excludedDealsCount = deals.length - filteredDeals.length;
  const sortedDeals = sortDealsByCloseDateDesc(filteredDeals);
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
    excludedDealsCount,
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
