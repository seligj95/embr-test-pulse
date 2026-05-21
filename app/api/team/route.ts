import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedis, CACHE_KEYS } from '@/lib/redis';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = String(form.get('name') || '').trim();
    const role = String(form.get('role') || '').trim() || 'Engineer';
    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    await prisma.teammate.create({ data: { name, role } });

    const redis = getRedis();
    if (redis) {
      try { await redis.del(CACHE_KEYS.teammates); } catch {}
    }

    return new Response(null, { status: 303, headers: { Location: '/team' } });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'add failed', detail: String(e?.message || e), stack: String(e?.stack || '').split('\n').slice(0, 5) },
      { status: 500 },
    );
  }
}
