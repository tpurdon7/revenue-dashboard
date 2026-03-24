import 'server-only';

const HUBSPOT_SEARCH_URL = 'https://api.hubapi.com/crm/v3/objects/deals/search';
const HUBSPOT_OWNERS_URL = 'https://api.hubapi.com/crm/v3/owners';
const HUBSPOT_DEAL_PIPELINES_URL = 'https://api.hubapi.com/crm/v3/pipelines/deals';
const ROLLING_WINDOW_DAYS = 180;
const REQUIRED_PROPERTIES = [
  'amount',
  'closedate',
  'dealname',
  'hubspot_owner_id',
  'country',
  'region',
  'hs_country_region',
  'hs_lastmodifieddate'
] as const;
const OPEN_DEAL_REQUIRED_PROPERTIES = [
  'amount',
  'dealstage',
  'dealname',
  'createdate',
  'hubspot_owner_id',
  'country',
  'region',
  'hs_country_region',
  'hs_lastmodifieddate'
] as const;
const EXCLUDED_OWNER_NAME = 'bashar aboudaoud';
const INNOVATION_SERVICES_PIPELINE_LABEL = 'innovation services';
const PROPOSAL_STAGE_LABEL = 'proposal';
const CORPORATE_SIGN_OFF_STAGE_LABEL = 'corporate sign off';
const HUBSPOT_SEARCH_RETRY_DELAYS_MS = [350, 800, 1600];

