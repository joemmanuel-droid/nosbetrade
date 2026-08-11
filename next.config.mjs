/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le contenu du livre n'est jamais servi statiquement : il passe par des
  // routes API qui verifient l'entitlement. On garde donc les headers stricts.
  serverExternalPackages: ['@libsql/client', 'sharp'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
      {
        // Aucune mise en cache des contenus proteges, meme sur le CDN.
        source: '/api/(content|figure)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
