'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Deal = {
  id: string;
  dealname: string;
  amount: number;
  closedate: string | null;
};

type RevenueResponse = {
  totalRevenue: number;
  dealsCount: number;
  deals: Deal[];
  startDateUsed: string;
  endDateUsed: string;
  goal: number;
  progress: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatCompactMillions(amount: number): string {
  return `$${(amount / 1_000_000).toFixed(2)}M`;
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

export default function HomePage() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRevenue = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/revenue', {
        cache: 'no-store'
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to fetch revenue');
      }

      const payload = (await response.json()) as RevenueResponse;
      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRevenue();
  }, [loadRevenue]);

  const recentDeals = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.deals.slice(0, 20);
  }, [data]);

  const progressPct = Math.round((data?.progress ?? 0) * 100);
  const tickerDeals =
    data?.deals.slice(0, 40).map((deal) => `${deal.dealname || 'Untitled Deal'} ${formatCurrency(deal.amount)}`) ??
    [];
  const tickerItems =
    tickerDeals.length > 0
      ? tickerDeals
      : ['Loading deals...', 'Loading deals...', 'Loading deals...', 'Loading deals...'];

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-6 pb-14 pt-8 sm:px-10">
      <div className="pointer-events-none absolute inset-y-0 left-2 hidden w-10 overflow-hidden lg:block">
        <div className="money-column flex h-full flex-col items-center justify-between py-6 text-2xl font-bold text-emerald-500/70">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={`left-$-${i}`}>$</span>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-2 hidden w-10 overflow-hidden lg:block">
        <div className="money-column flex h-full flex-col items-center justify-between py-6 text-2xl font-bold text-emerald-500/70 [animation-delay:0.6s]">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={`right-$-${i}`}>$</span>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-20 flex flex-wrap items-center justify-between gap-5">
          <div className="text-[3rem] font-bold leading-none tracking-tight text-[var(--brand-orange)]">brinc</div>

          <div className="flex items-center gap-4 sm:gap-10">
            <nav className="hidden items-center gap-10 text-[1.05rem] font-bold text-[var(--brand-muted)] md:flex">
              <span>Investors</span>
              <span>Partners</span>
              <span>Founders</span>
            </nav>

            <div className="flex items-center gap-3 rounded-full border border-[var(--brand-line)] bg-[#e0e0e0] px-5 py-2.5 text-[var(--brand-muted)]">
              <span className="text-base">Search...</span>
              <span className="text-lg">⌕</span>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-5xl text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-[var(--brand-ink)] sm:text-7xl">
            Revenue <span className="text-[var(--brand-orange)]">Performance</span>
            <br />
            Against Goal
          </h1>

          <p className="mx-auto mt-8 max-w-4xl text-2xl font-light leading-snug text-[var(--brand-muted)] sm:text-[2rem]">
            Deals closed for this year- let's get it
          </p>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-[var(--brand-line)] bg-[var(--brand-panel)] p-8 shadow-[0_16px_40px_rgba(15,17,21,0.06)] lg:col-span-2">
            <div className="-mx-8 -mt-8 mb-7 overflow-hidden rounded-t-3xl border-b border-black bg-black py-3 text-white">
              <div className="ticker-track flex min-w-max gap-10 whitespace-nowrap px-4 text-sm font-bold uppercase tracking-[0.08em]">
                {[...tickerItems, ...tickerItems].map((item, index) => (
                  <span key={`ticker-${index}`} className="text-emerald-400">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-muted)]">Closed Revenue</p>
                <p className="mt-3 text-5xl font-bold tracking-tight text-[var(--brand-ink)] sm:text-6xl">
                  {loading && !data ? 'Loading...' : `${formatCompactMillions(data?.totalRevenue ?? 0)} Closed`}
                </p>
                <p className="mt-3 text-sm text-[var(--brand-muted)]">Last 180 Days to Today</p>
              </div>

              <button
                type="button"
                onClick={() => void loadRevenue(true)}
                disabled={refreshing || loading}
                className="rounded-full border border-[var(--brand-line)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--brand-ink)] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="mt-8">
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#dedede]">
                <div
                  className="h-full rounded-full bg-[var(--brand-orange)] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                  aria-label="Revenue progress"
                />
              </div>

              <p className="mt-3 text-sm text-[var(--brand-muted)]">
                {progressPct}% of {formatCompactMillions(data?.goal ?? 10_000_000)} goal
              </p>

              {data ? (
                <p className="mt-1 text-sm text-[var(--brand-muted)]">
                  {data.dealsCount} deals closed | Date window used: {formatDate(data.startDateUsed)} to {formatDate(data.endDateUsed)}
                </p>
              ) : null}
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Could not load data: {error}
              </div>
            ) : null}
          </article>

          <article className="rounded-3xl border border-[var(--brand-line)] bg-[var(--brand-panel)] p-8 shadow-[0_16px_40px_rgba(15,17,21,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-muted)]">Snapshot</p>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-sm text-[var(--brand-muted)]">Goal</dt>
                <dd className="text-3xl font-bold text-[var(--brand-ink)]">{formatCurrency(data?.goal ?? 10_000_000)}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--brand-muted)]">Deals Closed</dt>
                <dd className="text-3xl font-bold text-[var(--brand-ink)]">{loading && !data ? '...' : data?.dealsCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--brand-muted)]">Progress</dt>
                <dd className="text-3xl font-bold text-[var(--brand-ink)]">{progressPct}%</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-[var(--brand-line)] bg-[var(--brand-panel)] p-8 shadow-[0_16px_40px_rgba(15,17,21,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[var(--brand-ink)]">Most Recent Closed Won Deals</h2>
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--brand-muted)]">Top 20</span>
          </div>

          {loading && !data ? (
            <p className="mt-7 text-sm text-[var(--brand-muted)]">Loading deals...</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--brand-line)] text-left text-xs uppercase tracking-[0.16em] text-[var(--brand-muted)]">
                    <th className="px-2 py-3 font-bold">Deal</th>
                    <th className="px-2 py-3 font-bold">Close date</th>
                    <th className="px-2 py-3 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeals.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-2 py-10 text-center text-sm text-[var(--brand-muted)]">
                        No closed won deals found for this time window.
                      </td>
                    </tr>
                  ) : (
                    recentDeals.map((deal) => (
                      <tr key={deal.id} className="border-b border-[#efefef] text-sm last:border-b-0">
                        <td className="px-2 py-3.5 text-[var(--brand-ink)]">{deal.dealname || 'Untitled Deal'}</td>
                        <td className="px-2 py-3.5 text-[var(--brand-muted)]">{formatDate(deal.closedate)}</td>
                        <td className="px-2 py-3.5 text-right font-medium text-[var(--brand-ink)]">{formatCurrency(deal.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
