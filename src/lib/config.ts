// Build-time settings injected by scripts/build.mjs.
declare const __TARGET__: 'web' | 'artifact';
declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;
declare const __CHECKOUT_URLS__: Record<string, string>;
declare const __SITE_URL__: string;

export const TARGET = __TARGET__;
export const SUPABASE_URL = __SUPABASE_URL__.replace(/\/$/, '');
export const SUPABASE_ANON_KEY = __SUPABASE_ANON_KEY__;
export const CHECKOUT_URLS: Record<string, string> = __CHECKOUT_URLS__ || {};
export const SITE_URL = __SITE_URL__ || (typeof location !== 'undefined' ? location.origin : '');

/** True when the app talks to a real Supabase backend. Otherwise it runs on sample data in the browser. */
export const LIVE = TARGET === 'web' && !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

/** In the claude.ai artifact the URL can't carry routes, so navigation lives in memory. */
export const ROUTER_MODE: 'history' | 'memory' = TARGET === 'artifact' ? 'memory' : 'history';

/** The date the curated conference, lab and program listings were last checked against official sources. */
export const LISTINGS_VERIFIED_ON = '2026-10-08';

export const CONTACT_EMAIL = 'buraaqteam@gmail.com';
export const FOUNDER = 'Saifaan Ali Khan';
