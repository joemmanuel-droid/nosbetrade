'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button, Card, Spinner } from './ui';
import type { OrderStatus } from '@/lib/payments/types';

const POLL_MS: Record<string, number> = { pending: 3000, review: 12000 };

export function OrderStatusView({
  orderId,
  initialStatus,
  whatsapp,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  whatsapp: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const attempts = useRef(0);

  useEffect(() => {
    const interval = POLL_MS[status];
    if (!interval) return;
    // Ralentit apres deux minutes de tentative sur un paiement automatique, pour ne pas
    // saturer l'agregateur si le client a ferme l'onglet mobile money sans payer.
    attempts.current += 1;
    const delay = status === 'pending' && attempts.current > 40 ? 15000 : interval;

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (res.ok) setStatus(data.order.status);
      } catch {
        // on reessaiera au prochain tick
      }
    }, delay);
    return () => clearTimeout(t);
  }, [status, orderId]);

  if (status === 'paid') {
    return (
      <Card className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green-bg)] text-2xl">
          ✓
        </div>
        <h1 className="mt-4 text-lg font-bold">Paiement confirmé</h1>
        <p className="mt-1.5 text-sm text-[var(--text-dim)]">
          Ton accès au livre complet est débloqué. Bonne lecture !
        </p>
        <div className="mt-5">
          <Button full size="lg" onClick={() => router.push('/lire')}>
            Commencer la lecture
          </Button>
        </div>
      </Card>
    );
  }

  if (status === 'review') {
    return (
      <Card className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(217,166,62,0.14)] text-2xl">
          ⏳
        </div>
        <h1 className="mt-4 text-lg font-bold">Vérification en cours</h1>
        <p className="mt-1.5 text-sm text-[var(--text-dim)]">
          Ta preuve de paiement a bien été reçue. L'accès est débloqué automatiquement dès validation,
          généralement en quelques minutes.
        </p>
        <p className="mt-4 text-xs text-[var(--text-faint)]">
          Cette page se met à jour toute seule — tu peux aussi fermer l'application et revenir plus tard.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[var(--text-faint)]">
          <Spinner size={14} />
          En attente de validation
        </div>
      </Card>
    );
  }

  if (status === 'failed' || status === 'cancelled' || status === 'expired') {
    return (
      <Card className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--red-bg)] text-2xl">
          ✕
        </div>
        <h1 className="mt-4 text-lg font-bold">Paiement non confirmé</h1>
        <p className="mt-1.5 text-sm text-[var(--text-dim)]">
          Le paiement n'a pas abouti. Aucun montant n'a été retenu pour cette tentative si elle a été annulée.
        </p>
        <div className="mt-5 space-y-2.5">
          <Button full size="lg" onClick={() => router.push('/acheter')}>
            Réessayer
          </Button>
          <a
            href={`https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`}
            className="block text-sm text-[var(--text-faint)] underline underline-offset-2"
          >
            Besoin d'aide sur WhatsApp
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)] text-2xl">
        <Spinner size={22} />
      </div>
      <h1 className="mt-4 text-lg font-bold">Paiement en cours</h1>
      <p className="mt-1.5 text-sm text-[var(--text-dim)]">
        Confirme le paiement sur ton téléphone si une demande Mobile Money s'est affichée.
      </p>
    </Card>
  );
}
