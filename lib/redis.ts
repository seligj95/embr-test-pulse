// Redis/Valkey client — Embr auto-injects REDIS_URL when ioredis is in deps.
// We use it as a write-through cache for the teammates list.
import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.CACHE_URL;
  if (!url) return null;
  client = global.__redis ?? new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 1 });
  if (process.env.NODE_ENV !== 'production') global.__redis = client;
  return client;
}

export const CACHE_KEYS = {
  teammates: 'pulse:teammates:v1',
};
