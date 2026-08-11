'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminLockButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function lock() {
    setLoading(true);
    await fetch('/api/admin/lock', { method: 'POST' });
    router.refresh();
  }

  return (
    <button
      onClick={lock}
      disabled={loading}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-sm hover:bg-[var(--surface-2)] disabled:opacity-50"
      title="Reverrouiller le back-office"
      aria-label="Reverrouiller le back-office"
    >
      🔒
    </button>
  );
}
