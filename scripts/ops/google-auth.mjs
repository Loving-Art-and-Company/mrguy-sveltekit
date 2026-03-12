import postgres from 'postgres';
import { loadLocalEnv } from './env.mjs';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

async function refreshAccessToken(refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: getRequiredEnv('GOOGLE_CLIENT_ID'),
      client_secret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Google access token: ${errorText}`);
  }

  return response.json();
}

function isTokenStillValid(expiresAt) {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  return expiry > Date.now() + 5 * 60 * 1000;
}

export async function getGoogleAccessToken() {
  loadLocalEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return {
      ok: false,
      status: 'unconfigured',
      reason: 'DATABASE_URL is required for Google-connected ops scripts.',
    };
  }

  const sql = postgres(connectionString, { ssl: 'require', max: 1 });

  try {
    const rows = await sql`
      select id, user_id, refresh_token, access_token, expires_at, email, updated_at
      from google_tokens
      order by updated_at desc
      limit 1
    `;

    if (rows.length === 0) {
      return {
        ok: false,
        status: 'unconfigured',
        reason: 'No Google account is connected yet. Reconnect Google from the admin area first.',
      };
    }

    const tokenRow = rows[0];

    if (tokenRow.access_token && isTokenStillValid(tokenRow.expires_at)) {
      return {
        ok: true,
        status: 'ok',
        accessToken: tokenRow.access_token,
        accountEmail: tokenRow.email ?? null,
        source: 'stored',
      };
    }

    const refreshed = await refreshAccessToken(tokenRow.refresh_token);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    await sql`
      update google_tokens
      set access_token = ${refreshed.access_token},
          expires_at = ${expiresAt.toISOString()},
          updated_at = now()
      where id = ${tokenRow.id}
    `;

    return {
      ok: true,
      status: 'ok',
      accessToken: refreshed.access_token,
      accountEmail: tokenRow.email ?? null,
      source: 'refreshed',
    };
  } catch (error) {
    return {
      ok: false,
      status: 'degraded',
      reason: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function googleApiFetch(url, options = {}) {
  const auth = await getGoogleAccessToken();
  if (!auth.ok) {
    return auth;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        ...(options.headers ?? {}),
      },
    });

    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status === 403 ? 'degraded' : 'failed',
        reason: typeof body === 'string' ? body : body?.error?.message ?? `Google API error ${response.status}`,
        responseStatus: response.status,
        accountEmail: auth.accountEmail,
      };
    }

    return {
      ok: true,
      status: 'ok',
      data: body,
      accountEmail: auth.accountEmail,
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
      accountEmail: auth.accountEmail,
    };
  }
}
