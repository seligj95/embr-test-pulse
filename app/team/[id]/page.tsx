import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getRedis, CACHE_KEYS } from '@/lib/redis';
import { avatarUrl } from '@/lib/blob';

export const dynamic = 'force-dynamic';

async function updateStatus(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  const status = String(formData.get('status') || '').trim();
  const message = String(formData.get('message') || '').trim() || null;
  if (!id || !status) return;
  await prisma.teammate.update({ where: { id }, data: { status, message } });
  const redis = getRedis();
  if (redis) await redis.del(CACHE_KEYS.teammates);
  revalidatePath('/');
  revalidatePath(`/team/${id}`);
}

export default async function TeammatePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) notFound();
  const t = await prisma.teammate.findUnique({ where: { id } });
  if (!t) notFound();
  const avatar = t.avatarKey ? await avatarUrl(t.avatarKey) : null;

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '2rem auto', padding: '0 1rem' }}>
      <p><a href="/team">← Team</a></p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" width={80} height={80} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eee' }} />
        )}
        <div>
          <h1 style={{ margin: 0 }}>{t.name}</h1>
          <p style={{ margin: 0, color: '#666' }}>{t.role}</p>
        </div>
      </div>
      <form action={updateStatus}>
        <input type="hidden" name="id" value={t.id} />
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Status:
          <select name="status" defaultValue={t.status} style={{ marginLeft: '0.5rem', padding: '0.25rem' }}>
            <option value="available">available</option>
            <option value="busy">busy</option>
            <option value="ooo">out of office</option>
            <option value="focus">focus mode</option>
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Message:
          <input name="message" defaultValue={t.message ?? ''} placeholder="Optional status message" style={{ marginLeft: '0.5rem', padding: '0.25rem', width: 320 }} />
        </label>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Update</button>
      </form>

      <hr style={{ margin: '2rem 0' }} />

      <h2>Avatar</h2>
      <form action={`/api/upload?teammateId=${t.id}`} method="post" encType="multipart/form-data">
        <input type="file" name="file" accept="image/*" required />
        <button type="submit" style={{ marginLeft: '0.5rem' }}>Upload</button>
      </form>
    </main>
  );
}
