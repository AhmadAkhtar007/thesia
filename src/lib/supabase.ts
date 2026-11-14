// A small, dependency-free Supabase client: auth (email + password, magic link, Google) through
// GoTrue, data through PostgREST, and calls to Edge Functions. It covers exactly what Thesia uses.
// If you prefer the official SDK later, swap this file for @supabase/supabase-js; the rest of the
// app only talks to it through src/lib/repo/remote.ts and src/lib/app.tsx.

import { SUPABASE_ANON_KEY, SUPABASE_URL, SITE_URL } from './config';
import { readJSON, removeKey, writeJSON } from './storage';

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
  if (session.expires_at - now < 60) {
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
    const data = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setSession(toSession(data));
  },

  async sendMagicLink(email: string, ref?: string) {
    await request(`/auth/v1/otp?redirect_to=${encodeURIComponent(SITE_URL + '/welcome')}`, {
      method: 'POST',
      auth: false,
      body: JSON.stringify(ref ? { email, create_user: true, data: { ref } } : { email, create_user: true }),
    });
  },

  googleUrl() {
    return `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(SITE_URL + '/welcome')}`;
  },

  async signOut() {
    try {
      if (session) await request('/auth/v1/logout', { method: 'POST' });
    } catch {
      /* the local session is cleared either way */
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

/** PostgREST helpers. `query` is a raw PostgREST query string, e.g. "select=*&status=eq.open". */
export const db = {
  select<T = any>(table: string, query = 'select=*'): Promise<T[]> {
    return request(`/rest/v1/${table}?${query}`, { method: 'GET' });
  },
  async one<T = any>(table: string, query: string): Promise<T | null> {
    const rows = await request(`/rest/v1/${table}?${query}&limit=1`, { method: 'GET' });
    return rows?.[0] ?? null;
  },
  insert<T = any>(table: string, row: object | object[]): Promise<T[]> {
    return request(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
  },
  /** Insert without reading the row back, for tables the caller may write but not read (e.g. submissions). */
  async insertQuiet(table: string, row: object | object[]): Promise<void> {
    await request(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
  },
  upsert<T = any>(table: string, row: object | object[], onConflict?: string): Promise<T[]> {
    return request(`/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`, {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify(row),
    });
  },
  update<T = any>(table: string, filter: string, patch: object): Promise<T[]> {
    return request(`/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
  },
  remove(table: string, filter: string) {
    return request(`/rest/v1/${table}?${filter}`, { method: 'DELETE' });
  },
  rpc<T = any>(fn: string, args: object): Promise<T> {
    return request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
  },
};

export function invokeFunction<T = any>(name: string, body: object): Promise<T> {
  return request(`/functions/v1/${name}`, { method: 'POST', body: JSON.stringify(body) });
}
