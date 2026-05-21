import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';

export const runtime = 'nodejs';

// POST /api/session — sign in (form: name=…)
// DELETE /api/session — sign out
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = String(form.get('name') || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.user = { name };
    await session.save();
    return new Response(null, { status: 303, headers: { Location: '/profile' } });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'sign-in failed', detail: String(e?.message || e), stack: String(e?.stack || '').split('\n').slice(0, 5) },
      { status: 500 },
    );
  }
}

export async function DELETE() {
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
