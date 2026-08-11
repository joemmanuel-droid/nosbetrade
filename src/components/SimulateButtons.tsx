'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Spinner } from './ui';

export function SimulateButtons({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'paid' | 'failed' | null>(null);

  async function simulate(result: 'paid' | 'failed') {
    setLoading(result);
    try {
      await fetch(`/api/orders/${orderId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
    } finally {
      router.push(`/acheter/retour/${orderId}`);
    }
  }

  return (
    <div className="space-y-2.5">
      <Button full size="lg" onClick={() => simulate('paid')} disabled={loading !== null}>
        {loading === 'paid' ? <Spinner /> : '✓ Simuler un paiement réussi'}
      </Button>
      <Button full variant="outline" onClick={() => simulate('failed')} disabled={loading !== null}>
        {loading === 'failed' ? <Spinner /> : '✕ Simuler un échec'}
      </Button>
    </div>
  );
}
