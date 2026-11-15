// Thesia build script.
//
//   node scripts/build.mjs                    -> production web build in dist/ (deploy to Vercel)
//   node scripts/build.mjs --serve            -> local dev server on http://localhost:5173
//   node scripts/build.mjs --target=artifact  -> one self-contained HTML file in dist-artifact/
//
// Environment (read from the shell or from a .env file in the project root):
//   THESIA_SUPABASE_URL        e.g. https://xxxx.supabase.co
//   THESIA_SUPABASE_ANON_KEY   the project's publishable (anon) key
//   THESIA_CHECKOUT_URLS       optional JSON map of bootcamp id -> Lemon Squeezy checkout URL
//   THESIA_SITE_URL            canonical URL, used for auth redirects, link previews and the sitemap
//                              (defaults to https://thesia-gamma.vercel.app)
//
// The web build also writes one HTML file per public page (e.g. dist/learn.html) with that page's
// title, description and link-preview tags, plus sitemap.xml and robots.txt. vercel.json's
// cleanUrls serves /learn from learn.html; every other path falls back to index.html.
//
// Without Supabase settings the app runs in demo mode with sample data stored in the browser.

import * as esbuild from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const serve = args.includes('--serve');
const target = (args.find((a) => a.startsWith('--target=')) || '--target=web').split('=')[1];

