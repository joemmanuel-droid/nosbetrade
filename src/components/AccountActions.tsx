'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Spinner } from './ui';

export function RedeemCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/access-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Code invalide.');
      setOk(true);
      setTimeout(() => router.push('/lire'), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return <p className="text-sm text-[var(--green-soft)]">Accès débloqué — redirection…</p>;
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="CODE-ACCES"
        className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm uppercase outline-none focus:border-[var(--gold-dim)]"
      />
      <Button type="submit" size="sm" disabled={loading || code.trim().length < 4}>
        {loading ? <Spinner size={16} /> : 'Valider'}
      </Button>
      {error && <p className="absolute mt-11 text-xs text-[var(--red-soft)]">{error}</p>}
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <Button variant="outline" full onClick={logout} disabled={loading}>
      {loading ? <Spinner size={16} /> : 'Se déconnecter'}
    </Button>
  );
}
