/**
 * Constantes non sensibles, lisibles depuis du code client ET serveur.
 *
 * A la difference de config.ts, ce fichier n'importe jamais 'server-only' et
 * ne doit jamais contenir de secret ni de logique qui echoue au chargement :
 * il peut finir dans le bundle navigateur (ex: via lib/phone.ts, utilise par
 * des composants client pour formater un numero).
 */
export const INDICATIF_PAYS = (process.env.INDICATIF_PAYS || '226').trim();
