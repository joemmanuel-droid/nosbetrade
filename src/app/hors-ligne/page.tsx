export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        gap: 12,
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div style={{ fontSize: 40 }}>📡</div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Pas de connexion</h1>
      <p style={{ color: 'var(--text-dim)', maxWidth: 320, margin: 0 }}>
        Vérifie ta connexion internet puis réessaie. Ton achat et ta progression de lecture sont sauvegardés.
      </p>
    </main>
  );
}
