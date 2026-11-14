// ask-thesia: the AI research guide.
// Secrets (set with `supabase secrets set ...`):
//   ANTHROPIC_API_KEY      required. Without it the function answers 503 and the app uses its built-in coach.
//   THESIA_GUIDE_MODEL     optional, default claude-haiku-5-5 (Pro users get THESIA_GUIDE_MODEL_PRO, default claude-sonnet-5-5).
// Supabase provides SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY automatically.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = Deno.env.get('THESIA_GUIDE_MODEL') ?? 'claude-haiku-5-5';
const MODEL_PRO = Deno.env.get('THESIA_GUIDE_MODEL_PRO') ?? 'claude-sonnet-5-5';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FREE_DAILY_LIMIT = 10;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM = `You are Thesia Guide, a research mentor inside Thesia, a platform where students (high school to master's) find research projects, collaborators, labs and conferences, and learn research methods. Most users are in Pakistan; many read English as a second language.

How to answer:
- Be practical and specific. Short paragraphs or a short list. Under 220 words unless asked for more.
- Plain English. If the person writes in Urdu or Roman Urdu, answer in the same style.
- When someone shares a research idea, help them sharpen it into a question that names who, where, when and what is measured, and check it against FINER (feasible, interesting, novel, ethical, relevant).
- Point to Thesia pages from the CONTEXT when they genuinely fit, as markdown links using the given paths.
- Never invent papers, authors, DOIs, statistics, deadlines or people. Tell people to verify dates on official sites.
- Raise ethics where people are involved (consent, minors, sensitive data). Do not write someone's thesis or fabricate data for them; coach them to do the work.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`db ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!ANTHROPIC_KEY) return json({ error: 'not_configured' }, 503);

  // Who is asking?
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
  if (!userRes.ok) return json({ error: 'sign_in_required' }, 401);
  const user = await userRes.json();

  let body: { messages?: { role: string; content: string }[]; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const messages = (body.messages || [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'bad_request' }, 400);
  while (messages.length && messages[0].role !== 'user') messages.shift();

  // Daily quota for the free plan.
  const [profile] = await rest(`profiles?select=plan&id=eq.${user.id}`);
  const pro = profile?.plan === 'pro';
  const today = new Date().toISOString().slice(0, 10);
  const [usage] = await rest(`guide_usage?select=count&user_id=eq.${user.id}&day=eq.${today}`);
  const used = usage?.count ?? 0;
  if (!pro && used >= FREE_DAILY_LIMIT) return json({ error: 'daily_limit', limit: FREE_DAILY_LIMIT }, 429);

  const context = JSON.stringify(body.context ?? {}).slice(0, 12000);
  const ai = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: pro ? MODEL_PRO : MODEL,
      max_tokens: 900,
      system: `${SYSTEM}\n\nCONTEXT (Thesia pages you may link to):\n${context}`,
      messages,
    }),
  });
  if (!ai.ok) {
    console.error('anthropic error', ai.status, await ai.text());
    return json({ error: 'upstream_error' }, 502);
  }
  const data = await ai.json();
  const text = (data.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('\n').trim();

  await rest('guide_usage?on_conflict=user_id,day', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ user_id: user.id, day: today, count: used + 1 }),
  }).catch((e) => console.error('usage update failed', e));

  return json({ text, remaining: pro ? null : FREE_DAILY_LIMIT - used - 1 });
});
