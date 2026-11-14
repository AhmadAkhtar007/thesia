// A small router. History mode for the deployed site, memory mode inside the claude.ai artifact
// (where the page URL can't change). Routes are matched in order; the first match wins.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Loc = { path: string; search: string; hash: string };
type NavOpts = { replace?: boolean; keepScroll?: boolean };

type RouterValue = {
  loc: Loc;
  navigate: (to: string, opts?: NavOpts) => void;
  back: () => void;
  mode: 'history' | 'memory';
};

const RouterCtx = createContext<RouterValue | null>(null);
const ParamsCtx = createContext<Record<string, string>>({});

function parse(to: string): Loc {
  const hashIdx = to.indexOf('#');
  const hash = hashIdx >= 0 ? to.slice(hashIdx) : '';
  const rest = hashIdx >= 0 ? to.slice(0, hashIdx) : to;
  const qIdx = rest.indexOf('?');
  const path = (qIdx >= 0 ? rest.slice(0, qIdx) : rest) || '/';
  const search = qIdx >= 0 ? rest.slice(qIdx) : '';
  return { path, search, hash };
}

function scrollAfterNav(loc: Loc, keepScroll?: boolean) {
  requestAnimationFrame(() => {
    if (loc.hash) {
      const el = document.getElementById(decodeURIComponent(loc.hash.slice(1)));
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    if (!keepScroll) window.scrollTo(0, 0);
  });
}

export function Router({ mode, children }: { mode: 'history' | 'memory'; children: ReactNode }) {
  const [loc, setLoc] = useState<Loc>(() =>
    mode === 'history'
      ? { path: window.location.pathname, search: window.location.search, hash: window.location.hash }
      : { path: '/', search: '', hash: '' }
  );
  const stack = useRef<Loc[]>([]);

  useEffect(() => {
    if (mode !== 'history') return;
    const onPop = () =>
      setLoc({ path: window.location.pathname, search: window.location.search, hash: window.location.hash });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [mode]);

  const navigate = useCallback(
    (to: string, opts: NavOpts = {}) => {
      const next = parse(to.startsWith('?') ? loc.path + to : to);
      if (mode === 'history') {
        const url = next.path + next.search + next.hash;
        if (opts.replace) window.history.replaceState({}, '', url);
        else window.history.pushState({}, '', url);
      } else if (!opts.replace) {
        stack.current.push(loc);
      }
      setLoc(next);
      scrollAfterNav(next, opts.keepScroll || (opts.replace && next.path === loc.path));
    },
    [mode, loc]
  );

  const back = useCallback(() => {
    if (mode === 'history') window.history.back();
    else {
      const prev = stack.current.pop();
      if (prev) setLoc(prev);
      else setLoc({ path: '/', search: '', hash: '' });
    }
  }, [mode]);

  const value = useMemo(() => ({ loc, navigate, back, mode }), [loc, navigate, back, mode]);
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}

function useRouter() {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error('Router missing');
  return ctx;
}

export const useLocation = () => useRouter().loc;
export const useNavigate = () => useRouter().navigate;
export const useBack = () => useRouter().back;
export const useParams = () => useContext(ParamsCtx);

/** Read and update query-string state, e.g. filters. Updates replace the current entry. */
export function useQueryState(): [URLSearchParams, (patch: Record<string, string | null>) => void] {
  const { loc, navigate } = useRouter();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(loc.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      navigate(loc.path + (qs ? '?' + qs : ''), { replace: true, keepScroll: true });
    },
    [loc, navigate]
  );
  return [params, update];
}

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const s = path.replace(/\/+$/, '').split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

export type RouteDef = { path: string; element: ReactNode };

export function Routes({ routes, fallback }: { routes: RouteDef[]; fallback: ReactNode }) {
  const { loc } = useRouter();
  for (const r of routes) {
    const params = matchPath(r.path, loc.path);
    if (params) return <ParamsCtx.Provider value={params}>{r.element}</ParamsCtx.Provider>;
  }
  return <>{fallback}</>;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; replace?: boolean };

export function Link({ to, replace, onClick, children, ...rest }: LinkProps) {
  const { navigate, mode } = useRouter();
  const external = /^https?:\/\//.test(to);
  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer noopener" onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
        if (modified && mode === 'history') return;
        e.preventDefault();
        navigate(to, { replace });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** True when `path` is the current page or a section under it. */
export function useIsActive(path: string) {
  const { loc } = useRouter();
  return path === '/' ? loc.path === '/' : loc.path === path || loc.path.startsWith(path + '/');
}
