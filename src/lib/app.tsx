// App-wide state: who is signed in, their profile, saved items, lesson progress,
// chosen country, and toasts. Works the same in demo mode and live mode.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { LIVE } from './config';
import { repo, lessonKey, type SavedItem, type SavedKind } from './repo';
import { auth as sbAuth, onAuthChange } from './client';
import { readJSON, removeKey, uid, writeJSON } from './storage';
import { PASS_MARK, TRACKS } from '../data/academy';
import type { LessonProgress, Profile } from './types';

import { useNavigate, useLocation } from './router';

type User = { id: string; email: string; name?: string };

type AppValue = {
  ready: boolean;
  /** True once the learner's lesson progress has loaded (used to avoid flashing locked lessons). */
  progressReady: boolean;
  user: User | null;
  profile: Profile | null;
  live: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  googleUrl: string | null;
  signOut: () => Promise<void>;
  saveProfile: (patch: Partial<Profile>) => Promise<Profile | null>;
  saved: SavedItem[];
  isSaved: (kind: SavedKind, id: string) => boolean;
  toggleSaved: (kind: SavedKind, id: string) => Promise<void>;
  progress: Record<string, LessonProgress>;
  /** Records a lesson. When it finishes a track, claims the certificate and returns its id. */
  completeLesson: (trackId: string, lessonId: string, score: number) => Promise<string | null>;
  isAdmin: boolean;
  unread: number;
  refreshUnread: () => void;
  referral: string;
  country: string;
  setCountry: (c: string) => void;
  toast: (message: string) => void;
  requireAuth: (reason?: string) => boolean;
};

const AppCtx = createContext<AppValue | null>(null);

const DEMO_USER_KEY = 'demo-user';
/** Demo visitors earn XP and badges without an account, so judges can play the whole curriculum. */
const GUEST_LEARNER = 'demo-guest';

function blankProfile(user: User): Profile {
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    handle: '',
    level: '',
    fields: [],
    city: '',
    country: '',
    affiliation: '',
    headline: '',
    bio: '',
    skills: [],
    goals: [],
    openTo: [],
    links: {},
    outputs: [],
    languages: [],
    badges: [],
    verified: false,
    referredBy: '',
    onboarded: false,
    plan: 'free',
    createdAt: new Date().toISOString(),
  };
}

