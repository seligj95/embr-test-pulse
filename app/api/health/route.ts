import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const count = await prisma.teammate.count();
    return NextResponse.json({ status: 'ok', teammateCount: count });
  } catch (e: any) {
    return NextResponse.json({ status: 'degraded', error: String(e?.message || e) }, { status: 503 });
  }
}
