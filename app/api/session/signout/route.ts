import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.destroy();
    return new Response(null, { status: 303, headers: { Location: '/profile' } });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'sign-out failed', detail: String(e?.message || e) },
      { status: 500 },
    );
  }
}
