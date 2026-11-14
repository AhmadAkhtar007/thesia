// lemon-webhook: receives Lemon Squeezy payment events and updates Thesia.
//   order_created                 -> marks the bootcamp enrollment as paid
//   subscription_created/updated  -> sets the profile plan to pro (or back to free when it lapses)
// Secret: LEMON_SIGNING_SECRET (the signing secret you set on the webhook in Lemon Squeezy).
// Deploy with verify_jwt = false: Lemon Squeezy authenticates with the X-Signature header instead.
// Checkout links must pass checkout[custom][user_id] (and checkout[custom][bootcamp_id] for bootcamps);
// the app does this automatically.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const SECRET = Deno.env.get('LEMON_SIGNING_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function rest(path: string, init: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`db ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!SECRET) return new Response('not configured', { status: 503 });

  const raw = await req.text();
  const expected = await hmacHex(SECRET, raw);
  if (!safeEqual(expected, req.headers.get('X-Signature') || '')) return new Response('invalid signature', { status: 401 });

  const event = JSON.parse(raw);
  const name: string = event?.meta?.event_name;
  const custom = event?.meta?.custom_data || {};
  const userId: string | undefined = custom.user_id;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return new Response('ignored: no user', { status: 200 });

  try {
    if (name === 'order_created' && custom.bootcamp_id) {
      const attrs = event.data?.attributes || {};
      if (attrs.status !== 'paid') return new Response('ignored: unpaid', { status: 200 });
      await rest('enrollments?on_conflict=user_id,bootcamp_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({
          user_id: userId,
          bootcamp_id: String(custom.bootcamp_id).slice(0, 80),
          status: 'paid',
          price_usd: (attrs.total_usd ?? attrs.total ?? 0) / 100,
          payment_ref: String(event.data?.id ?? ''),
        }),
      });
    } else if (name === 'subscription_created' || name === 'subscription_updated' || name === 'subscription_expired') {
      const status = event.data?.attributes?.status;
      const active = ['active', 'on_trial', 'past_due'].includes(status);
      await rest(`profiles?id=eq.${userId}`, { method: 'PATCH', body: JSON.stringify({ plan: active ? 'pro' : 'free' }) });
    }
  } catch (e) {
    console.error(e);
    return new Response('error', { status: 500 });
  }
  return new Response('ok', { status: 200 });
});
