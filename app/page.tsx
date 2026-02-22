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
  const [ringing, setRinging] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

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
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 460 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        drift: `${Math.random() * 28 - 14}vw`,
        duration: `${2.6 + Math.random() * 2.7}s`,
        delay: `${Math.random() * 0.5}s`,
        color: ['#16a34a', '#22c55e', '#f59e0b', '#e4583a', '#0f172a', '#3b82f6'][i % 6]
      })),
    []
  );
  const dancers = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: 10 + i * 16 + (Math.random() * 6 - 3),
        bottom: 8 + Math.random() * 10,
        delay: `${0.1 + i * 0.14}s`,
        icon: i % 2 === 0 ? '🕺' : '🕺'
      })),
    []
  );

  const playBellSound = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const now = context.currentTime;
    const frequencies = [1320, 1760, 1420];

    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + index * 0.06);
      gain.gain.setValueAtTime(0.0001, now + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5 + index * 0.06);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.06);
      oscillator.stop(now + 0.52 + index * 0.06);
    });

    window.setTimeout(() => {
      void context.close();
    }, 900);
  };

  const ringBellAndRefresh = () => {
    if (refreshing || loading) {
      return;
    }

    setRinging(true);
    setConfettiVisible(true);
    playBellSound();
    void loadRevenue(true);

    window.setTimeout(() => {
      setRinging(false);
    }, 900);

    window.setTimeout(() => {
      setConfettiVisible(false);
    }, 3600);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 pb-10 pt-5 sm:px-8 sm:pb-14 sm:pt-8">
      {confettiVisible ? (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confettiPieces.map((piece) => (
            <span
              key={`confetti-${piece.id}`}
              className="confetti-piece"
              style={
                {
                  left: `${piece.left}%`,
                  animationDuration: piece.duration,
                  animationDelay: piece.delay,
                  backgroundColor: piece.color,
                  '--confetti-drift': piece.drift
                } as React.CSSProperties
              }
            />
          ))}
          {dancers.map((dancer) => (
            <span
              key={`dancer-${dancer.id}`}
              className="dancer-pop"
              style={
                {
                  left: `${dancer.left}%`,
                  bottom: `${dancer.bottom}%`,
                  animationDelay: dancer.delay
                } as React.CSSProperties
              }
            >
              {dancer.icon}
            </span>
          ))}
        </div>
      ) : null}

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
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 sm:mb-16 sm:gap-5">
          <div className="text-[2.2rem] font-bold leading-none tracking-tight text-[var(--brand-orange)] sm:text-[3rem]">brinc</div>

          <div className="flex w-full items-center justify-end gap-3 sm:w-auto sm:justify-normal sm:gap-10">
            <div className="flex flex-1 items-center justify-between gap-3 rounded-full border border-[var(--brand-line)] bg-[#e0e0e0] px-4 py-2 text-[var(--brand-muted)] sm:w-[250px] sm:flex-none sm:px-5 sm:py-2.5">
              <span className="text-sm sm:text-base">Search...</span>
              <span className="text-lg">⌕</span>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--brand-ink)] sm:text-6xl lg:text-7xl">
            Revenue <span className="text-[var(--brand-orange)]">Performance</span>
            <br />
            Against Goal
          </h1>

          <p className="mx-auto mt-6 max-w-4xl text-lg font-light leading-snug text-[var(--brand-muted)] sm:mt-8 sm:text-[2rem]">
            Deals closed for this year- let's get it
          </p>
        </section>

        <section className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-[var(--brand-line)] bg-[var(--brand-panel)] p-5 shadow-[0_16px_40px_rgba(15,17,21,0.06)] sm:p-8 lg:col-span-2">
            <div className="-mx-5 -mt-5 mb-6 overflow-hidden rounded-t-3xl border-b border-black bg-black py-2.5 text-white sm:-mx-8 sm:-mt-8 sm:mb-7 sm:py-3">
              <div className="ticker-track flex min-w-max gap-8 whitespace-nowrap px-4 text-xs font-bold uppercase tracking-[0.08em] sm:gap-10 sm:text-sm">
                {[...tickerItems, ...tickerItems].map((item, index) => (
                  <span key={`ticker-${index}`} className="text-emerald-400">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-muted)]">Closed Revenue</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--brand-ink)] sm:mt-3 sm:text-6xl">
                  {loading && !data ? 'Loading...' : `${formatCompactMillions(data?.totalRevenue ?? 0)} Closed`}
                </p>
                <p className="mt-2 text-sm text-[var(--brand-muted)] sm:mt-3">Last 180 Days to Today</p>
              </div>

              <button
                type="button"
                onClick={ringBellAndRefresh}
                disabled={refreshing || loading}
                className="rounded-full border border-[var(--brand-line)] bg-white px-4 py-2 text-left text-xs font-bold text-[var(--brand-ink)] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <span>{refreshing ? 'Refreshing deals...' : 'Just won a new deal? Ring the bell'}</span>
                  <span className={ringing ? 'bell-ringing inline-block' : 'inline-block'} aria-hidden="true">
                    🔔
                  </span>
                </span>
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

              <p className="mt-3 text-xs text-[var(--brand-muted)] sm:text-sm">
                {progressPct}% of {formatCompactMillions(data?.goal ?? 10_000_000)} goal
              </p>

              {data ? (
                <p className="mt-1 text-xs text-[var(--brand-muted)] sm:text-sm">
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

          <article className="rounded-3xl border border-[var(--brand-line)] bg-[var(--brand-panel)] p-5 shadow-[0_16px_40px_rgba(15,17,21,0.06)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-muted)]">Snapshot</p>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-sm text-[var(--brand-muted)]">Goal</dt>
                <dd className="text-2xl font-bold text-[var(--brand-ink)] sm:text-3xl">{formatCurrency(data?.goal ?? 10_000_000)}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--brand-muted)]">Deals Closed</dt>
                <dd className="text-2xl font-bold text-[var(--brand-ink)] sm:text-3xl">{loading && !data ? '...' : data?.dealsCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--brand-muted)]">Progress</dt>
                <dd className="text-2xl font-bold text-[var(--brand-ink)] sm:text-3xl">{progressPct}%</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="mt-5 rounded-3xl border border-[var(--brand-line)] bg-[var(--brand-panel)] p-5 shadow-[0_16px_40px_rgba(15,17,21,0.06)] sm:mt-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[var(--brand-ink)] sm:text-2xl">Most Recent Closed Won Deals</h2>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-muted)] sm:text-sm">Top 20</span>
          </div>

          {loading && !data ? (
            <p className="mt-7 text-sm text-[var(--brand-muted)]">Loading deals...</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--brand-line)] text-left text-[11px] uppercase tracking-[0.14em] text-[var(--brand-muted)] sm:text-xs sm:tracking-[0.16em]">
                    <th className="px-1 py-2.5 font-bold sm:px-2 sm:py-3">Deal</th>
                    <th className="px-1 py-2.5 font-bold sm:px-2 sm:py-3">Close date</th>
                    <th className="px-1 py-2.5 text-right font-bold sm:px-2 sm:py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeals.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-2 py-8 text-center text-sm text-[var(--brand-muted)] sm:py-10">
                        No closed won deals found for this time window.
                      </td>
                    </tr>
                  ) : (
                    recentDeals.map((deal) => (
                      <tr key={deal.id} className="border-b border-[#efefef] text-xs last:border-b-0 sm:text-sm">
                        <td className="max-w-[130px] truncate px-1 py-3 text-[var(--brand-ink)] sm:max-w-none sm:px-2 sm:py-3.5">
                          {deal.dealname || 'Untitled Deal'}
                        </td>
                        <td className="whitespace-nowrap px-1 py-3 text-[var(--brand-muted)] sm:px-2 sm:py-3.5">
                          {formatDate(deal.closedate)}
                        </td>
                        <td className="whitespace-nowrap px-1 py-3 text-right font-medium text-[var(--brand-ink)] sm:px-2 sm:py-3.5">
                          {formatCurrency(deal.amount)}
                        </td>
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
