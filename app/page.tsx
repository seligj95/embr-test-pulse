import { prisma } from '@/lib/prisma';
import { getRedis, CACHE_KEYS } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function loadStats() {
  const redis = getRedis();
  let teammates: Awaited<ReturnType<typeof prisma.teammate.findMany>>;
  let cached = false;
  if (redis) {
    try {
      const hit = await redis.get(CACHE_KEYS.teammates);
      if (hit) {
        teammates = JSON.parse(hit);
        cached = true;
      } else {
        teammates = await prisma.teammate.findMany({ orderBy: { updatedAt: 'desc' } });
        await redis.set(CACHE_KEYS.teammates, JSON.stringify(teammates), 'EX', 30);
      }
    } catch {
      teammates = await prisma.teammate.findMany({ orderBy: { updatedAt: 'desc' } });
    }
  } else {
    teammates = await prisma.teammate.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  const byStatus = teammates.reduce<Record<string, number>>((acc: Record<string, number>, t: { status: string }) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return { teammates, cached, byStatus };
}

export default async function Home() {
  const { teammates, cached, byStatus } = await loadStats();
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Embr Pulse</h1>
      <p>
        Team status board · {teammates.length} teammates ·{' '}
        <span style={{ color: cached ? '#0a7' : '#888' }}>{cached ? 'served from cache' : 'served from db'}</span>
      </p>
      <section style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(byStatus).map(([s, n]) => (
          <div key={s} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: 6 }}>
            <strong>{n}</strong> {s}
          </div>
        ))}
      </section>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {teammates.map((t) => (
          <li key={t.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
            <a href={`/team/${t.id}`}><strong>{t.name}</strong></a> · {t.role} · <em>{t.status}</em>
            {t.message ? <div style={{ color: '#555' }}>“{t.message}”</div> : null}
          </li>
        ))}
      </ul>
      <p style={{ marginTop: '2rem' }}>
        <a href="/team">Team</a> · <a href="/profile">Profile</a>
      </p>
    </main>
  );
}
