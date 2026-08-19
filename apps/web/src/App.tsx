import { useEffect, useState } from 'react';

type Health = { ok: boolean; service?: string };

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<Health>;
      })
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className="shell">
      <p className="eyebrow">Ember</p>
      <h1>Encontros pequenos, com intenção</h1>
      <p className="lede">MVP 0 — fundação do monorepo e email transacional.</p>
      <section className="card" aria-live="polite">
        <h2>API</h2>
        {health ? (
          <p className="ok">Conectada — {health.service}</p>
        ) : error ? (
          <p className="err">Offline — {error}</p>
        ) : (
          <p>Verificando…</p>
        )}
      </section>
    </main>
  );
}
