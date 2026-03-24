import { Suspense } from 'react';
import DealsPageClient from './DealsPageClient';

export default function DealsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#faf7f4] px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-[var(--brand-line)] bg-white p-6 text-sm text-[var(--brand-muted)]">
            Loading deal tables...
          </div>
        </main>
      }
    >
      <DealsPageClient />
    </Suspense>
  );
}
