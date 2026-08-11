import { INDICATIF_PAYS } from './public-constants';

/**
 * Normalise un numero saisi par un utilisateur burkinabe.
 * Accepte : "70 12 34 56", "+226 70123456", "0022670123456", "226-70-12-34-56".
 * Retourne toujours "+22670123456" ou null si le numero est invalide.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let s = raw.replace(/[\s\-().]/g, '');

  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (!s.startsWith('+')) {
    // Numero local : on prefixe l'indicatif pays.
    s = s.replace(/^0+/, '');
    if (s.startsWith(INDICATIF_PAYS)) s = '+' + s;
    else s = '+' + INDICATIF_PAYS + s;
  }

  if (!/^\+\d{8,15}$/.test(s)) return null;

  // Burkina Faso : 8 chiffres apres l'indicatif.
  if (s.startsWith('+' + INDICATIF_PAYS)) {
    const local = s.slice(1 + INDICATIF_PAYS.length);
    if (local.length !== 8) return null;
  }
  return s;
}

/** Affichage lisible : +226 70 12 34 56 */
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return e164;
  return `+${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}`;
}

/** Masque pour les logs et l'affichage public : +226 •• •• 34 56 */
export function maskPhone(e164: string): string {
  if (e164.length < 6) return '•'.repeat(e164.length);
  return e164.slice(0, 4) + '•'.repeat(Math.max(0, e164.length - 8)) + e164.slice(-4);
}

/**
 * Devine l'operateur mobile money a partir du prefixe burkinabe.
 * Indicatif : Orange 06/07/54-57, Moov 01/02/51-53, Telecel 66-68/76-78.
 * Utilise uniquement pour pre-selectionner un bouton, jamais pour bloquer.
 */
export function guessOperator(e164: string): string | null {
  if (!e164.startsWith('+' + INDICATIF_PAYS)) return null;
  const p = e164.slice(1 + INDICATIF_PAYS.length, 3 + INDICATIF_PAYS.length);
  if (/^(06|07|54|55|56|57)$/.test(p)) return 'orange';
  if (/^(01|02|51|52|53)$/.test(p)) return 'moov';
  if (/^(66|67|68|76|77|78)$/.test(p)) return 'telecel';
  return null;
}
