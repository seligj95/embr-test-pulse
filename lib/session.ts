// Iron-session config — cookie-based session.
// SESSION_PASSWORD is required (32+ chars). Provided via Embr secret.
import type { SessionOptions } from 'iron-session';

export interface SessionData {
  user?: { name: string };
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_PASSWORD ||
    'dev-only-fallback-password-that-is-at-least-32-chars-long-xx',
  cookieName: 'pulse_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};
