import { NextResponse } from 'next/server';

/**
 * Endpoint de diagnostic TEMPORAIRE — a supprimer une fois le probleme de
 * variables d'environnement corrompues (copier-coller) resolu.
 *
 * Ne revele jamais un secret complet : seulement sa longueur, si un
 * caractere hors ByteString (code > 255) s'y trouve, et 8 caracteres de
 * debut/fin (insuffisant pour reconstituer le secret, suffisant pour
 * confirmer visuellement qu'il correspond a la valeur attendue).
 */
function inspect(name: string, value: string | undefined) {
  if (value === undefined || value === '') return { name, present: false };

  let firstBadIndex = -1;
  let firstBadCode: number | null = null;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) {
      firstBadIndex = i;
      firstBadCode = code;
      break;
    }
  }

  return {
    name,
    present: true,
    length: value.length,
    byteStringSafe: firstBadIndex === -1,
    firstBadCharIndex: firstBadIndex,
    firstBadCharCode: firstBadCode,
    leadingWhitespace: /^\s/.test(value),
    trailingWhitespace: /\s$/.test(value),
    startsWith: value.slice(0, 8),
    endsWith: value.slice(-8),
  };
}

export async function GET() {
  return NextResponse.json({
    checks: [
      inspect('DATABASE_URL', process.env.DATABASE_URL),
      inspect('DATABASE_AUTH_TOKEN', process.env.DATABASE_AUTH_TOKEN),
      inspect('SESSION_SECRET', process.env.SESSION_SECRET),
      inspect('ADMIN_ACCESS_CODE', process.env.ADMIN_ACCESS_CODE),
      inspect('APP_URL', process.env.APP_URL),
    ],
  });
}
