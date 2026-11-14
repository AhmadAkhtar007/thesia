// Live data store backed by Supabase (tables in supabase/migrations/0001 and 0002).

import { SAMPLE_CERTIFICATES, SAMPLE_ORG, SAMPLE_ORG_REPORT } from '../../data/samples';
import { db } from '../supabase';
import type {
  Application,
  Assignment,
  Certificate,
  Contribution,
  Enrollment,
  Message,
  Notice,
  Organization,
  OrgReportRow,
  Person,
  Profile,
  Project,
} from '../types';
import { lessonKey, type AdminEnrollment, type AdminPerson, type InboxItem, type NewProject, type Repo, type SavedKind } from './types';

const enc = encodeURIComponent;
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

function projectFromRow(r: any): Project {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    description: r.description,
    fields: r.fields || [],
    tags: r.tags || [],
    levels: r.levels || [],
    city: r.city,
    country: r.country,
    mode: r.mode,
    hoursPerWeek: r.hours_per_week,
    durationWeeks: r.duration_weeks,
    compensation: r.compensation,
    stipend: r.stipend || undefined,
    roles: r.roles || [],
    lead: r.lead,
    ethics: r.ethics,
    credit: r.credit,
    applyBy: r.apply_by,
    startDate: r.start_date,
    status: r.status,
    createdAt: (r.created_at || '').slice(0, 10),
    isSample: r.is_sample,
    ownerId: r.owner_id || undefined,
  };
}

function projectToRow(p: NewProject, ownerId: string) {
  return {
    owner_id: ownerId,
    title: p.title,
    summary: p.summary,
    description: p.description,
    fields: p.fields,
    tags: p.tags,
    levels: p.levels,
    city: p.city,
    country: p.country,
    mode: p.mode,
    hours_per_week: p.hoursPerWeek,
    duration_weeks: p.durationWeeks,
    compensation: p.compensation,
    stipend: p.stipend || null,
    roles: p.roles,
    lead: p.lead,
    ethics: p.ethics,
    credit: p.credit,
    apply_by: p.applyBy,
    start_date: p.startDate,
  };
}

function profileFromRow(r: any, email = ''): Profile {
  return {
    id: r.id,
    email,
    name: r.name || '',
    handle: r.handle || '',
    level: r.level || '',
    fields: r.fields || [],
    city: r.city || '',
    country: r.country || '',
    affiliation: r.affiliation || '',
    headline: r.headline || '',
    bio: r.bio || '',
    skills: r.skills || [],
    goals: r.goals || [],
    openTo: r.open_to || [],
    links: r.links || {},
    outputs: r.outputs || [],
    languages: r.languages || [],
    badges: r.badges || [],
    verified: !!r.verified,
    referredBy: r.referred_by || '',
    onboarded: !!r.onboarded,
    plan: r.plan || 'free',
    createdAt: r.created_at || new Date().toISOString(),
  };
}

function personFromRow(r: any): Person {
  return {
    id: r.id,
    handle: r.handle || r.id,
    name: r.name || 'Researcher',
    headline: r.headline || '',
    affiliation: r.affiliation || '',
    city: r.city || '',
    country: r.country || '',
    level: r.level || 'undergrad',
    fields: r.fields || [],
    skills: r.skills || [],
    credit: r.credit || {},
    bio: r.bio || '',
    openTo: r.open_to || [],
    outputs: r.outputs || [],
    languages: r.languages || [],
    links: r.links || {},
    badges: r.badges || [],
    joined: (r.created_at || '').slice(0, 10),
    isSample: false,
    verified: !!r.verified,
  };
}

function appFromRow(r: any): Application {
  return {
    id: r.id,
    projectId: r.project_id,
    roleId: r.role_id,
    userId: r.user_id,
    applicantName: r.applicant_name,
    pitch: r.pitch,
    hoursPerWeek: r.hours_per_week,
    status: r.status,
    createdAt: r.created_at,
  };
}

function enrollmentFromRow(r: any): Enrollment {
  return {
    id: r.id,
    bootcampId: r.bootcamp_id,
    userId: r.user_id,
    status: r.status,
    priceUsd: Number(r.price_usd),
    createdAt: r.created_at,
  };
}

