import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getRedis, CACHE_KEYS } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function addTeammate(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  const role = String(formData.get('role') || '').trim() || 'Engineer';
  if (!name) return;
  await prisma.teammate.create({ data: { name, role } });
  const redis = getRedis();
  if (redis) await redis.del(CACHE_KEYS.teammates);
  revalidatePath('/');
  revalidatePath('/team');
}

export default async function TeamPage() {
  const teammates = await prisma.teammate.findMany({ orderBy: { name: 'asc' } });
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <p><a href="/">← Home</a></p>
      <h1>Team</h1>
      <form action={addTeammate} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input name="name" placeholder="Name" required style={{ flex: 1, padding: '0.5rem' }} />
        <input name="role" placeholder="Role" style={{ flex: 1, padding: '0.5rem' }} />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Add</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Role</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {teammates.map((t) => (
            <tr key={t.id}>
              <td style={{ padding: '0.5rem 0' }}><a href={`/team/${t.id}`}>{t.name}</a></td>
              <td>{t.role}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
