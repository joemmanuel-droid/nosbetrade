// Sauvegarde de la base de donnees.
//
// Usage (base locale) :
//   node --env-file=.env scripts/backup-db.mjs
// (ou exporte DATABASE_URL toi-meme avant d'appeler `node scripts/backup-db.mjs`)
//
// A planifier avec le planificateur de taches de ton hebergeur (cron sur un
// VPS, "Scheduled Task" Windows, etc.) — par exemple une fois par jour.
//
// Base locale (file:...) : utilise VACUUM INTO, la methode SQLite standard
// pour copier une base de facon sure meme si l'app ecrit dedans en meme
// temps (contrairement a une simple copie de fichier, qui risque de capturer
// un etat incoherent). Conserve les 14 dernieres sauvegardes puis supprime
// les plus anciennes.
//
// Base distante (Turso / libsql://...) : ce script ne peut pas faire de
// VACUUM INTO a distance de facon fiable. Utilise plutot les sauvegardes
// integrees de Turso (plan payant) ou : `turso db shell <nom> ".dump" > backup.sql`

import { createClient } from '@libsql/client';
import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/app.db';
const RETENTION = 14;

async function backupLocal(fileUrl) {
  const dbPath = path.resolve(process.cwd(), fileUrl.slice('file:'.length));
  const backupDir = path.join(process.cwd(), 'backups');
  mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `app-${stamp}.db`);

  const client = createClient({ url: 'file:' + dbPath });
  // Chemin absolu, echappe pour la commande SQL VACUUM INTO.
  const escaped = backupPath.replace(/'/g, "''");
  await client.execute(`VACUUM INTO '${escaped}'`);
  client.close();

  const size = statSync(backupPath).size;
  console.log(`Sauvegarde créée : ${backupPath} (${(size / 1024).toFixed(0)} Ko)`);

  const files = readdirSync(backupDir)
    .filter((f) => f.startsWith('app-') && f.endsWith('.db'))
    .map((f) => ({ f, t: statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);

  for (const { f } of files.slice(RETENTION)) {
    unlinkSync(path.join(backupDir, f));
    console.log(`Ancienne sauvegarde supprimée : ${f}`);
  }
}

function printRemoteInstructions() {
  console.log(`
DATABASE_URL pointe vers une base distante (${DATABASE_URL}).
Ce script ne sauvegarde que les bases locales (file:...).

Pour une base Turso, utilise plutôt :
  1. Les sauvegardes automatiques intégrées à Turso (voir ton tableau de bord Turso, plan payant), ou
  2. Un export manuel :  turso db shell <nom-de-ta-base> ".dump" > backup-$(date +%F).sql
`);
}

if (DATABASE_URL.startsWith('file:')) {
  await backupLocal(DATABASE_URL);
} else {
  printRemoteInstructions();
}
