// Demo-mode data store. Seeds sample projects and people, and keeps everything the visitor
// does (profile, applications, saved items, lesson progress, certificates, cohort work) in
// their browser. In demo mode the admin console is open to anyone so the product can be shown
// end to end; the live database restricts it to the Thesia team.

import { PASS_MARK, TRACKS } from '../../data/academy';
import { bootcampById } from '../../data/bootcamps';
import { SAMPLE_PEOPLE } from '../../data/samplePeople';
import { SAMPLE_PROJECTS } from '../../data/sampleProjects';
import { SAMPLE_CERTIFICATES, SAMPLE_ORG, SAMPLE_ORG_REPORT } from '../../data/samples';
import { readJSON, uid, writeJSON } from '../storage';
import type {
  Application,
  Assignment,
  Certificate,
  Cohort,
  Contribution,
  CreditRole,
  Enrollment,
  LessonProgress,
  Message,
  Notice,
  Organization,
  OrgReportRow,
  Person,
  Profile,
  Project,
} from '../types';
import { COHORT_ACCESS } from '../types';
import {
  lessonKey,
  type AdminOverview,
  type InboxItem,
  type NewProject,
  type Repo,
  type SavedItem,
  type SavedKind,
  type Submission,
} from './types';

type DB = {
  projects: Project[];
  applications: Application[];
  profiles: Profile[];
  saved: Record<string, SavedItem[]>;
  progress: Record<string, Record<string, LessonProgress>>;
  enrollments: Enrollment[];
  submissions: InboxItem[];
  certificates: Certificate[];
  notices: (Notice & { userId: string })[];
  messages: Message[];
  contributions: Contribution[];
  orgs: Organization[];
  members: { orgId: string; userId: string; role: 'admin' | 'member'; joinedAt: string }[];
  cohorts: Cohort[];
  assignments: Assignment[];
};

const KEY = 'demo-db-v1';
const empty: DB = {
  projects: [],
  applications: [],
  profiles: [],
  saved: {},
  progress: {},
  enrollments: [],
  submissions: [],
  certificates: [],
  notices: [],
  messages: [],
  contributions: [],
  orgs: [],
  members: [],
  cohorts: [],
  assignments: [],
};
const stored = readJSON<Partial<DB>>(KEY, {});
let db: DB = { ...empty, ...stored };
// Older demo data stored submissions without an id or status.
db.submissions = db.submissions.map((s: any) => ({ id: s.id || uid('s-'), status: s.status || 'new', adminNote: s.adminNote || '', ...s }));
db.profiles = db.profiles.map((p: any) => ({ outputs: [], languages: [], badges: [], verified: false, referredBy: '', ...p }));
const persist = () => writeJSON(KEY, db);
const now = () => new Date().toISOString();
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 60));

function notify(userId: string | undefined, kind: string, title: string, body: string, link: string) {
  if (!userId) return;
  db.notices.unshift({ id: uid('n-'), userId, kind, title, body, link, readAt: null, createdAt: now() });
  db.notices = db.notices.slice(0, 200);
}

function creditFor(userId: string) {
  const out: Partial<Record<CreditRole, number>> = {};
  db.contributions.filter((c) => c.userId === userId).forEach((c) => c.roles.forEach((r) => (out[r] = (out[r] || 0) + 1)));
  return out;
}

export function profileToPerson(p: Profile): Person {
  return {
    id: p.id,
    handle: p.handle,
    name: p.name || 'New researcher',
    headline: p.headline || 'Getting started in research',
    affiliation: p.affiliation,
    city: p.city,
    country: p.country,
    level: (p.level || 'undergrad') as Person['level'],
    fields: p.fields,
    skills: p.skills,
    credit: creditFor(p.id),
    bio: p.bio,
    openTo: p.openTo,
    outputs: p.outputs || [],
    languages: p.languages || [],
    links: p.links,
    badges: p.badges || [],
    joined: p.createdAt.slice(0, 10),
    isSample: false,
    verified: p.verified,
  };
}

