'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Deal = {
  id: string;
  dealname: string;
  amount: number;
  closedate: string | null;
  region: string;
  country: string;
  ownerName: string;
  lastUpdatedDate: string | null;
};

type PipelineDeal = {
  id: string;
  dealname: string;
  amount: number;
  region: string;
  country: string;
  ownerName: string;
  lastUpdatedDate: string | null;
  status: 'Proposal' | 'Corporate Sign Off';
};

type RevenueResponse = {
  deals: Deal[];
  pipelineDeals: PipelineDeal[];
  startDateUsed: string;
  endDateUsed: string;
  closedRevenueStartDateUsed: string;
  closedRevenueEndDateUsed: string;
  openDealsStartDateUsed: string;
  openDealsEndDateUsed: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) {
    return '-';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function formatDateForFilename(isoDate: string | null): string {
  if (!isoDate) {
    return 'unknown-date';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'unknown-date';
  }

  return date.toISOString().slice(0, 10);
}

function getJanFirstReference(endDateUsed: string): Date | null {
  const endDate = new Date(endDateUsed);
  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  return new Date(Date.UTC(endDate.getUTCFullYear(), 0, 1));
}

function getCloseDatePositionLabel(closedate: string | null, endDateUsed: string): string {
  if (!closedate) {
    return '-';
  }

  const closeDate = new Date(closedate);
  const janFirst = getJanFirstReference(endDateUsed);
  if (Number.isNaN(closeDate.getTime()) || !janFirst) {
    return '-';
  }

  const referenceLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(janFirst);

  return closeDate.getTime() < janFirst.getTime() ? `Before ${referenceLabel}` : `On or after ${referenceLabel}`;
}

function buildRevenueUrl(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (startDate) {
    params.set('startDate', startDate);
  }
  if (endDate) {
    params.set('endDate', endDate);
  }

  const query = params.toString();
  return query.length > 0 ? `/api/revenue?${query}` : '/api/revenue';
}

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  if (typeof window === 'undefined') {
    return;
  }

  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: PipelineDeal['status'] }) {
  const className =
    status === 'Corporate Sign Off'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-sky-100 text-sky-800 border-sky-200';

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${className}`}>
      {status}
    </span>
  );
}

export default function DealsPageClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const revenueUrl = useMemo(() => buildRevenueUrl(searchParams), [searchParams]);
  const closedWonCsvFilename = useMemo(() => {
    if (!data) {
      return 'closed-won-deals.csv';
    }

    return `closed-won-deals-${formatDateForFilename(data.closedRevenueStartDateUsed)}-to-${formatDateForFilename(data.closedRevenueEndDateUsed)}.csv`;
  }, [data]);
  const pipelineCsvFilename = useMemo(() => {
    if (!data) {
      return 'pipeline-deals.csv';
    }

    return `pipeline-deals-${formatDateForFilename(data.openDealsStartDateUsed)}-to-${formatDateForFilename(data.openDealsEndDateUsed)}.csv`;
  }, [data]);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(revenueUrl, {
        cache: 'no-store'
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to fetch deals');
      }

      const payload = (await response.json()) as RevenueResponse;
      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [revenueUrl]);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  const exportClosedWonCsv = useCallback(() => {
    if (!data) {
      return;
    }

    downloadCsv(
      closedWonCsvFilename,
      ['Deal Name', 'Region', 'Country', 'Contract Value', 'Deal Owner', 'Close Date Before or After January 1st'],
      data.deals.map((deal) => [
        deal.dealname || 'Untitled Deal',
        deal.region || '',
        deal.country || '',
        deal.amount,
        deal.ownerName || 'Unassigned',
        getCloseDatePositionLabel(deal.closedate, data.endDateUsed)
      ])
    );
  }, [closedWonCsvFilename, data]);

  const exportPipelineCsv = useCallback(() => {
    if (!data) {
      return;
    }

    downloadCsv(
      pipelineCsvFilename,
      ['Deal Name', 'Region', 'Country', 'Contract Value', 'Deal Owner', 'Last Updated Date', 'Status'],
      data.pipelineDeals.map((deal) => [
        deal.dealname || 'Untitled Deal',
        deal.region || '',
        deal.country || '',
        deal.amount,
        deal.ownerName || 'Unassigned',
        formatDate(deal.lastUpdatedDate),
        deal.status
      ])
    );
  }, [data, pipelineCsvFilename]);

  return (
    <main className="min-h-screen bg-[#faf7f4] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--brand-orange)]">Brinc Revenue</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--brand-ink)] sm:text-5xl">Deal Tables</h1>
            <p className="mt-3 max-w-3xl text-sm text-[var(--brand-muted)] sm:text-base">
              Uses the same `startDate` and `endDate` query settings as the main dashboard. Default window remains the last 180 days.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)]"
            >
              Back to dashboard
            </Link>
            <Link
              href="/report"
              className="rounded-full border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)]"
            >
              Product suite
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-[var(--brand-line)] bg-white p-5 shadow-[0_16px_40px_rgba(15,17,21,0.06)] sm:p-6">
          <div className="flex flex-wrap gap-6 text-sm text-[var(--brand-muted)]">
            <p>
              Closed won window:{' '}
              <span className="font-semibold text-[var(--brand-ink)]">
                {data
                  ? `${formatDate(data.closedRevenueStartDateUsed)} to ${formatDate(data.closedRevenueEndDateUsed)}`
                  : 'Loading...'}
              </span>
            </p>
            <p>
              Pipeline window:{' '}
              <span className="font-semibold text-[var(--brand-ink)]">
                {data ? `${formatDate(data.openDealsStartDateUsed)} to ${formatDate(data.openDealsEndDateUsed)}` : 'Loading...'}
              </span>
            </p>
            <p>
              Closed won deals:{' '}
              <span className="font-semibold text-[var(--brand-ink)]">{data?.deals.length ?? 0}</span>
            </p>
            <p>
              Pipeline deals:{' '}
              <span className="font-semibold text-[var(--brand-ink)]">{data?.pipelineDeals.length ?? 0}</span>
            </p>
          </div>

          {error ? <p className="mt-4 text-sm text-red-700">Could not load deals: {error}</p> : null}
        </section>

        <section className="mt-6 rounded-3xl border border-[var(--brand-line)] bg-white p-5 shadow-[0_16px_40px_rgba(15,17,21,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-orange)]">Closed Won</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--brand-ink)]">Deals in Closed Won</h2>
            </div>
            <button
              type="button"
              onClick={exportClosedWonCsv}
              disabled={!data || loading}
              className="rounded-full border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--brand-line)] text-left text-[11px] uppercase tracking-[0.14em] text-[var(--brand-muted)] sm:text-xs">
                  <th className="px-2 py-3 font-bold">Deal Name</th>
                  <th className="px-2 py-3 font-bold">Region</th>
                  <th className="px-2 py-3 font-bold">Country</th>
                  <th className="px-2 py-3 text-right font-bold">Contract Value</th>
                  <th className="px-2 py-3 font-bold">Deal Owner</th>
                  <th className="px-2 py-3 font-bold">Close Date vs Jan 1</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-10 text-center text-sm text-[var(--brand-muted)]">
                      Loading closed won deals...
                    </td>
                  </tr>
                ) : data?.deals.length ? (
                  data.deals.map((deal) => (
                    <tr key={deal.id} className="border-b border-[#efefef] text-sm last:border-b-0">
                      <td className="px-2 py-3.5 font-medium text-[var(--brand-ink)]">{deal.dealname || 'Untitled Deal'}</td>
                      <td className="px-2 py-3.5 text-[var(--brand-muted)]">{deal.region || '-'}</td>
                      <td className="px-2 py-3.5 text-[var(--brand-muted)]">{deal.country || '-'}</td>
                      <td className="px-2 py-3.5 text-right font-medium text-[var(--brand-ink)]">{formatCurrency(deal.amount)}</td>
                      <td className="px-2 py-3.5 text-[var(--brand-muted)]">{deal.ownerName || 'Unassigned'}</td>
                      <td className="px-2 py-3.5 text-[var(--brand-muted)]">{getCloseDatePositionLabel(deal.closedate, data.endDateUsed)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-2 py-10 text-center text-sm text-[var(--brand-muted)]">
                      No closed won deals found for this time window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[var(--brand-line)] bg-white p-5 shadow-[0_16px_40px_rgba(15,17,21,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-orange)]">Pipeline</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--brand-ink)]">Deals in Corporate Sign Off or Proposal</h2>
            </div>
            <button
              type="button"
              onClick={exportPipelineCsv}
              disabled={!data || loading}
              className="rounded-full border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--brand-line)] text-left text-[11px] uppercase tracking-[0.14em] text-[var(--brand-muted)] sm:text-xs">
                  <th className="px-2 py-3 font-bold">Deal Name</th>
                  <th className="px-2 py-3 font-bold">Region</th>
                  <th className="px-2 py-3 font-bold">Country</th>
                  <th className="px-2 py-3 text-right font-bold">Contract Value</th>
                  <th className="px-2 py-3 font-bold">Deal Owner</th>
                  <th className="px-2 py-3 font-bold">Last Updated Date</th>
                  <th className="px-2 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-10 text-center text-sm text-[var(--brand-muted)]">
                      Loading pipeline deals...
                    </td>
                  </tr>
                ) : data?.pipelineDeals.length ? (
                  data.pipelineDeals.map((deal) => (
                    <tr key={deal.id} className="border-b border-[#efefef] text-sm last:border-b-0">
                      <td className="px-2 py-3.5 font-medium text-[var(--brand-ink)]">{deal.dealname || 'Untitled Deal'}</td>
                      <td className="px-2 py-3.5 text-[var(--brand-muted)]">{deal.region || '-'}</td>
                      <td className="px-2 py-3.5 text-[var(--brand-muted)]">{deal.country || '-'}</td>
                      <td className="px-2 py-3.5 text-right font-medium text-[var(--brand-ink)]">{formatCurrency(deal.amount)}</td>
                      <td className="px-2 py-3.5 text-[var(--brand-muted)]">{deal.ownerName || 'Unassigned'}</td>
                      <td className="px-2 py-3.5 text-[var(--brand-muted)]">{formatDate(deal.lastUpdatedDate)}</td>
                      <td className="px-2 py-3.5">
                        <StatusBadge status={deal.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-2 py-10 text-center text-sm text-[var(--brand-muted)]">
                      No proposal or corporate sign off deals found for this time window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
