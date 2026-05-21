import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadAvatar } from '@/lib/blob';
import { getRedis, CACHE_KEYS } from '@/lib/redis';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const teammateId = Number(req.nextUrl.searchParams.get('teammateId'));
  if (!teammateId) return NextResponse.json({ error: 'teammateId required' }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const key = `teammates/${teammateId}-${Date.now()}.${ext}`;
  const url = await uploadAvatar(key, bytes, file.type || 'application/octet-stream');
  if (!url) {
    return NextResponse.json(
      { error: 'Blob storage not configured (missing EMBR_BLOB_URL)' },
      { status: 500 },
    );
  }

  await prisma.teammate.update({ where: { id: teammateId }, data: { avatarKey: key } });
  const redis = getRedis();
  if (redis) await redis.del(CACHE_KEYS.teammates);

  return new Response(null, {
    status: 303,
    headers: { Location: `/team/${teammateId}` },
  });
}
