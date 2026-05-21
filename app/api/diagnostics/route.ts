import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedis } from '@/lib/redis';
import { getContainer } from '@/lib/blob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, unknown> = {};

  try {
    const count = await prisma.teammate.count();
    checks.db = { ok: true, teammateCount: count };
  } catch (e: any) {
    checks.db = { ok: false, error: String(e?.message || e) };
  }

  const redis = getRedis();
  if (redis) {
    try {
      const pong = await redis.ping();
      checks.cache = { ok: pong === 'PONG', pong };
    } catch (e: any) {
      checks.cache = { ok: false, error: String(e?.message || e) };
    }
  } else {
    checks.cache = { ok: false, reason: 'REDIS_URL/CACHE_URL not set' };
  }

  try {
    const container = await getContainer();
    checks.blob = container ? { ok: true, container: 'pulse-uploads' } : { ok: false, reason: 'EMBR_BLOB_URL not set' };
  } catch (e: any) {
    checks.blob = { ok: false, error: String(e?.message || e) };
  }

  checks.env = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasRedisUrl: !!(process.env.REDIS_URL || process.env.CACHE_URL),
    hasBlobUrl: !!process.env.EMBR_BLOB_URL,
    hasBlobKey: !!process.env.EMBR_BLOB_KEY,
    hasSessionPassword: !!process.env.SESSION_PASSWORD,
    embrAppUrl: process.env.EMBR_APP_URL || null,
    embrAppHostname: process.env.EMBR_APP_HOSTNAME || null,
  };

  const allOk =
    (checks.db as any)?.ok && (checks.cache as any)?.ok && (checks.blob as any)?.ok;
  return NextResponse.json(checks, { status: allOk ? 200 : 503 });
}
