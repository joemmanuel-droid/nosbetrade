'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Jamais en developpement : le SW intercepte les navigations et bascule
    // sur /hors-ligne des qu'un fetch echoue ou tarde — exactement ce qui
    // arrive lors d'une compilation a chaud Next.js (premiere requete sur
    // une route, HMR). En dev ca produit un faux "hors-ligne" trompeur pour
    // un simple ralentissement de compilation ; en production les routes
    // sont precompilees, ce risque n'existe pas. Meme garde-fou que
    // next-pwa applique par defaut.
    if (process.env.NODE_ENV !== 'production') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installation non bloquante : l'app fonctionne sans SW, juste sans mise en cache de l'app shell.
      });
    }
  }, []);
  return null;
}