type HubSpotDeal = {
  id: string;
  properties: Partial<Record<string, string | null>>;
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

type HubSpotPipelineStage = {
  id: string;
  label?: string;
  metadata?: {
    probability?: string;
  };
};

type HubSpotDealPipeline = {
  id: string;
  label?: string;
  stages?: HubSpotPipelineStage[];
};

type HubSpotDealPipelinesResponse = {
  results: HubSpotDealPipeline[];
};

export type Deal = {
  id: string;
  dealname: string;
  amount: number;
  closedate: string | null;
  country: string;
  region: string;
  lastUpdatedDate: string | null;
  hubspot_owner_id: string;
  ownerName: string;
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

export type OpenDealStageSummary = {
  label: string;
  totalValue: number;
  dealsCount: number;
};

export type FetchOpenDealsValueResult = {
  openDealValue: number;
  openDealsCount: number;
  pipelineDeals: PipelineDeal[];
  stages: OpenDealStageSummary[];
  startDateUsed: string;
  endDateUsed: string;
};

export type PipelineDeal = {
  id: string;
  dealname: string;
  amount: number;
  region: string;
  country: string;
  ownerName: string;
  lastUpdatedDate: string | null;
  status: 'Proposal' | 'Corporate Sign Off';
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchHubSpotJson<T>(input: RequestInfo | URL, init?: RequestInit, retryDelaysMs = HUBSPOT_SEARCH_RETRY_DELAYS_MS): Promise<T> {
  let attempt = 0;

  while (true) {
    const response = await fetch(input, init);

    if (response.ok) {
      return (await response.json()) as T;
    }

    const errorText = await response.text();
    const isRateLimited = response.status === 429;
    const delayMs = retryDelaysMs[attempt];

    if (isRateLimited && delayMs !== undefined) {
      await sleep(delayMs);
      attempt += 1;
      continue;
    }

    throw new Error(`HubSpot API error ${response.status}: ${errorText}`);
  }
}

function mapDeal(deal: HubSpotDeal): Deal {
  return {
    id: deal.id,
    dealname: deal.properties.dealname ?? 'Untitled Deal',
    amount: sanitizeAmount(deal.properties.amount),
    closedate: deal.properties.closedate ?? null,
    country: pickProperty(deal.properties, ['country']) ?? '',
    region: pickProperty(deal.properties, ['region', 'hs_country_region']) ?? '',
    lastUpdatedDate: deal.properties.hs_lastmodifieddate ?? null,
    hubspot_owner_id: deal.properties.hubspot_owner_id ?? '',
    ownerName: 'Unassigned'
  };
}

function pickProperty(
  properties: Partial<Record<string, string | null>>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = properties[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getStartAndEndTimestamps(startDate?: string, endDate?: string) {
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

  return {
    startMs,
    endMs,
    startDateUsed: toIsoFromMs(startMs),
    endDateUsed: toIsoFromMs(endMs)
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

function sortDealsByLastUpdatedDesc<T extends { lastUpdatedDate: string | null }>(deals: T[]): T[] {
  return [...deals].sort((a, b) => {
    const aTime = a.lastUpdatedDate ? new Date(a.lastUpdatedDate).getTime() : 0;
    const bTime = b.lastUpdatedDate ? new Date(b.lastUpdatedDate).getTime() : 0;
    return bTime - aTime;
  });
}

function sortPipelineDeals(deals: PipelineDeal[]): PipelineDeal[] {
  const statusOrder: Record<PipelineDeal['status'], number> = {
    'Corporate Sign Off': 0,
    Proposal: 1
  };

  return [...deals].sort((a, b) => {
    const statusDelta = statusOrder[a.status] - statusOrder[b.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }

    const aTime = a.lastUpdatedDate ? new Date(a.lastUpdatedDate).getTime() : 0;
    const bTime = b.lastUpdatedDate ? new Date(b.lastUpdatedDate).getTime() : 0;
    return bTime - aTime;
  });
}

function isExcludedOwner(owner: HubSpotOwner): boolean {
  const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim().toLowerCase();
  const email = normalizeText(owner.email);
  return fullName === EXCLUDED_OWNER_NAME || email.includes('bashar.aboudaoud');
}

type OwnersDirectory = {
  excludedOwnerIds: Set<string>;
  ownerNamesById: Map<string, string>;
};

function getOwnerDisplayName(owner: HubSpotOwner): string {
  const name = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
  if (name.length > 0) {
    return name;
  }

  if (owner.email) {
    return owner.email;
  }

  return 'Unassigned';
}

async function fetchOwnersDirectory(token: string): Promise<OwnersDirectory> {
  let after: string | undefined;
  const excludedOwnerIds = new Set<string>();
  const ownerNamesById = new Map<string, string>();

  while (true) {
    const search = new URLSearchParams({
      limit: '500',
      archived: 'false',
      ...(after ? { after } : {})
    });
    const payload = await fetchHubSpotJson<HubSpotOwnersResponse>(`${HUBSPOT_OWNERS_URL}?${search.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    payload.results.forEach((owner) => {
      ownerNamesById.set(owner.id, getOwnerDisplayName(owner));
      if (isExcludedOwner(owner)) {
        excludedOwnerIds.add(owner.id);
      }
    });

    after = payload.paging?.next?.after;
    if (!after) {
      break;
    }
  }

  return { excludedOwnerIds, ownerNamesById };
}

async function fetchDealPipelines(token: string): Promise<HubSpotDealPipeline[]> {
  const payload = await fetchHubSpotJson<HubSpotDealPipelinesResponse>(HUBSPOT_DEAL_PIPELINES_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
  return payload.results ?? [];
}

function getStageIdsByLabel(
  pipelines: HubSpotDealPipeline[],
  label: string,
  pipelineLabel?: string
): string[] {
  const normalizedLabel = normalizeText(label);
  const normalizedPipelineLabel = normalizeText(pipelineLabel);

  return pipelines.flatMap((pipeline) =>
    normalizeText(pipeline.label) === normalizedPipelineLabel || normalizedPipelineLabel.length === 0
      ? (pipeline.stages ?? [])
      .filter((stage) => normalizeText(stage.label) === normalizedLabel)
      .map((stage) => stage.id)
      : []
  );
}

async function fetchDealsInStageSince({
  token,
  stageId,
  startMs,
  endMs
}: {
  token: string;
  stageId: string;
  startMs: number;
  endMs: number;
}): Promise<HubSpotDeal[]> {
  let after: string | undefined;
  const deals: HubSpotDeal[] = [];

  while (true) {
    const payload = await fetchHubSpotJson<HubSpotSearchResponse>(HUBSPOT_SEARCH_URL, {
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
                propertyName: 'dealstage',
                operator: 'EQ',
                value: stageId
              },
              {
                propertyName: 'createdate',
                operator: 'GTE',
                value: String(startMs)
              },
              {
                propertyName: 'createdate',
                operator: 'LTE',
                value: String(endMs)
              }
            ]
          }
        ],
        properties: OPEN_DEAL_REQUIRED_PROPERTIES,
        sorts: ['-createdate'],
        limit: 100,
        ...(after ? { after } : {})
      }),
      cache: 'no-store'
    });
    deals.push(...payload.results);

    after = payload.paging?.next?.after;
    if (!after) {
      break;
    }
  }

  return deals;
}

function mapPipelineDeal(deal: HubSpotDeal, status: PipelineDeal['status'], ownerNamesById: Map<string, string>): PipelineDeal {
  const ownerId = deal.properties.hubspot_owner_id ?? '';

  return {
    id: deal.id,
    dealname: deal.properties.dealname ?? 'Untitled Deal',
    amount: sanitizeAmount(deal.properties.amount),
    region: pickProperty(deal.properties, ['region', 'hs_country_region']) ?? '',
    country: pickProperty(deal.properties, ['country']) ?? '',
    ownerName: ownerNamesById.get(ownerId) ?? 'Unassigned',
    lastUpdatedDate: deal.properties.hs_lastmodifieddate ?? null,
    status
  };
}

export async function fetchClosedWonRevenue({
  startDate,
  endDate
}: FetchClosedWonRevenueInput = {}): Promise<FetchClosedWonRevenueResult> {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    throw new Error('Missing HUBSPOT_PRIVATE_APP_TOKEN environment variable');
  }

  const { startMs, endMs, startDateUsed, endDateUsed } = getStartAndEndTimestamps(startDate, endDate);

  let after: string | undefined;
  const deals: Deal[] = [];
  const { excludedOwnerIds, ownerNamesById } = await fetchOwnersDirectory(token);

  while (true) {
    const payload = await fetchHubSpotJson<HubSpotSearchResponse>(HUBSPOT_SEARCH_URL, {
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
  const sortedDeals = sortDealsByCloseDateDesc(filteredDeals).map((deal) => ({
    ...deal,
    ownerName: ownerNamesById.get(deal.hubspot_owner_id) ?? 'Unassigned'
  }));
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

export async function fetchOpenDealsCurrentValue({
  startDate,
  endDate
}: FetchClosedWonRevenueInput = {}): Promise<FetchOpenDealsValueResult> {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    throw new Error('Missing HUBSPOT_PRIVATE_APP_TOKEN environment variable');
  }

  const { startMs, endMs, startDateUsed, endDateUsed } = getStartAndEndTimestamps(startDate, endDate);
  const pipelines = await fetchDealPipelines(token);
  const proposalStageIds = getStageIdsByLabel(
    pipelines,
    PROPOSAL_STAGE_LABEL,
    INNOVATION_SERVICES_PIPELINE_LABEL
  );
  const corporateSignOffStageIds = getStageIdsByLabel(
    pipelines,
    CORPORATE_SIGN_OFF_STAGE_LABEL,
    INNOVATION_SERVICES_PIPELINE_LABEL
  );
  const { ownerNamesById } = await fetchOwnersDirectory(token);

  const proposalDeals: HubSpotDeal[] = [];
  for (const stageId of proposalStageIds) {
    proposalDeals.push(...(await fetchDealsInStageSince({ token, stageId, startMs, endMs })));
  }

  const corporateDeals: HubSpotDeal[] = [];
  for (const stageId of corporateSignOffStageIds) {
    corporateDeals.push(...(await fetchDealsInStageSince({ token, stageId, startMs, endMs })));
  }

  const proposalValue = proposalDeals.reduce((sum, deal) => sum + sanitizeAmount(deal.properties.amount), 0);
  const corporateSignOffValue = corporateDeals.reduce((sum, deal) => sum + sanitizeAmount(deal.properties.amount), 0);
  const pipelineDeals = sortPipelineDeals([
    ...proposalDeals.map((deal) => mapPipelineDeal(deal, 'Proposal', ownerNamesById)),
    ...corporateDeals.map((deal) => mapPipelineDeal(deal, 'Corporate Sign Off', ownerNamesById))
  ]);

  console.info('[hubspot] open deals current value summary', {
    pipelineLabel: INNOVATION_SERVICES_PIPELINE_LABEL,
    proposalStageIds,
    corporateSignOffStageIds,
    proposalDealsCount: proposalDeals.length,
    corporateSignOffDealsCount: corporateDeals.length,
    proposalValue,
    corporateSignOffValue,
    startTimestampMs: startMs,
    endTimestampMs: endMs
  });

  return {
    openDealValue: proposalValue + corporateSignOffValue,
    openDealsCount: proposalDeals.length + corporateDeals.length,
    pipelineDeals,
    stages: [
      {
        label: 'Proposal',
        totalValue: proposalValue,
        dealsCount: proposalDeals.length
      },
      {
        label: 'Corporate Sign Off',
        totalValue: corporateSignOffValue,
        dealsCount: corporateDeals.length
      }
    ],
    startDateUsed,
    endDateUsed
  };
}
