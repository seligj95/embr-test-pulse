import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedis, CACHE_KEYS } from '@/lib/redis';

export const runtime = 'nodejs';

// Plain POST endpoint (avoids Next.js server-action machinery).
// Body: application/x-www-form-urlencoded with id, status, message.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const id = Number(form.get('id'));
    const status = String(form.get('status') || '').trim();
    const message = (String(form.get('message') || '').trim()) || null;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    await prisma.teammate.update({ where: { id }, data: { status, message } });

    const redis = getRedis();
    if (redis) {
      try { await redis.del(CACHE_KEYS.teammates); } catch {}
    }

    return NextResponse.redirect(new URL(`/team/${id}`, req.url), { status: 303 });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'update failed', detail: String(e?.message || e), stack: String(e?.stack || '').split('\n').slice(0, 5) },
      { status: 500 },
    );
  }
}