const samplePersonById = (id: string) => SAMPLE_PEOPLE.find((p) => p.id === id || `sample-${p.handle}` === id) || null;
const nameOf = (userId: string) => db.profiles.find((p) => p.id === userId)?.name || 'Thesia learner';
const hasAccess = (userId: string, bootcampId: string) => {
  const e = db.enrollments.find((x) => x.userId === userId && x.bootcampId === bootcampId);
  if (!e) return false;
  return COHORT_ACCESS.includes(e.status) || (e.status === 'reserved' && (bootcampById(bootcampId)?.priceUsd ?? 1) === 0);
};

function issueCertificate(userId: string, kind: Certificate['kind'], refId: string, title: string, detail: string) {
  const existing = db.certificates.find((c) => c.userId === userId && c.kind === kind && c.refId === refId);
  if (existing) {
    existing.revoked = false;
    return existing.id;
  }
  const code = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  const cert: Certificate = { id: `TH-${code()}-${code()}`, userId, kind, refId, title, recipientName: nameOf(userId), detail, issuedAt: now(), revoked: false };
  db.certificates.push(cert);
  notify(userId, 'certificate', `Certificate issued: ${title}`, 'Add it to LinkedIn or share the verification link.', `/certificate/${cert.id}`);
  return cert.id;
}

function memberReport(userId: string, role: 'admin' | 'member', joinedAt: string): OrgReportRow {
  const p = db.profiles.find((x) => x.id === userId);
  const prog = db.progress[userId] || {};
  const apps = db.applications.filter((a) => a.userId === userId);
  const times = [joinedAt, ...Object.values(prog).map((x) => x.completedAt), ...apps.map((a) => a.createdAt)].sort();
  return {
    userId,
    name: p?.name || 'Member',
    handle: p?.handle || '',
    level: p?.level || '',
    role,
    joinedAt,
    lessonsCompleted: Object.keys(prog).length,
    tracksCompleted: (p?.badges || []).length,
    applications: apps.length,
    accepted: apps.filter((a) => a.status === 'accepted').length,
    bootcamps: db.enrollments.filter((e) => e.userId === userId).map((e) => `${e.bootcampId}:${e.status}`),
    certificates: db.certificates.filter((c) => c.userId === userId && !c.revoked).length,
    lastActive: times[times.length - 1],
  };
}

