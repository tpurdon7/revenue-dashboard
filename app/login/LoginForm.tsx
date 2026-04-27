'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Unable to sign in');
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[32px] border border-[var(--brand-line)] bg-white p-8 shadow-[0_20px_80px_rgba(15,17,21,0.08)]">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-orange)]">Private Access</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--brand-ink)]">Revenue Dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">
          Enter the shared password to access the dashboard and reports.
        </p>
      </div>

      <label className="block text-sm font-medium text-[var(--brand-ink)]" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        className="mt-2 w-full rounded-2xl border border-[var(--brand-line)] bg-white px-4 py-3 text-base text-[var(--brand-ink)] outline-none transition focus:border-[var(--brand-orange)] focus:ring-2 focus:ring-[rgba(228,88,58,0.15)]"
        placeholder="Enter password"
        disabled={submitting}
      />

      {error ? <p className="mt-3 text-sm text-[var(--brand-orange)]">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--brand-ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#22262d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Checking password...' : 'Enter dashboard'}
      </button>
    </form>
  );
}
