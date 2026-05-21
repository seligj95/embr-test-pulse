// Embr Blob storage helper.
// Embr exposes blob storage as a REST API on the app's OWN domain at
// /_embr/blob/{key}. This is NOT Azure Storage SDK compatible — it's a
// custom proxy intercepted by YARP. Authentication uses Bearer token.
//
// Embr injects:
//   EMBR_BLOB_URL  — proxy base URL (always https://<env-domain>/_embr/blob/)
//   EMBR_BLOB_KEY  — bearer token (required for write/list/delete; reads public)
//
// API surface (per src/Embr.Global.Api/docs/storage.md):
//   PUT    /_embr/blob/{key}   — upload      (auth)
//   GET    /_embr/blob/{key}   — download    (public)
//   HEAD   /_embr/blob/{key}   — metadata    (public)
//   GET    /_embr/blob/        — list        (auth)
//   DELETE /_embr/blob/{key}   — delete      (auth)
//
// NOTE: There is NO @embr/blob SDK yet (deferred per issue #389). All
// official examples use plain fetch().

function baseUrl(): string | null {
  const url = process.env.EMBR_BLOB_URL;
  if (!url) return null;
  return url.endsWith('/') ? url : url + '/';
}

function authHeader(): Record<string, string> {
  const key = process.env.EMBR_BLOB_KEY;
  return key ? { authorization: `Bearer ${key}` } : {};
}

export async function uploadAvatar(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<string | null> {
  const base = baseUrl();
  if (!base) return null;
  const url = base + encodeURI(key).replace(/^\//, '');
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...authHeader(),
      'content-type': contentType,
    },
    body: new Uint8Array(bytes),
  });
  if (!res.ok) {
    throw new Error(`PUT ${url} → ${res.status} ${await res.text().catch(() => '')}`);
  }
  return url;
}

export async function avatarUrl(key: string): Promise<string | null> {
  const base = baseUrl();
  if (!base) return null;
  return base + encodeURI(key).replace(/^\//, '');
}

export async function listBlobs(): Promise<unknown[]> {
  const base = baseUrl();
  if (!base) return [];
  const res = await fetch(base, { headers: { ...authHeader() } });
  if (!res.ok) {
    throw new Error(`GET ${base} → ${res.status}`);
  }
  return res.json();
}

// Used by /api/diagnostics: a lightweight reachability check that proves the
// /_embr/blob proxy is responding to authenticated requests. The list endpoint
// is the cheapest way to verify both routing and auth in one call.
export async function blobHealthCheck(): Promise<{ ok: boolean; sample?: number; status?: number; error?: string }> {
  const base = baseUrl();
  if (!base) return { ok: false, error: 'EMBR_BLOB_URL not set' };
  try {
    const res = await fetch(base, { headers: { ...authHeader() } });
    if (!res.ok) return { ok: false, status: res.status };
    const items = (await res.json()) as unknown[];
    return { ok: true, sample: Array.isArray(items) ? items.length : 0 };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