function certFromRow(r: any): Certificate {
  return {
    id: r.id,
    userId: r.user_id,
    kind: r.kind,
    refId: r.ref_id,
    title: r.title,
    recipientName: r.recipient_name,
    detail: r.detail || '',
    issuedAt: r.issued_at,
    revoked: !!r.revoked,
  };
}

function orgFromRow(r: any): Organization {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    city: r.city || '',
    country: r.country || '',
    seats: r.seats,
    inviteCode: r.invite_code,
    note: r.note || '',
    createdAt: r.created_at,
  };
}

function assignmentFromRow(r: any): Assignment {
  return {
    id: r.id,
    userId: r.user_id,
    bootcampId: r.bootcamp_id,
    week: r.week,
    url: r.url || '',
    note: r.note || '',
    feedback: r.feedback || '',
    status: r.status,
    updatedAt: r.updated_at,
    name: r.name ?? undefined,
    email: r.email ?? undefined,
  };
}

const PERSON_COLS =
  'id,handle,name,headline,affiliation,city,country,level,fields,skills,credit,bio,open_to,outputs,languages,links,badges,verified,created_at';

export const remoteRepo: Repo = {
  async listProjects() {
    const rows = await db.select('projects', 'select=*&order=is_sample.asc,created_at.desc&limit=500');
    return rows.map(projectFromRow);
  },
  async getProject(id) {
    const r = await db.one('projects', `select=*&id=eq.${enc(id)}`);
    return r ? projectFromRow(r) : null;
  },
  async createProject(input, ownerId) {
    const [row] = await db.insert('projects', projectToRow(input, ownerId));
    return projectFromRow(row);
  },
  async closeProject(id) {
    await db.update('projects', `id=eq.${enc(id)}`, { status: 'closed' });
  },
  async myProjects(ownerId) {
    const rows = await db.select('projects', `select=*&owner_id=eq.${ownerId}&order=created_at.desc`);
    return rows.map(projectFromRow);
  },

  async listPeople() {
    const rows = await db.select('profiles', `select=${PERSON_COLS}&onboarded=is.true&is_public=is.true&order=created_at.desc&limit=500`);
    return rows.map(personFromRow);
  },
  async getPerson(handle) {
    const r = await db.one('profiles', `select=${PERSON_COLS}&handle=eq.${enc(handle)}`);
    return r ? personFromRow(r) : null;
  },
  async getPersonById(id) {
    if (!isUuid(id)) return null;
    const r = await db.one('profiles', `select=${PERSON_COLS}&id=eq.${id}`);
    return r ? personFromRow(r) : null;
  },

  async getProfile(userId) {
    const r = await db.one('profiles', `select=*&id=eq.${userId}`);
    return r ? profileFromRow(r) : null;
  },
  async saveProfile(p) {
    const patch: Record<string, unknown> = {
      name: p.name,
      handle: p.handle || null,
      level: p.level,
      fields: p.fields,
      city: p.city,
      country: p.country,
      affiliation: p.affiliation,
      headline: p.headline,
      bio: p.bio,
      skills: p.skills,
      goals: p.goals,
      open_to: p.openTo,
      links: p.links,
      outputs: p.outputs || [],
      languages: p.languages || [],
      onboarded: p.onboarded,
      // School students' passports are private (see /safeguarding).
      is_public: p.level !== 'high-school',
      updated_at: new Date().toISOString(),
    };
    // The database keeps the first referral and ignores later changes.
    if (p.referredBy) patch.referred_by = p.referredBy;
    const [row] = await db.update('profiles', `id=eq.${p.id}`, patch);
    return profileFromRow(row, p.email);
  },
  async handleAvailable(handle) {
    // Private passports (e.g. school students) are hidden from other people, so the database checks.
    return (await db.rpc('handle_available', { h: handle })) === true;
  },
  async referralCount() {
    return Number(await db.rpc('my_referral_count', {})) || 0;
  },

  async apply(app) {
    const [row] = await db.insert('applications', {
      project_id: app.projectId,
      role_id: app.roleId,
      user_id: app.userId,
      applicant_name: app.applicantName,
      pitch: app.pitch,
      hours_per_week: app.hoursPerWeek,
    });
    return appFromRow(row);
  },
  async myApplications(userId) {
    const rows = await db.select('applications', `select=*&user_id=eq.${userId}&order=created_at.desc`);
    return rows.map(appFromRow);
  },
  async applicationsForProject(projectId) {
    const rows = await db.select('applications', `select=*&project_id=eq.${enc(projectId)}&order=created_at.desc`);
    return rows.map(appFromRow);
  },
  async setApplicationStatus(id, status) {
    await db.update('applications', `id=eq.${id}`, { status });
  },

  async listMessages(applicationId) {
    const rows = await db.select('application_messages', `select=*&application_id=eq.${applicationId}&order=created_at.asc&limit=500`);
    return rows.map((r: any) => ({ id: r.id, applicationId: r.application_id, senderId: r.sender_id, body: r.body, createdAt: r.created_at }));
  },
  async sendMessage(applicationId, senderId, body) {
    const [r] = await db.insert('application_messages', { application_id: applicationId, sender_id: senderId, body: body.slice(0, 2000) });
    return { id: r.id, applicationId: r.application_id, senderId: r.sender_id, body: r.body, createdAt: r.created_at } as Message;
  },

  async confirmContribution(applicationId, roles, note) {
    await db.rpc('confirm_contribution', { app: applicationId, credit_roles: roles, contribution_note: note });
  },
  async contributionsFor(userId) {
    if (!isUuid(userId)) return [];
    const rows = await db.select('contributions', `select=*&user_id=eq.${userId}&order=created_at.desc`);
    return rows.map(
      (r: any): Contribution => ({
        id: r.id,
        applicationId: r.application_id || undefined,
        projectId: r.project_id || undefined,
        projectTitle: r.project_title,
        userId: r.user_id,
        roles: r.roles || [],
        note: r.note || '',
        confirmedByName: r.confirmed_by_name || '',
        createdAt: r.created_at,
      })
    );
  },

  async listSaved(userId) {
    const rows = await db.select('saved_items', `select=*&user_id=eq.${userId}&order=created_at.desc`);
    return rows.map((r: any) => ({ kind: r.kind, refId: r.ref_id, createdAt: r.created_at }));
  },
  async toggleSaved(userId, kind: SavedKind, refId) {
    const filter = `user_id=eq.${userId}&kind=eq.${kind}&ref_id=eq.${enc(refId)}`;
    const existing = await db.one('saved_items', `select=ref_id&${filter}`);
    if (existing) {
      await db.remove('saved_items', filter);
      return false;
    }
    await db.insert('saved_items', { user_id: userId, kind, ref_id: refId });
    return true;
  },

  async getProgress(userId) {
    const rows = await db.select('lesson_progress', `select=*&user_id=eq.${userId}`);
    const out: Record<string, { completedAt: string; score: number }> = {};
    rows.forEach((r: any) => (out[r.lesson_key] = { completedAt: r.completed_at, score: r.score }));
    return out;
  },
  async completeLesson(userId, trackId, lessonId, score) {
    await db.upsert(
      'lesson_progress',
      { user_id: userId, lesson_key: lessonKey(trackId, lessonId), score, completed_at: new Date().toISOString() },
      'user_id,lesson_key'
    );
  },

  async claimTrackCertificate(_userId, trackId) {
    return String(await db.rpc('claim_track_certificate', { track: trackId }));
  },
  async certificatesFor(userId) {
    if (!isUuid(userId)) return SAMPLE_CERTIFICATES.filter((c) => c.userId === userId);
    const rows = await db.select('certificates', `select=*&user_id=eq.${userId}&revoked=is.false&order=issued_at.desc`);
    return rows.map(certFromRow);
  },
  async getCertificate(id) {
    const key = id.trim().toUpperCase();
    const sample = SAMPLE_CERTIFICATES.find((c) => c.id === key);
    if (sample) return sample;
    if (!/^TH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) return null;
    const r = await db.rpc('verify_certificate', { cert: key });
    return r ? certFromRow(r) : null;
  },

  async enroll(e) {
    const existing = await db.one('enrollments', `select=*&user_id=eq.${e.userId}&bootcamp_id=eq.${enc(e.bootcampId)}`);
    // A paid, confirmed or completed seat can't be changed from the app; keep it as it is.
    const row = existing
      ? (await db.update('enrollments', `id=eq.${existing.id}`, { status: e.status, price_usd: e.priceUsd }))[0] || existing
      : (await db.insert('enrollments', { bootcamp_id: e.bootcampId, user_id: e.userId, status: e.status, price_usd: e.priceUsd }))[0];
    return enrollmentFromRow(row);
  },
  async myEnrollments(userId) {
    const rows = await db.select('enrollments', `select=*&user_id=eq.${userId}`);
    return rows.map(enrollmentFromRow);
  },
  async getCohort(bootcampId) {
    const r = await db.one('cohorts', `select=*&bootcamp_id=eq.${enc(bootcampId)}`);
    return r
      ? {
          bootcampId: r.bootcamp_id,
          meetingUrl: r.meeting_url,
          scheduleNote: r.schedule_note,
          materialsUrl: r.materials_url,
          instructor: r.instructor,
          announcement: r.announcement,
          updatedAt: r.updated_at,
        }
      : null;
  },
  async myAssignments(userId, bootcampId) {
    const rows = await db.select('assignment_submissions', `select=*&user_id=eq.${userId}&bootcamp_id=eq.${enc(bootcampId)}&order=week.asc`);
    return rows.map(assignmentFromRow);
  },
  async submitAssignment(userId, bootcampId, week, url, note) {
    const existing = await db.one('assignment_submissions', `select=id&user_id=eq.${userId}&bootcamp_id=eq.${enc(bootcampId)}&week=eq.${week}`);
    const row = existing
      ? (await db.update('assignment_submissions', `id=eq.${existing.id}`, { url, note, updated_at: new Date().toISOString() }))[0]
      : (await db.insert('assignment_submissions', { user_id: userId, bootcamp_id: bootcampId, week, url, note }))[0];
    return assignmentFromRow(row);
  },

  async listNotifications(userId) {
    const rows = await db.select('notifications', `select=*&user_id=eq.${userId}&order=created_at.desc&limit=100`);
    return rows.map(
      (r: any): Notice => ({ id: r.id, kind: r.kind, title: r.title, body: r.body, link: r.link, readAt: r.read_at, createdAt: r.created_at })
    );
  },
  async markNotificationsRead(userId, ids) {
    const filter = ids?.length ? `id=in.(${ids.join(',')})` : `user_id=eq.${userId}&read_at=is.null`;
    await db.update('notifications', filter, { read_at: new Date().toISOString() });
  },

  async myOrgs() {
    const rows = await db.rpc<any[]>('my_orgs', {});
    return (rows || []).map((r) => ({ role: r.role, org: orgFromRow({ ...r, seats: 0, invite_code: '', note: '', created_at: r.joined_at }) }));
  },
  async getOrg(id) {
    if (id === SAMPLE_ORG.id) return SAMPLE_ORG;
    if (!isUuid(id)) return null;
    // Coordinators get the full row; members only see the name, through my_orgs().
    const r = await db.one('organizations', `select=*&id=eq.${id}`);
    if (r) return orgFromRow(r);
    const mine = await remoteRepo.myOrgs('');
    return mine.find((m) => m.org.id === id)?.org || null;
  },
  async orgByCode(code) {
    const r = await db.rpc('org_by_code', { code });
    return r || null;
  },
  async joinOrg(_userId, code) {
    return db.rpc('join_org', { code });
  },
  async leaveOrg(userId, orgId) {
    await db.remove('org_members', `org_id=eq.${orgId}&user_id=eq.${userId}`);
  },
  async orgReport(orgId) {
    if (orgId === SAMPLE_ORG.id) return SAMPLE_ORG_REPORT;
    const rows = await db.rpc<any[]>('org_report', { org: orgId });
    return (rows || []).map(
      (r): OrgReportRow => ({
        userId: r.user_id,
        name: r.name,
        handle: r.handle || '',
        level: r.level || '',
        role: r.role,
        joinedAt: r.joined_at,
        lessonsCompleted: r.lessons_completed,
        tracksCompleted: r.tracks_completed,
        applications: r.applications,
        accepted: r.accepted,
        bootcamps: r.bootcamps || [],
        certificates: r.certificates,
        lastActive: r.last_active,
      })
    );
  },

  async submit(s) {
    await db.insertQuiet('submissions', { kind: s.kind, email: s.email, name: s.name || null, country: s.country || null, payload: s.payload });
  },

  async isAdmin() {
    try {
      return (await db.rpc('is_admin', {})) === true;
    } catch {
      return false;
    }
  },
  async adminOverview() {
    return db.rpc('admin_overview', {});
  },
  async adminInbox() {
    const rows = await db.select('submissions', 'select=*&order=created_at.desc&limit=500');
    return rows.map(
      (r: any): InboxItem => ({
        id: r.id,
        kind: r.kind,
        email: r.email,
        name: r.name || '',
        country: r.country || '',
        payload: r.payload || {},
        status: r.status,
        adminNote: r.admin_note || '',
        createdAt: r.created_at,
      })
    );
  },
  async adminUpdateInbox(id, status, note) {
    await db.update('submissions', `id=eq.${id}`, { status, admin_note: note });
  },
  async adminPeople(search) {
    const rows = await db.rpc<any[]>('admin_people', { search });
    return (rows || []).map(
      (r): AdminPerson => ({
        id: r.id,
        email: r.email,
        name: r.name,
        handle: r.handle || '',
        affiliation: r.affiliation,
        country: r.country,
        level: r.level,
        onboarded: r.onboarded,
        verified: r.verified,
        plan: r.plan,
        referredBy: r.referred_by || '',
        createdAt: r.created_at,
      })
    );
  },
  async adminSetVerified(userId, verified) {
    await db.rpc('admin_set_verified', { person: userId, value: verified });
  },
  async adminEnrollments() {
    const rows = await db.rpc<any[]>('admin_enrollments', {});
    return (rows || []).map(
      (r): AdminEnrollment => ({
        id: r.id,
        bootcampId: r.bootcamp_id,
        userId: r.user_id,
        email: r.email,
        name: r.name || '',
        status: r.status,
        priceUsd: Number(r.price_usd),
        paymentRef: r.payment_ref || '',
        createdAt: r.created_at,
        certificateId: r.certificate_id,
      })
    );
  },
  async adminSetEnrollment(id, status) {
    return (await db.rpc('admin_set_enrollment', { enrollment: id, new_status: status })) || null;
  },
  async adminOrgs() {
    const rows = await db.select('organizations', 'select=*&order=created_at.desc');
    return rows.map(orgFromRow);
  },
  async adminCreateOrg(input) {
    const [row] = await db.insert('organizations', input);
    return orgFromRow(row);
  },
  async adminUpdateOrg(id, patch) {
    await db.update('organizations', `id=eq.${id}`, patch);
  },
  async adminAddOrgAdmin(orgId, email) {
    await db.rpc('add_org_admin', { org: orgId, member_email: email });
  },
  async adminSaveCohort(c) {
    await db.upsert(
      'cohorts',
      {
        bootcamp_id: c.bootcampId,
        meeting_url: c.meetingUrl,
        schedule_note: c.scheduleNote,
        materials_url: c.materialsUrl,
        instructor: c.instructor,
        announcement: c.announcement,
        updated_at: new Date().toISOString(),
      },
      'bootcamp_id'
    );
  },
  async adminAssignments(bootcampId) {
    const rows = await db.rpc<any[]>('admin_assignments', { bootcamp: bootcampId });
    return (rows || []).map((r) => assignmentFromRow({ ...r, bootcamp_id: bootcampId }));
  },
  async adminFeedback(id, feedback) {
    await db.rpc('admin_feedback', { submission: id, feedback_text: feedback });
  },
};