export const localRepo: Repo = {
  async listProjects() {
    return delay([...db.projects, ...SAMPLE_PROJECTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async getProject(id) {
    return delay(db.projects.find((p) => p.id === id) || SAMPLE_PROJECTS.find((p) => p.id === id) || null);
  },
  async createProject(input: NewProject, ownerId) {
    const project: Project = {
      ...input,
      id: uid('p-'),
      createdAt: now().slice(0, 10),
      isSample: false,
      status: 'open',
      ownerId,
    };
    db.projects.unshift(project);
    persist();
    return delay(project);
  },
  async closeProject(id) {
    db.projects = db.projects.map((p) => (p.id === id ? { ...p, status: 'closed' } : p));
    persist();
  },
  async myProjects(ownerId) {
    return delay(db.projects.filter((p) => p.ownerId === ownerId));
  },

  async listPeople() {
    // School students' passports are private (see /safeguarding).
    const real = db.profiles.filter((p) => p.onboarded && p.level !== 'high-school').map(profileToPerson);
    return delay([...real, ...SAMPLE_PEOPLE]);
  },
  async getPerson(handle) {
    const own = db.profiles.find((p) => p.handle === handle);
    return delay(own ? profileToPerson(own) : SAMPLE_PEOPLE.find((p) => p.handle === handle) || null);
  },
  async getPersonById(id) {
    const own = db.profiles.find((p) => p.id === id);
    return delay(own ? profileToPerson(own) : samplePersonById(id));
  },

  async getProfile(userId) {
    return delay(db.profiles.find((p) => p.id === userId) || null);
  },
  async saveProfile(profile) {
    const i = db.profiles.findIndex((p) => p.id === profile.id);
    const prev = i >= 0 ? db.profiles[i] : null;
    // Mirror the database: badges and verification can't be set by the person, and a referral is set once.
    const next: Profile = {
      ...profile,
      badges: prev?.badges || [],
      verified: prev?.verified || false,
      referredBy: prev?.referredBy || (profile.referredBy !== profile.handle ? profile.referredBy : '') || '',
    };
    if (i >= 0) db.profiles[i] = next;
    else db.profiles.push(next);
    persist();
    return delay(next);
  },
  async handleAvailable(handle, userId) {
    const taken =
      SAMPLE_PEOPLE.some((p) => p.handle === handle) || db.profiles.some((p) => p.handle === handle && p.id !== userId);
    return delay(!taken);
  },
  async referralCount(userId) {
    const me = db.profiles.find((p) => p.id === userId);
    return delay(me?.handle ? db.profiles.filter((p) => p.referredBy === me.handle).length : 0);
  },

  async apply(app) {
    const a: Application = { ...app, id: uid('a-'), status: 'sent', createdAt: now() };
    db.applications.unshift(a);
    const project = db.projects.find((p) => p.id === app.projectId);
    if (project?.ownerId && project.ownerId !== app.userId)
      notify(project.ownerId, 'application', `New application: ${app.applicantName}`, `For ${project.title}`, `/projects/${project.id}`);
    persist();
    return delay(a);
  },
  async myApplications(userId) {
    return delay(db.applications.filter((a) => a.userId === userId));
  },
  async applicationsForProject(projectId) {
    return delay(db.applications.filter((a) => a.projectId === projectId));
  },
  async setApplicationStatus(id, status) {
    db.applications = db.applications.map((a) => (a.id === id ? { ...a, status } : a));
    const a = db.applications.find((x) => x.id === id);
    const project = a && (db.projects.find((p) => p.id === a.projectId) || SAMPLE_PROJECTS.find((p) => p.id === a.projectId));
    if (a && project && ['shortlisted', 'accepted', 'declined'].includes(status))
      notify(a.userId, 'application-status', status === 'accepted' ? `You were accepted: ${project.title}` : status === 'shortlisted' ? `You were shortlisted: ${project.title}` : `Update on your application: ${project.title}`, 'Open the project to message the lead.', `/projects/${project.id}`);
    persist();
  },

  async listMessages(applicationId) {
    return delay(db.messages.filter((m) => m.applicationId === applicationId));
  },
  async sendMessage(applicationId, senderId, body) {
    const m: Message = { id: uid('m-'), applicationId, senderId, body: body.slice(0, 2000), createdAt: now() };
    db.messages.push(m);
    const a = db.applications.find((x) => x.id === applicationId);
    const project = a && db.projects.find((p) => p.id === a.projectId);
    const target = a && (senderId === a.userId ? project?.ownerId : a.userId);
    if (a && target && target !== senderId)
      notify(target, 'message', senderId === a.userId ? `Message from ${a.applicantName}` : 'Message from the project lead', body.slice(0, 140), `/projects/${a.projectId}?thread=${a.id}`);
    persist();
    return delay(m);
  },

  async confirmContribution(applicationId, roles, note) {
    const a = db.applications.find((x) => x.id === applicationId);
    if (!a) throw new Error('Application not found');
    if (a.status !== 'accepted') throw new Error('Mark the application accepted before confirming a contribution.');
    const project = db.projects.find((p) => p.id === a.projectId);
    const existing = db.contributions.find((c) => c.applicationId === applicationId);
    if (existing) Object.assign(existing, { roles, note });
    else
      db.contributions.push({
        id: uid('c-'),
        applicationId,
        projectId: a.projectId,
        projectTitle: project?.title || 'Project',
        userId: a.userId,
        roles,
        note,
        confirmedByName: project?.lead.name || '',
        createdAt: now(),
      });
    notify(a.userId, 'contribution', `Contribution confirmed: ${project?.title || 'project'}`, 'Your CRediT roles are now on your research passport.', '/dashboard');
    persist();
  },
  async contributionsFor(userId) {
    return delay(db.contributions.filter((c) => c.userId === userId));
  },

  async listSaved(userId) {
    return delay(db.saved[userId] || []);
  },
  async toggleSaved(userId, kind: SavedKind, refId) {
    const list = db.saved[userId] || [];
    const exists = list.some((s) => s.kind === kind && s.refId === refId);
    db.saved[userId] = exists
      ? list.filter((s) => !(s.kind === kind && s.refId === refId))
      : [{ kind, refId, createdAt: now() }, ...list];
    persist();
    return delay(!exists);
  },

  async getProgress(userId) {
    return delay(db.progress[userId] || {});
  },
  async completeLesson(userId, trackId, lessonId, score) {
    const key = lessonKey(trackId, lessonId);
    const prev = db.progress[userId]?.[key];
    // A retake never lowers a recorded score: XP and pass marks use the best attempt.
    const best = Math.max(prev?.score ?? 0, score);
    db.progress[userId] = { ...(db.progress[userId] || {}), [key]: { completedAt: now(), score: best } };
    persist();
  },

  async claimTrackCertificate(userId, trackId) {
    const track = TRACKS.find((t) => t.id === trackId);
    if (!track) throw new Error('Unknown track');
    const prog = db.progress[userId] || {};
    if (!track.lessons.every((l) => (prog[lessonKey(track.id, l.id)]?.score ?? -1) >= PASS_MARK)) throw new Error('Finish every lesson in the track first.');
    const id = issueCertificate(userId, 'track', track.id, track.title, `${track.lessons.length} lessons, each with a quiz passed, Thesia Academy`);
    const p = db.profiles.find((x) => x.id === userId);
    if (p && !p.badges.includes(track.id)) p.badges = [...p.badges, track.id];
    persist();
    return delay(id);
  },
  async certificatesFor(userId) {
    const sample = SAMPLE_CERTIFICATES.filter((c) => c.userId === userId || `sample-${SAMPLE_PEOPLE.find((p) => p.id === userId)?.handle}` === c.userId);
    return delay([...db.certificates.filter((c) => c.userId === userId && !c.revoked), ...sample]);
  },
  async getCertificate(id) {
    const key = id.toUpperCase();
    return delay(db.certificates.find((c) => c.id === key) || SAMPLE_CERTIFICATES.find((c) => c.id === key) || null);
  },

  async enroll(e) {
    const existing = db.enrollments.find((x) => x.userId === e.userId && x.bootcampId === e.bootcampId);
    if (existing) {
      Object.assign(existing, e);
      persist();
      return delay(existing);
    }
    const en: Enrollment = { ...e, id: uid('e-'), createdAt: now() };
    db.enrollments.push(en);
    persist();
    return delay(en);
  },
  async myEnrollments(userId) {
    return delay(db.enrollments.filter((e) => e.userId === userId));
  },
  async getCohort(bootcampId) {
    // The cohort page only asks once the visitor has a seat, as the live database requires.
    return delay(db.cohorts.find((x) => x.bootcampId === bootcampId) || null);
  },
  async myAssignments(userId, bootcampId) {
    return delay(db.assignments.filter((a) => a.userId === userId && a.bootcampId === bootcampId));
  },
  async submitAssignment(userId, bootcampId, week, url, note) {
    if (!hasAccess(userId, bootcampId)) throw new Error('Your seat isn’t confirmed yet.');
    const existing = db.assignments.find((a) => a.userId === userId && a.bootcampId === bootcampId && a.week === week);
    if (existing) {
      Object.assign(existing, { url, note, updatedAt: now() });
      persist();
      return delay(existing);
    }
    const a: Assignment = { id: uid('as-'), userId, bootcampId, week, url, note, feedback: '', status: 'submitted', updatedAt: now() };
    db.assignments.push(a);
    persist();
    return delay(a);
  },

  async listNotifications(userId) {
    return delay(db.notices.filter((n) => n.userId === userId));
  },
  async markNotificationsRead(userId, ids) {
    db.notices = db.notices.map((n) => (n.userId === userId && !n.readAt && (!ids || ids.includes(n.id)) ? { ...n, readAt: now() } : n));
    persist();
  },

  async myOrgs(userId) {
    return delay(
      db.members
        .filter((m) => m.userId === userId)
        .map((m) => ({ org: db.orgs.find((o) => o.id === m.orgId)!, role: m.role }))
        .filter((m) => m.org)
    );
  },
  async getOrg(id) {
    if (id === SAMPLE_ORG.id) return delay(SAMPLE_ORG);
    return delay(db.orgs.find((o) => o.id === id) || null);
  },
  async orgByCode(code) {
    const o = db.orgs.find((x) => x.inviteCode === code.trim().toUpperCase());
    return delay(o ? { id: o.id, name: o.name, kind: o.kind, city: o.city, country: o.country } : null);
  },
  async joinOrg(userId, code) {
    const o = db.orgs.find((x) => x.inviteCode === code.trim().toUpperCase());
    if (!o) throw new Error('That invite code doesn’t match an organisation.');
    if (!db.members.some((m) => m.orgId === o.id && m.userId === userId)) {
      const used = db.members.filter((m) => m.orgId === o.id && m.role === 'member').length;
      if (used >= o.seats) throw new Error('Every seat is taken. Ask your coordinator to add seats.');
      db.members.push({ orgId: o.id, userId, role: 'member', joinedAt: now() });
      persist();
    }
    return delay({ id: o.id, name: o.name });
  },
  async leaveOrg(userId, orgId) {
    db.members = db.members.filter((m) => !(m.orgId === orgId && m.userId === userId));
    persist();
  },
  async orgReport(orgId) {
    if (orgId === SAMPLE_ORG.id) return delay(SAMPLE_ORG_REPORT);
    return delay(db.members.filter((m) => m.orgId === orgId).map((m) => memberReport(m.userId, m.role, m.joinedAt)));
  },

  async submit(s: Submission) {
    db.submissions.unshift({ ...s, id: uid('s-'), status: 'new', adminNote: '', createdAt: now() });
    persist();
    await delay(null);
  },

  async isAdmin() {
    return delay(true);
  },
  async adminOverview() {
    const weeks = new Map<string, number>();
    db.profiles.forEach((p) => {
      const d = new Date(p.createdAt);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      const k = d.toISOString().slice(0, 10);
      weeks.set(k, (weeks.get(k) || 0) + 1);
    });
    const count = <T,>(xs: T[], key: (x: T) => string) => {
      const m: Record<string, number> = {};
      xs.forEach((x) => (m[key(x)] = (m[key(x)] || 0) + 1));
      return m;
    };
    const top = (m: Record<string, number>) =>
      Object.entries(m)
        .filter(([k]) => k)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, n]) => ({ name, n }));
    const since = (days: number) => db.profiles.filter((p) => Date.now() - Date.parse(p.createdAt) < days * 86400000).length;
    const o: AdminOverview = {
      users: db.profiles.length,
      onboarded: db.profiles.filter((p) => p.onboarded).length,
      signups_7d: since(7),
      signups_30d: since(30),
      signups_by_week: [...weeks.entries()].sort().map(([week, n]) => ({ week, n })),
      projects: db.projects.length,
      open_projects: db.projects.filter((p) => p.status === 'open').length,
      applications: db.applications.length,
      accepted: db.applications.filter((a) => a.status === 'accepted').length,
      lessons_completed: Object.values(db.progress).reduce((n, p) => n + Object.keys(p).length, 0),
      certificates: db.certificates.filter((c) => !c.revoked).length,
      contributions: db.contributions.length,
      enrollments: count(db.enrollments, (e) => e.status),
      revenue_usd: 0,
      pro_users: db.profiles.filter((p) => p.plan === 'pro').length,
      new_submissions: count(db.submissions.filter((s) => s.status === 'new'), (s) => s.kind),
      organizations: db.orgs.length,
      org_members: db.members.length,
      countries: new Set(db.profiles.map((p) => p.country).filter(Boolean)).size,
      top_countries: top(count(db.profiles, (p) => p.country)),
      top_affiliations: top(count(db.profiles, (p) => p.affiliation)),
      top_referrers: top(count(db.profiles, (p) => p.referredBy || '')),
    };
    return delay(o);
  },
  async adminInbox() {
    return delay(db.submissions);
  },
  async adminUpdateInbox(id, status, note) {
    db.submissions = db.submissions.map((s) => (s.id === id ? { ...s, status, adminNote: note } : s));
    persist();
  },
  async adminPeople(search) {
    const q = search.trim().toLowerCase();
    return delay(
      db.profiles
        .filter((p) => !q || [p.name, p.email, p.handle, p.affiliation].some((v) => (v || '').toLowerCase().includes(q)))
        .map((p) => ({
          id: p.id,
          email: p.email,
          name: p.name,
          handle: p.handle,
          affiliation: p.affiliation,
          country: p.country,
          level: p.level,
          onboarded: p.onboarded,
          verified: p.verified,
          plan: p.plan,
          referredBy: p.referredBy,
          createdAt: p.createdAt,
        }))
    );
  },
  async adminSetVerified(userId, verified) {
    const p = db.profiles.find((x) => x.id === userId);
    if (p) p.verified = verified;
    if (verified) notify(userId, 'verified', 'Your passport is verified', 'A verified mark now shows on your research passport.', '/dashboard');
    persist();
  },
  async adminEnrollments() {
    return delay(
      db.enrollments.map((e) => ({
        id: e.id,
        bootcampId: e.bootcampId,
        userId: e.userId,
        email: db.profiles.find((p) => p.id === e.userId)?.email || '',
        name: nameOf(e.userId),
        status: e.status,
        priceUsd: e.priceUsd,
        paymentRef: '',
        createdAt: e.createdAt,
        certificateId: db.certificates.find((c) => c.userId === e.userId && c.kind === 'bootcamp' && c.refId === e.bootcampId)?.id || null,
      }))
    );
  },
  async adminSetEnrollment(id, status) {
    const e = db.enrollments.find((x) => x.id === id);
    if (!e) throw new Error('Enrollment not found');
    e.status = status;
    const b = bootcampById(e.bootcampId);
    let cert: string | null = null;
    if (status === 'confirmed') notify(e.userId, 'enrollment', `Your seat is confirmed: ${b?.title || e.bootcampId}`, 'Joining details are in your cohort space.', `/bootcamps/${e.bootcampId}/cohort`);
    if (status === 'completed') cert = issueCertificate(e.userId, 'bootcamp', e.bootcampId, b?.title || e.bootcampId, `${b?.weeks || 1}-week live cohort, Thesia Bootcamps`);
    persist();
    return delay(cert);
  },
  async adminOrgs() {
    return delay(db.orgs);
  },
  async adminCreateOrg(input) {
    const o: Organization = { ...input, id: uid('o-'), inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, '7'), createdAt: now() };
    db.orgs.unshift(o);
    persist();
    return delay(o);
  },
  async adminUpdateOrg(id, patch) {
    db.orgs = db.orgs.map((o) => (o.id === id ? { ...o, ...patch } : o));
    persist();
  },
  async adminAddOrgAdmin(orgId, email) {
    const p = db.profiles.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!p) throw new Error('No account uses that email. Ask them to create a Thesia account first.');
    const m = db.members.find((x) => x.orgId === orgId && x.userId === p.id);
    if (m) m.role = 'admin';
    else db.members.push({ orgId, userId: p.id, role: 'admin', joinedAt: now() });
    notify(p.id, 'org', 'You are now a coordinator', 'Open your organisation dashboard to invite students.', `/org/${orgId}`);
    persist();
  },
  async adminSaveCohort(c) {
    const next = { ...c, updatedAt: now() };
    const i = db.cohorts.findIndex((x) => x.bootcampId === c.bootcampId);
    if (i >= 0) db.cohorts[i] = next;
    else db.cohorts.push(next);
    persist();
  },
  async adminAssignments(bootcampId) {
    return delay(
      db.assignments
        .filter((a) => a.bootcampId === bootcampId)
        .map((a) => ({ ...a, name: nameOf(a.userId), email: db.profiles.find((p) => p.id === a.userId)?.email || '' }))
        .sort((a, b) => a.week - b.week)
    );
  },
  async adminFeedback(id, feedback) {
    const a = db.assignments.find((x) => x.id === id);
    if (!a) throw new Error('Submission not found');
    Object.assign(a, { feedback, status: 'reviewed', updatedAt: now() });
    notify(a.userId, 'feedback', `Feedback on your week ${a.week} work`, feedback.slice(0, 140), `/bootcamps/${a.bootcampId}/cohort`);
    persist();
  },
};
