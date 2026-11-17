// Build-time settings injected by scripts/build.mjs.
declare const __TARGET__: 'web' | 'artifact';
declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;
declare const __CHECKOUT_URLS__: Record<string, string>;
declare const __SITE_URL__: string;
declare const __NEON_DATABASE_URL__: string;
declare const __NEON_AUTH_BASE_URL__: string;
declare const __NEON_REALTIME_URL__: string;
declare const __NEON_FUNCTION_URL__: string;
declare const __NEON_AI_GATEWAY_BASE_URL__: string;

export const TARGET = __TARGET__;
export const SUPABASE_URL = (typeof __SUPABASE_URL__ !== 'undefined' ? __SUPABASE_URL__ : '').replace(/\/$/, '');
export const SUPABASE_ANON_KEY = typeof __SUPABASE_ANON_KEY__ !== 'undefined' ? __SUPABASE_ANON_KEY__ : '';
export const CHECKOUT_URLS: Record<string, string> = typeof __CHECKOUT_URLS__ !== 'undefined' ? __CHECKOUT_URLS__ : {};
export const SITE_URL = (typeof __SITE_URL__ !== 'undefined' && __SITE_URL__) || (typeof location !== 'undefined' ? location.origin : '');

// Neon services configuration
export const NEON_DATABASE_URL = typeof __NEON_DATABASE_URL__ !== 'undefined' ? __NEON_DATABASE_URL__ : '';
export const NEON_AUTH_BASE_URL = typeof __NEON_AUTH_BASE_URL__ !== 'undefined' ? __NEON_AUTH_BASE_URL__ : '';
export const NEON_REALTIME_URL = typeof __NEON_REALTIME_URL__ !== 'undefined' ? __NEON_REALTIME_URL__ : '';
export const NEON_FUNCTION_URL = typeof __NEON_FUNCTION_URL__ !== 'undefined' ? __NEON_FUNCTION_URL__ : '';
export const NEON_AI_GATEWAY_BASE_URL = typeof __NEON_AI_GATEWAY_BASE_URL__ !== 'undefined' ? __NEON_AI_GATEWAY_BASE_URL__ : '';

/** True when the app talks to a live backend (Neon or Supabase). Otherwise it runs on sample data in the browser. */
export const LIVE = TARGET === 'web' && (!!NEON_DATABASE_URL || (!!SUPABASE_URL && !!SUPABASE_ANON_KEY));

/** In the claude.ai artifact the URL can't carry routes, so navigation lives in memory. */
export const ROUTER_MODE: 'history' | 'memory' = TARGET === 'artifact' ? 'memory' : 'history';

/** The date the curated conference, lab and program listings were last checked against official sources. */
export const LISTINGS_VERIFIED_ON = '2026-10-08';

export const CONTACT_EMAIL = 'buraaqteam@gmail.com';
export const FOUNDER = 'Saifaan Ali Khan';
