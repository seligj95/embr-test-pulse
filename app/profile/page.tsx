import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
      <p><a href="/">← Home</a></p>
      <h1>Profile</h1>
      {session.user ? (
        <>
          <p>Signed in as <strong>{session.user.name}</strong>.</p>
          <form action="/api/session/signout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </>
      ) : (
        <form action="/api/session" method="post" style={{ display: 'flex', gap: '0.5rem' }}>
          <input name="name" placeholder="Your name" required style={{ flex: 1, padding: '0.5rem' }} />
          <button type="submit">Sign in</button>
        </form>
      )}
    </main>
  );
}
