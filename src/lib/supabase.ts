// Unified backend client supporting Neon Serverless Postgres, Neon Auth, Neon Functions,
// and Supabase fallback.

import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  SITE_URL,
  NEON_DATABASE_URL,
  NEON_AUTH_BASE_URL,
  NEON_FUNCTION_URL,
} from './config';
import { readJSON, removeKey, writeJSON } from './storage';
import { neonDb } from './neon-db';

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  user: { id: string; email: string; user_metadata?: Record<string, unknown> };
}

const SESSION_KEY = 'session';
let session: Session | null = readJSON<Session | null>(SESSION_KEY, null);
const listeners = new Set<(s: Session | null) => void>();

function setSession(next: Session | null) {
  session = next;
  if (next) writeJSON(SESSION_KEY, next);
  else removeKey(SESSION_KEY);
  listeners.forEach((fn) => fn(next));
}

export function onAuthChange(fn: (s: Session | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, init: RequestInit & { auth?: boolean } = {}) {
  const headers = new Headers(init.headers);
  headers.set('apikey', SUPABASE_ANON_KEY);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (init.auth !== false) {
    const token = await getAccessToken();
    headers.set('Authorization', `Bearer ${token || SUPABASE_ANON_KEY}`);
  }
  const res = await fetch(SUPABASE_URL + path, { ...init, headers });
  const text = await res.text();
  const data = text ? safeJSON(text) : null;
  if (!res.ok) {
    const msg =
      (data && (data.msg || data.message || data.error_description || data.error)) || `Request failed (${res.status})`;
    throw new ApiError(String(msg), res.status);
  }
  return data;
}

function safeJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function toSession(data: any): Session {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    user: data.user,
  };
}

let refreshing: Promise<void> | null = null;

export async function getAccessToken(): Promise<string | null> {
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at - now < 60 && session.refresh_token) {
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const data = await request('/auth/v1/token?grant_type=refresh_token', {
            method: 'POST',
            auth: false,
            body: JSON.stringify({ refresh_token: session!.refresh_token }),
          });
          setSession(toSession(data));
        } catch {
          setSession(null);
        } finally {
          refreshing = null;
        }
      })();
    }
    await refreshing;
  }
  return session?.access_token ?? null;
}