function loadEnv() {
  const env = { ...process.env };
  const file = path.join(root, '.env');
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = target === 'artifact' ? '' : env.THESIA_SUPABASE_URL || '';
const supabaseKey = target === 'artifact' ? '' : env.THESIA_SUPABASE_ANON_KEY || '';
let checkoutUrls = {};
try {
  checkoutUrls = env.THESIA_CHECKOUT_URLS ? JSON.parse(env.THESIA_CHECKOUT_URLS) : {};
} catch {
  console.warn('THESIA_CHECKOUT_URLS is not valid JSON; ignoring it.');
}

const FONTS =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@400;600&family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..500&display=swap';

const TITLE = 'Thesia';
const DESCRIPTION =
  'Find people working on your research question, join real research projects, learn research methods, and track conferences. Free for students.';
const SITE_URL = (env.THESIA_SITE_URL || 'https://thesia-gamma.vercel.app').replace(/\/$/, '');

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function loadSeoRoutes() {
  const tmp = path.join(os.tmpdir(), `thesia-seo-${Date.now()}.mjs`);
  await esbuild.build({ entryPoints: [path.join(root, 'src/seo.ts')], bundle: true, format: 'esm', platform: 'node', outfile: tmp, logLevel: 'warning' });
  const mod = await import(tmp);
  fs.rmSync(tmp);
  return mod.seoRoutes(SITE_URL);
}

const buildOptions = {
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  jsx: 'automatic',
  minify: !serve,
  sourcemap: serve ? 'inline' : false,
  legalComments: 'none',
  loader: { '.md': 'text' },
  define: {
    __TARGET__: JSON.stringify(target),
    __SUPABASE_URL__: JSON.stringify(supabaseUrl),
    __SUPABASE_ANON_KEY__: JSON.stringify(supabaseKey),
    __CHECKOUT_URLS__: JSON.stringify(checkoutUrls),
    __SITE_URL__: JSON.stringify(env.THESIA_SITE_URL || ''),
    'process.env.NODE_ENV': JSON.stringify(serve ? 'development' : 'production'),
  },
  logLevel: 'warning',
};

function htmlShell({ css, js, inline, meta }) {
  const m = meta || { path: '/', title: TITLE, description: DESCRIPTION };
  const title = m.path === '/' ? m.title : `${m.title} | Thesia`;
  const url = SITE_URL + (m.path === '/' ? '/' : m.path);
  const head = `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(m.description)}" />
<link rel="canonical" href="${esc(url)}" />
<meta name="theme-color" content="#F7F9FC" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0F1A3D" media="(prefers-color-scheme: dark)" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Thesia" />
<meta property="og:title" content="${esc(m.title)}" />
<meta property="og:description" content="${esc(m.description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${SITE_URL}/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Thesia: learn research, then do it" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(m.title)}" />
<meta name="twitter:description" content="${esc(m.description)}" />
<meta name="twitter:image" content="${SITE_URL}/og.png" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="apple-mobile-web-app-title" content="Thesia" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${FONTS}" />${m.jsonld ? `\n<script type="application/ld+json">${JSON.stringify(m.jsonld).replace(/</g, '\\u003c')}</script>` : ''}`;
  if (inline) {
    // The Artifact host wraps this file in its own <html>/<head>/<body>, so we emit content only.
    return `<title>${TITLE}</title>
<link rel="stylesheet" href="${FONTS}" />
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
  }
  return `<!doctype html>
<html lang="en">
<head>
${head}
<link rel="stylesheet" href="${css}" />
</head>
<body>
<div id="root"></div>
<noscript><h1>${esc(m.title)}</h1><p>${esc(m.description)}</p><p>Thesia needs JavaScript to run.</p></noscript>
<script type="module" src="${js}"></script>
</body>
</html>
`;
}

function copyPublic(outDir) {
  const pub = path.join(root, 'public');
  if (fs.existsSync(pub)) fs.cpSync(pub, outDir, { recursive: true });
}

const PRIVATE_PATHS = ['/admin', '/dashboard', '/welcome', '/notifications', '/org', '/join/', '/signin', '/signup'];

function writeSeoFiles(outDir, routes, shell) {
  for (const r of routes) {
    if (r.path === '/') continue;
    const file = path.join(outDir, r.path.slice(1) + '.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, shell(r));
  }
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .filter((r) => !r.path.startsWith('/org/'))
    .map((r) => `  <url><loc>${esc(SITE_URL + r.path)}</loc><lastmod>${today}</lastmod><priority>${(r.priority ?? 0.5).toFixed(1)}</priority></url>`)
    .join('\n');
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(
    path.join(outDir, 'robots.txt'),
    `User-agent: *\nAllow: /\n${PRIVATE_PATHS.map((p) => `Disallow: ${p}`).join('\n')}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );
}

async function buildOnce() {
  const result = await esbuild.build({ ...buildOptions, write: false, outdir: 'out' });
  const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;
  const cssFile = result.outputFiles.find((f) => f.path.endsWith('.css'));
  const css = cssFile ? cssFile.text : '';

  if (target === 'artifact') {
    const outDir = path.join(root, 'dist-artifact');
    fs.mkdirSync(outDir, { recursive: true });
    const html = htmlShell({ css, js, inline: true });
    fs.writeFileSync(path.join(outDir, 'thesia.html'), html);
    console.log(`Artifact build: dist-artifact/thesia.html (${(html.length / 1024).toFixed(0)} KB)`);
    return;
  }

  const outDir = path.join(root, 'dist');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
  const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);
  const jsName = `assets/app-${hash(js)}.js`;
  const cssName = `assets/app-${hash(css)}.css`;
  fs.writeFileSync(path.join(outDir, jsName), js);
  fs.writeFileSync(path.join(outDir, cssName), css);
  const routes = await loadSeoRoutes();
  const shell = (meta) => htmlShell({ css: '/' + cssName, js: '/' + jsName, meta });
  fs.writeFileSync(path.join(outDir, 'index.html'), shell(routes.find((r) => r.path === '/')));
  copyPublic(outDir);
  writeSeoFiles(outDir, routes, shell);
  console.log(
    `Web build: dist/ (js ${(js.length / 1024).toFixed(0)} KB, css ${(css.length / 1024).toFixed(0)} KB, ${routes.length} prerendered pages, mode: ${
      supabaseUrl ? 'live (Supabase)' : 'demo'
    })`
  );
}

if (serve) {
  const outDir = path.join(root, '.dev');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), htmlShell({ css: '/app.css', js: '/app.js' }));
  copyPublic(outDir);
  const ctx = await esbuild.context({ ...buildOptions, outdir: outDir, entryNames: 'app' });
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: outDir, port: 5173, fallback: path.join(outDir, 'index.html') });
  console.log(`Thesia dev server: http://localhost:${port}`);
} else {
  await buildOnce();
}
