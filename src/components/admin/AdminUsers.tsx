'use client';

import { useState, useTransition } from 'react';
import { Badge, Button, Card, Spinner } from '../ui';
import { formatPhone } from '@/lib/phone';

type AdminUser = {
  id: string;
  phone: string;
  created_at: number;
  last_seen_at: number | null;
  blocked: number;
  has_access: number;
};

export function AdminUsers() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    startTransition(async () => {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    });
  }

  async function revoke(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/revoke`, { method: 'POST' });
      if (res.ok) {
        setUsers((list) => list?.map((u) => (u.id === id ? { ...u, has_access: 0 } : u)) ?? null);
      }
    } finally {
      setBusy(null);
    }
  }

  async function toggleBlock(id: string, nextBlocked: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: nextBlocked }),
      });
      if (res.ok) {
        setUsers((list) => list?.map((u) => (u.id === id ? { ...u, blocked: nextBlocked ? 1 : 0 } : u)) ?? null);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par numéro (ex : 7012)"
          className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold-dim)]"
        />
        <Button size="sm" type="submit" disabled={pending}>
          {pending ? <Spinner size={14} /> : 'Chercher'}
        </Button>
      </form>

      <div className="space-y-2">
        {users?.map((u) => (
          <Card key={u.id} className="flex items-center justify-between gap-2 p-3">
            <div>
              <p className="text-sm font-medium">{formatPhone(u.phone)}</p>
              <p className="text-xs text-[var(--text-faint)]">
                Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!!u.blocked && <Badge tone="red">Bloqué</Badge>}
              {u.has_access ? <Badge tone="green">Accès actif</Badge> : <Badge tone="neutral">Aucun accès</Badge>}
              {!!u.has_access && (
                <Button size="sm" variant="danger" onClick={() => revoke(u.id)} disabled={busy === u.id}>
                  {busy === u.id ? <Spinner size={14} /> : 'Révoquer'}
                </Button>
              )}
              <Button
                size="sm"
                variant={u.blocked ? 'outline' : 'danger'}
                onClick={() => toggleBlock(u.id, !u.blocked)}
                disabled={busy === u.id}
              >
                {busy === u.id ? <Spinner size={14} /> : u.blocked ? 'Débloquer' : 'Bloquer'}
              </Button>
            </div>
          </Card>
        ))}
        {users && users.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--text-faint)]">Aucun résultat.</p>
        )}
      </div>
    </div>
  );
}
