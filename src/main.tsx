import { createRoot } from 'react-dom/client';
import { App } from './App';
import { TARGET } from './lib/config';
import './styles/app.css';

// Apply the saved colour theme before first paint to avoid a flash.
try {
  const pref = JSON.parse(localStorage.getItem('thesia:theme') || '"system"');
  if (pref === 'light' || pref === 'dark') document.documentElement.setAttribute('data-theme', pref);
} catch {
  /* storage unavailable */
}

createRoot(document.getElementById('root')!).render(<App />);

// Installable app and offline shell, on the deployed site only (not in previews or local dev).
if (TARGET === 'web' && 'serviceWorker' in navigator && location.protocol === 'https:' && window.top === window.self) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* the site works without it */
    });
  });
}
