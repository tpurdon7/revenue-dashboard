import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff1eb_0%,#faf7f4_45%,#f4f1ec_100%)] px-4 py-10">
      <Suspense fallback={<div className="text-sm text-[var(--brand-muted)]">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
