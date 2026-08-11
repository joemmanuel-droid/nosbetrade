import { PAYMENT_PROVIDER, type ProviderId } from '../config';
import { cinetpay } from './cinetpay';
import { ligdicash } from './ligdicash';
import { simulation } from './simulation';
import type { PaymentProvider } from './types';

const REGISTRY: Record<ProviderId, PaymentProvider> = {
  simulation,
  cinetpay,
  ligdicash,
};

export function defaultProvider(): PaymentProvider {
  return REGISTRY[PAYMENT_PROVIDER] ?? simulation;
}

export function getProvider(id: string): PaymentProvider | null {
  return REGISTRY[id as ProviderId] ?? null;
}

export * from './types';
