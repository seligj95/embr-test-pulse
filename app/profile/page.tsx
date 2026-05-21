import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function login(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  if (!name) return;
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.user = { name };
  await session.save();
  redirect('/profile');
}

async function logout() {
  'use server';
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.destroy();
  redirect('/profile');
}

export default async function ProfilePage() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
      <p><a href="/">← Home</a></p>
      <h1>Profile</h1>
      {session.user ? (
        <>
          <p>Signed in as <strong>{session.user.name}</strong>.</p>
          <form action={logout}><button type="submit">Sign out</button></form>
        </>
      ) : (
        <form action={login} style={{ display: 'flex', gap: '0.5rem' }}>
          <input name="name" placeholder="Your name" required style={{ flex: 1, padding: '0.5rem' }} />
          <button type="submit">Sign in</button>
        </form>
      )}
    </main>
  );
}
