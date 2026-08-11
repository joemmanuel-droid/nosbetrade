// Genere un secret aleatoire a coller dans SESSION_SECRET (.env).
import { randomBytes } from 'node:crypto';

console.log(randomBytes(48).toString('base64url'));
