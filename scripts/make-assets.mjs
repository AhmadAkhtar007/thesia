// Renders the link-preview image (public/og.png) and app icons (public/icon-*.png) with a headless
// browser. Run after changing the brand: `npx playwright install chromium && node scripts/make-assets.mjs`.
// With an internet connection it uses the brand fonts from Google Fonts; offline it falls back to Lora.

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'public');
const pw = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = await import(pw);

const MARK = (size, pad = 0) => {
  const s = 32;
  const inner = s - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
  ${pad ? `<rect width="${s}" height="${s}" fill="#1D2856"/>` : ''}
  <g transform="translate(${pad} ${pad}) scale(${inner / s})">
    <rect width="32" height="32" rx="${pad ? 0 : 7}" fill="#1D2856"/>
    <path d="M8.5 10.5h15" stroke="#FFE45E" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M16 10.5v13" stroke="#F7F9FC" stroke-width="3.4" stroke-linecap="round"/>
  </g>
</svg>`;
};

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'favicon.svg'), MARK(32));

const FONTS =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Atkinson+Hyperlegible+Mono:wght@700&family=Literata:opsz,wght@7..72,600;7..72,700&display=block';

const OG = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}"><style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:repeating-linear-gradient(180deg,#f7f9fc 0,#f7f9fc 41px,#e1e6f0 41px,#e1e6f0 42px);color:#1d2856;
    font-family:'Atkinson Hyperlegible Next',Carlito,'DejaVu Sans',sans-serif;position:relative}
  .margin{position:absolute;left:64px;top:0;bottom:0;width:3px;background:#cf333b;opacity:.6}
  .wrap{position:absolute;left:112px;top:64px;right:80px;bottom:56px;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:18px;font-family:Literata,Lora,Georgia,serif;font-weight:700;font-size:44px}
  h1{font-family:Literata,Lora,Georgia,serif;font-weight:600;font-size:96px;line-height:1.02;letter-spacing:-2px;margin:auto 0 0}
  .hl{background:#ffe45e;border-radius:8px;padding:0 16px;margin-left:-16px}
  p{font-size:30px;line-height:1.35;color:#46517a;margin:28px 0 0;max-width:900px}
  .foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:auto;font-size:24px;color:#46517a}
  .mono{font-family:'Atkinson Hyperlegible Mono','DejaVu Sans Mono',monospace;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#cf333b;font-size:20px}
</style></head><body><div class="margin"></div><div class="wrap">
  <div class="brand">${MARK(64)}Thesia</div>
  <h1>Learn research.<br><span class="hl">Then do it.</span></h1>
  <p>Research projects, free lessons and live bootcamps for students. Started in Pakistan, open to every country.</p>
  <div class="foot" style="margin-top:36px"><span class="mono">Projects · Academy · Bootcamps · Passports</span><span>thesia-gamma.vercel.app</span></div>
</div></body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(OG, { waitUntil: 'load', timeout: 15000 }).catch(() => page.setContent(OG.replace(/<link[^>]+>/, '')));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(out, 'og.png') });

for (const [name, size, pad] of [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['icon-maskable-512.png', 512, 5],
  ['apple-touch-icon.png', 180, 3],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${MARK(size, pad)}</body></html>`);
  await page.screenshot({ path: path.join(out, name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log('Wrote public/og.png, favicon.svg and icons');