export const auth = {
  get session() {
    return session;
  },

  /** Picks up tokens from a magic-link or OAuth redirect (implicit flow puts them in the URL hash). */
  consumeRedirect(): { error?: string } {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    if (!hash) return {};
    const p = new URLSearchParams(hash);
    const err = p.get('error_description') || p.get('error');
    if (err) {
      history.replaceState({}, '', window.location.pathname + window.location.search);
      return { error: err.replace(/\+/g, ' ') };
    }
    const access = p.get('access_token');
    const refresh = p.get('refresh_token');
    if (access && refresh) {
      const expiresIn = Number(p.get('expires_in') || 3600);
      const claims = decodeJwt(access);
      setSession({
        access_token: access,
        refresh_token: refresh,
        expires_at: Number(p.get('expires_at')) || Math.floor(Date.now() / 1000) + expiresIn,
        user: { id: claims.sub, email: claims.email, user_metadata: claims.user_metadata },
      });
      history.replaceState({}, '', window.location.pathname + window.location.search);
    }
    return {};
  },

  async signUp(email: string, password: string, name: string, ref?: string) {
    if (NEON_AUTH_BASE_URL) {
      const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, callbackURL: SITE_URL + '/welcome' }),
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data?.message || 'Sign up failed', res.status);
      if (data?.token || data?.session?.token) {
        setSession({
          access_token: data.token || data.session?.token || '',
          refresh_token: '',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: { id: data.user?.id || '', email: data.user?.email || email, user_metadata: { name } },
        });
        return { needsConfirmation: false };
      }
      return { needsConfirmation: true };
    }

    const data = await request(`/auth/v1/signup?redirect_to=${encodeURIComponent(SITE_URL + '/welcome')}`, {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password, data: ref ? { name, ref } : { name } }),
    });
    if (data?.access_token) {
      setSession(toSession(data));
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  },

  async signIn(email: string, password: string) {
    if (NEON_AUTH_BASE_URL) {
      const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data?.message || 'Sign in failed', res.status);
      setSession({
        access_token: data.token || data.session?.token || '',
        refresh_token: '',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: data.user?.id || '', email: data.user?.email || email, user_metadata: { name: data.user?.name } },
      });
      return;
    }

    const data = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setSession(toSession(data));
  },

  async sendMagicLink(email: string, ref?: string) {
    if (NEON_AUTH_BASE_URL) {
      const res = await fetch(`${NEON_AUTH_BASE_URL}/magic-link/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, callbackURL: SITE_URL + '/welcome' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data?.message || 'Failed to send magic link', res.status);
      }
      return;
    }

    await request(`/auth/v1/otp?redirect_to=${encodeURIComponent(SITE_URL + '/welcome')}`, {
      method: 'POST',
      auth: false,
      body: JSON.stringify(ref ? { email, create_user: true, data: { ref } } : { email, create_user: true }),
    });
  },

  googleUrl() {
    if (NEON_AUTH_BASE_URL) {
      return `${NEON_AUTH_BASE_URL}/sign-in/social?provider=google&callbackURL=${encodeURIComponent(SITE_URL + '/welcome')}`;
    }
    return `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(SITE_URL + '/welcome')}`;
  },

  async signOut() {
    try {
      if (NEON_AUTH_BASE_URL && session) {
        await fetch(`${NEON_AUTH_BASE_URL}/sign-out`, { method: 'POST' }).catch(() => {});
      } else if (session) {
        await request('/auth/v1/logout', { method: 'POST' }).catch(() => {});
      }
    } catch {
      /* local session is cleared either way */
    }
    setSession(null);
  },
};

function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(payload))));
  } catch {
    return {};
  }
}

/** Database query interface: delegates to Neon Serverless Postgres when configured, or Supabase PostgREST. */
export const db = {
  select<T = any>(table: string, query = 'select=*'): Promise<T[]> {
    if (NEON_DATABASE_URL) return neonDb.select<T>(table, query);
    return request(`/rest/v1/${table}?${query}`, { method: 'GET' });
  },
  async one<T = any>(table: string, query: string): Promise<T | null> {
    if (NEON_DATABASE_URL) return neonDb.one<T>(table, query);
    const rows = await request(`/rest/v1/${table}?${query}&limit=1`, { method: 'GET' });
    return rows?.[0] ?? null;
  },
  insert<T = any>(table: string, row: object | object[]): Promise<T[]> {
    if (NEON_DATABASE_URL) return neonDb.insert<T>(table, row);
    return request(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
  },
  async insertQuiet(table: string, row: object | object[]): Promise<void> {
    if (NEON_DATABASE_URL) return neonDb.insertQuiet(table, row);
    await request(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
  },
  upsert<T = any>(table: string, row: object | object[], onConflict?: string): Promise<T[]> {
    if (NEON_DATABASE_URL) return neonDb.upsert<T>(table, row, onConflict);
    return request(`/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`, {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify(row),
    });
  },
  update<T = any>(table: string, filter: string, patch: object): Promise<T[]> {
    if (NEON_DATABASE_URL) return neonDb.update<T>(table, filter, patch);
    return request(`/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
  },
  remove(table: string, filter: string) {
    if (NEON_DATABASE_URL) return neonDb.remove(table, filter);
    return request(`/rest/v1/${table}?${filter}`, { method: 'DELETE' });
  },
  rpc<T = any>(fn: string, args: object): Promise<T> {
    if (NEON_DATABASE_URL) return neonDb.rpc<T>(fn, args as any);
    return request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
  },
};

export async function invokeFunction<T = any>(name: string, body: object): Promise<T> {
  if (NEON_FUNCTION_URL) {
    const res = await fetch(NEON_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: name, ...body }),
    });
    if (!res.ok) throw new ApiError(`Function ${name} failed (${res.status})`, res.status);
    const text = await res.text();
    return (text ? safeJSON(text) : {}) as T;
  }
  return request(`/functions/v1/${name}`, { method: 'POST', body: JSON.stringify(body) });
}
