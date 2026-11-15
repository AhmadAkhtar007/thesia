import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { LuBell, LuMenu, LuMonitor, LuMoon, LuSun, LuX } from 'react-icons/lu';
import { useApp } from '../lib/app';
import { CONTACT_EMAIL, LIVE, SITE_URL, TARGET } from '../lib/config';
import { seoRoutes } from '../seo';
import { Link, useIsActive, useLocation } from '../lib/router';
import { readJSON, writeJSON } from '../lib/storage';
import { Avatar, BrandMark } from './ui';

const TITLES = new Map(seoRoutes(SITE_URL).map((r) => [r.path, r.path === '/' ? r.title : `${r.title} | Thesia`]));

const NAV = [
  { to: '/projects', label: 'Projects' },
  { to: '/people', label: 'People' },
  { to: '/conferences', label: 'Conferences' },
  { to: '/labs', label: 'Labs' },
  { to: '/learn', label: 'Learn' },
  { to: '/bootcamps', label: 'Bootcamps' },
  { to: '/tools', label: 'Tools' },
  { to: '/guide', label: 'Guide' },
];

function NavLink({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  const active = useIsActive(to);
  return (
    <Link to={to} className="nav-link" aria-current={active ? 'page' : undefined} onClick={onClick}>
      <span>{label}</span>
    </Link>
  );
}

type ThemePref = 'system' | 'light' | 'dark';

function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
}

function ThemeSwitch() {
  const [pref, setPref] = useState<ThemePref>(() => readJSON<ThemePref>('theme', 'system'));
  useEffect(() => {
    applyTheme(pref);
    writeJSON('theme', pref);
  }, [pref]);
  const opts: { id: ThemePref; label: string; icon: ReactNode }[] = [
    { id: 'system', label: 'Match device', icon: <LuMonitor /> },
    { id: 'light', label: 'Light', icon: <LuSun /> },
    { id: 'dark', label: 'Dark', icon: <LuMoon /> },
  ];
  return (
    <div className="seg" role="group" aria-label="Colour theme">
      {opts.map((o) => (
        <button key={o.id} type="button" aria-pressed={pref === o.id} onClick={() => setPref(o.id)} title={o.label} aria-label={o.label} style={{ display: 'inline-flex', padding: '6px 9px' }}>
          {o.icon}
        </button>
      ))}
    </div>
  );
}

function DemoNote() {
  const [hidden, setHidden] = useState(() => readJSON('demo-note-hidden', false));
  if (LIVE || hidden) return null;
  return (
    <div className="demo-note">
      <p className="wrap">
        <strong>Beta preview.</strong>
        Projects and profiles are samples. Conferences, labs and programmes are real and linked to official pages. What you do here is saved in this browser only.
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            writeJSON('demo-note-hidden', true);
          }}
        >
          Hide
        </button>
      </p>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, profile, unread } = useApp();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => setMenu(false), [loc.path]);
  useEffect(() => {
    if (TARGET === 'web') document.title = TITLES.get(loc.path.replace(/\/$/, '') || '/') || 'Thesia';
  }, [loc.path]);

  return (
    <>
      <a href="#main" className="sr-only" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <header className="site-header">
        <div className="wrap">
          <Link to="/" className="brand" aria-label="Thesia home">
            <BrandMark />
            Thesia
          </Link>
          <nav className="site-nav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} {...n} />
            ))}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-ghost btn-sm hide-sm">
                  Dashboard
                </Link>
                <Link to="/notifications" className="icon-btn bell" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
                  <LuBell />
                  {unread > 0 && <span className="bell-dot">{unread > 9 ? '9+' : unread}</span>}
                </Link>
                <Link to="/dashboard" aria-label="Your dashboard" style={{ textDecoration: 'none' }}>
                  <Avatar name={profile?.name || user.email} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn btn-ghost btn-sm hide-sm">
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Join free
                </Link>
              </>
            )}
            <button type="button" className="icon-btn menu-toggle" aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu ? 'Close menu' : 'Open menu'} onClick={() => setMenu((m) => !m)}>
              {menu ? <LuX /> : <LuMenu />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="mobile-menu" id="mobile-menu">
            <div className="wrap" style={{ display: 'grid', gap: 12 }}>
              <nav aria-label="Main">
                {NAV.map((n) => (
                  <NavLink key={n.to} {...n} onClick={() => setMenu(false)} />
                ))}
                <NavLink to="/opportunities" label="Fellowships & programmes" />
                <NavLink to="/challenges" label="Industry challenges" />
                <NavLink to="/institutions" label="For schools & universities" />
                <NavLink to="/pricing" label="Pricing" />
                {user ? <NavLink to="/dashboard" label="Your dashboard" /> : <NavLink to="/signin" label="Sign in" />}
              </nav>
            </div>
          </div>
        )}
      </header>
      <DemoNote />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <Link to="/" className="brand" aria-label="Thesia home">
              <BrandMark size={22} />
              Thesia
            </Link>
            <p className="small muted" style={{ maxWidth: '32ch' }}>
              The research network for students. Started in Pakistan, open to every country.
            </p>
            <p className="xsmall faint">
              Contact: <span style={{ userSelect: 'all' }}>{CONTACT_EMAIL}</span>
            </p>
          </div>
          <div>
            <h4>Find</h4>
            <ul>
              <li><Link to="/projects">Research projects</Link></li>
              <li><Link to="/opportunities">Fellowships & programmes</Link></li>
              <li><Link to="/challenges">Industry challenges</Link></li>
              <li><Link to="/people">People</Link></li>
              <li><Link to="/conferences">Conferences</Link></li>
              <li><Link to="/labs">Labs & centres</Link></li>
            </ul>
          </div>
          <div>
            <h4>Learn</h4>
            <ul>
              <li><Link to="/learn">Academy</Link></li>
              <li><Link to="/bootcamps">Live bootcamps</Link></li>
              <li><Link to="/tools">Research tools</Link></li>
              <li><Link to="/guide">Research guide</Link></li>
            </ul>
          </div>
          <div>
            <h4>Get involved</h4>
            <ul>
              <li><Link to="/projects/new">Post a project</Link></li>
              <li><Link to="/institutions#teach">Teach a bootcamp</Link></li>
              <li><Link to="/institutions#ambassadors">Campus ambassadors</Link></li>
              <li><Link to="/challenges#post">Post a company challenge</Link></li>
              <li><Link to="/org">Join with a school code</Link></li>
            </ul>
          </div>
          <div>
            <h4>Thesia</h4>
            <ul>
              <li><Link to="/impact">Why Thesia</Link></li>
              <li><Link to="/faculty">Faculty workspace (demo)</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/institutions">For institutions</Link></li>
              <li><Link to="/certificate/verify">Verify a certificate</Link></li>
              <li><Link to="/safeguarding">Safeguarding</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span>© 2026 Thesia. Built in Pakistan for researchers everywhere.</span>
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  );
}