const REF_KEY = 'ref';
const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/** First-touch referral: ?ref=<handle> on any page is remembered until sign-up. */
function captureReferral(search: string): string {
  const stored = readJSON<string>(REF_KEY, '');
  if (stored) return stored;
  const ref = (new URLSearchParams(search).get('ref') || '').trim().toLowerCase();
  if (HANDLE_RE.test(ref)) {
    writeJSON(REF_KEY, ref);
    return ref;
  }
  return '';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [progress, setProgress] = useState<AppValue['progress']>({});
  const [country, setCountryState] = useState<string>(() => readJSON('country', 'Pakistan'));
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const toastTimers = useRef<number[]>([]);
  const countryTouched = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unread, setUnread] = useState(0);
  const [referral] = useState(() => captureReferral(loc.search));

  const toast = useCallback((message: string) => {
    const id = uid('t');
    setToasts((t) => [...t.slice(-2), { id, message }]);
    toastTimers.current.push(window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200));
  }, []);

  useEffect(() => () => toastTimers.current.forEach(clearTimeout), []);

  // Resolve the current user once on load.
  useEffect(() => {
    if (LIVE) {
      const { error } = sbAuth.consumeRedirect();
      if (error) toast(`Sign-in link problem: ${error}. Request a new link.`);
      const s = sbAuth.session;
      setUser(s ? { id: s.user.id, email: s.user.email } : null);
      const off = onAuthChange((next) => setUser(next ? { id: next.user.id, email: next.user.email } : null));
      setReady(true);
      return () => {
        off();
      };
    }
    setUser(readJSON<User | null>(DEMO_USER_KEY, null));
    setReady(true);
  }, [toast]);

  // Load the signed-in person's data. In demo mode a signed-out visitor still gets a learner
  // record, so lessons, XP and badges work end to end without an account.
  useEffect(() => {
    let cancelled = false;
    const learnerId = user?.id ?? (LIVE ? null : GUEST_LEARNER);
    if (!learnerId) {
      setProfile(null);
      setSaved([]);
      setProgress({});
      setIsAdmin(false);
      setUnread(0);
      setProgressReady(true);
      return;
    }
    setProgressReady(false);
    if (user) repo.isAdmin().then((a) => !cancelled && setIsAdmin(LIVE ? a : false)).catch(() => {});
    (async () => {
      try {
        const [p, s, pr] = await Promise.all([
          user ? repo.getProfile(user.id) : Promise.resolve(null),
          user ? repo.listSaved(user.id) : Promise.resolve([]),
          repo.getProgress(learnerId),
        ]);
        if (cancelled) return;
        let prof: Profile | null = null;
        if (user) {
          prof = p ? { ...p, email: user.email } : { ...blankProfile(user), referredBy: referral };
          if (!p && !LIVE) await repo.saveProfile(prof);
        }
        setProfile(prof);
        setSaved(s);
        setProgress(pr);
        setProgressReady(true);
        if (prof?.country && !countryTouched.current) setCountryState(prof.country);
      } catch (e: any) {
        if (!cancelled) {
          setProgressReady(true);
          toast(`Couldn’t load your account: ${e?.message || 'network error'}.`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, toast, referral]);

  const refreshUnread = useCallback(() => {
    if (!user) return;
    repo
      .listNotifications(user.id)
      .then((ns) => setUnread(ns.filter((n) => !n.readAt).length))
      .catch(() => {});
  }, [user]);

  // Unread count: on sign-in, on every page change, and once a minute while the tab is open.
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, loc.path]);
  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(() => document.visibilityState === 'visible' && refreshUnread(), 60000);
    return () => clearInterval(t);
  }, [user, refreshUnread]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (LIVE) return sbAuth.signUp(email, password, name, referral || undefined);
    const u = { id: 'demo-' + uid(), email, name };
    writeJSON(DEMO_USER_KEY, u);
    setUser(u);
    return { needsConfirmation: false };
  }, [referral]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (LIVE) return sbAuth.signIn(email, password);
    const existing = readJSON<User | null>(DEMO_USER_KEY, null);
    const u = existing && existing.email === email ? existing : { id: 'demo-' + uid(), email };
    writeJSON(DEMO_USER_KEY, u);
    setUser(u);
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (LIVE) return sbAuth.sendMagicLink(email, referral || undefined);
    await signIn(email, '');
  }, [signIn, referral]);

  const signOut = useCallback(async () => {
    if (LIVE) await sbAuth.signOut();
    else removeKey(DEMO_USER_KEY);
    setUser(null);
    navigate('/');
  }, [navigate]);

  const saveProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return null;
      const base = profile || blankProfile(user);
      const next = { ...base, ...patch, id: user.id, email: user.email };
      // People who arrived through a referral link and signed up with Google pick it up here.
      if (!next.referredBy && referral && referral !== next.handle) next.referredBy = referral;
      const savedProfile = await repo.saveProfile(next);
      const merged = { ...next, ...savedProfile, email: user.email };
      setProfile(merged);
      if (merged.country) setCountryState(merged.country);
      return merged;
    },
    [user, profile, referral]
  );

  const requireAuth = useCallback(
    (reason?: string) => {
      if (user) return true;
      const back = loc.path + loc.search;
      navigate(`/signin?next=${encodeURIComponent(back)}${reason ? `&why=${encodeURIComponent(reason)}` : ''}`);
      return false;
    },
    [user, loc, navigate]
  );

  const isSaved = useCallback((kind: SavedKind, id: string) => saved.some((s) => s.kind === kind && s.refId === id), [saved]);

  const toggleSaved = useCallback(
    async (kind: SavedKind, id: string) => {
      if (!requireAuth('save')) return;
      const nowSaved = await repo.toggleSaved(user!.id, kind, id);
      setSaved((s) =>
        nowSaved ? [{ kind, refId: id, createdAt: new Date().toISOString() }, ...s] : s.filter((x) => !(x.kind === kind && x.refId === id))
      );
      toast(nowSaved ? 'Saved to your dashboard' : 'Removed from saved');
    },
    [user, requireAuth, toast]
  );

  const completeLesson = useCallback(
    async (trackId: string, lessonId: string, score: number) => {
      const learnerId = user?.id ?? (LIVE ? null : GUEST_LEARNER);
      if (!learnerId) return null;
      const key = lessonKey(trackId, lessonId);
      const prev = progress[key];
      const best = Math.max(prev?.score ?? 0, score);
      await repo.completeLesson(learnerId, trackId, lessonId, score);
      const next = { ...progress, [key]: { completedAt: new Date().toISOString(), score: best } };
      setProgress(next);
      const track = TRACKS.find((t) => t.id === trackId);
      if (!track || !track.lessons.every((l) => (next[lessonKey(track.id, l.id)]?.score ?? -1) >= PASS_MARK)) return null;
      try {
        const certId = await repo.claimTrackCertificate(learnerId, trackId);
        if (user) {
          const fresh = await repo.getProfile(user.id);
          if (fresh) setProfile((p) => (p ? { ...p, badges: fresh.badges } : p));
        }
        refreshUnread();
        return certId;
      } catch {
        return null;
      }
    },
    [user, progress, refreshUnread]
  );

  const setCountry = useCallback((c: string) => {
    countryTouched.current = true;
    setCountryState(c);
    writeJSON('country', c);
  }, []);

  const value = useMemo<AppValue>(
    () => ({
      ready,
      progressReady,
      user,
      profile,
      live: LIVE,
      signUp,
      signIn,
      sendMagicLink,
      googleUrl: LIVE ? sbAuth.googleUrl() : null,
      signOut,
      saveProfile,
      saved,
      isSaved,
      toggleSaved,
      progress,
      completeLesson,
      country,
      setCountry,
      toast,
      requireAuth,
      isAdmin,
      unread,
      refreshUnread,
      referral,
    }),
    [ready, progressReady, user, profile, signUp, signIn, sendMagicLink, signOut, saveProfile, saved, isSaved, toggleSaved, progress, completeLesson, country, setCountry, toast, requireAuth, isAdmin, unread, refreshUnread, referral]
  );

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error('AppProvider missing');
  return v;
}
