import type {
  Application,
  Assignment,
  Certificate,
  Cohort,
  Contribution,
  CreditRole,
  Enrollment,
  EnrollmentStatus,
  LessonProgress,
  Message,
  Notice,
  Organization,
  OrgMembership,
  OrgReportRow,
  Person,
  Profile,
  Project,
} from '../types';

export type SavedKind = 'project' | 'conference' | 'lab' | 'program' | 'person' | 'bootcamp';

export interface SavedItem {
  kind: SavedKind;
  refId: string;
  createdAt: string;
}

export type SubmissionKind =
  | 'conference'
  | 'lab'
  | 'institution'
  | 'teach'
  | 'ambassador'
  | 'country-waitlist'
  | 'feedback'
  | 'scholarship'
  | 'challenge'
  | 'challenge-interest';

export interface Submission {
  kind: SubmissionKind;
  email: string;
  name?: string;
  country?: string;
  payload: Record<string, unknown>;
}

export type SubmissionStatus = 'new' | 'in-progress' | 'done' | 'archived';

export interface InboxItem extends Submission {
  id: string;
  status: SubmissionStatus;
  adminNote: string;
  createdAt: string;
}

export interface AdminOverview {
  users: number;
  onboarded: number;
  signups_7d: number;
  signups_30d: number;
  signups_by_week: { week: string; n: number }[];
  projects: number;
  open_projects: number;
  applications: number;
  accepted: number;
  lessons_completed: number;
  certificates: number;
  contributions: number;
  enrollments: Record<string, number>;
  revenue_usd: number;
  pro_users: number;
  new_submissions: Record<string, number>;
  organizations: number;
  org_members: number;
  countries: number;
  top_countries: { name: string; n: number }[];
  top_affiliations: { name: string; n: number }[];
  top_referrers: { name: string; n: number }[];
}

export interface AdminPerson {
  id: string;
  email: string;
  name: string;
  handle: string;
  affiliation: string;
  country: string;
  level: string;
  onboarded: boolean;
  verified: boolean;
  plan: string;
  referredBy: string;
  createdAt: string;
}

export interface AdminEnrollment {
  id: string;
  bootcampId: string;
  userId: string;
  email: string;
  name: string;
  status: EnrollmentStatus;
  priceUsd: number;
  paymentRef: string;
  createdAt: string;
  certificateId: string | null;
}

export type NewProject = Omit<Project, 'id' | 'createdAt' | 'isSample' | 'status' | 'ownerId'>;
export type NewOrg = Pick<Organization, 'name' | 'kind' | 'city' | 'country' | 'seats' | 'note'>;

export interface Repo {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: NewProject, ownerId: string): Promise<Project>;
  closeProject(id: string): Promise<void>;
  myProjects(ownerId: string): Promise<Project[]>;

  listPeople(): Promise<Person[]>;
  getPerson(handle: string): Promise<Person | null>;
  getPersonById(id: string): Promise<Person | null>;

  getProfile(userId: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<Profile>;
  handleAvailable(handle: string, userId: string): Promise<boolean>;
  referralCount(userId: string): Promise<number>;

  apply(app: Omit<Application, 'id' | 'status' | 'createdAt'>): Promise<Application>;
  myApplications(userId: string): Promise<Application[]>;
  applicationsForProject(projectId: string): Promise<Application[]>;
  setApplicationStatus(id: string, status: Application['status']): Promise<void>;

  listMessages(applicationId: string): Promise<Message[]>;
  sendMessage(applicationId: string, senderId: string, body: string): Promise<Message>;

  confirmContribution(applicationId: string, roles: CreditRole[], note: string): Promise<void>;
  contributionsFor(userId: string): Promise<Contribution[]>;

  listSaved(userId: string): Promise<SavedItem[]>;
  toggleSaved(userId: string, kind: SavedKind, refId: string): Promise<boolean>;

  /** One row per lesson from public.lesson_progress, keyed by "trackId/lessonId". */
  getProgress(userId: string): Promise<Record<string, LessonProgress>>;
  /** Records completion and the quiz score, keeping the best score on a retake. */
  completeLesson(userId: string, trackId: string, lessonId: string, score: number): Promise<void>;

  claimTrackCertificate(userId: string, trackId: string): Promise<string>;
  certificatesFor(userId: string): Promise<Certificate[]>;
  getCertificate(id: string): Promise<Certificate | null>;

  enroll(e: Omit<Enrollment, 'id' | 'createdAt'>): Promise<Enrollment>;
  myEnrollments(userId: string): Promise<Enrollment[]>;
  getCohort(bootcampId: string): Promise<Cohort | null>;
  myAssignments(userId: string, bootcampId: string): Promise<Assignment[]>;
  submitAssignment(userId: string, bootcampId: string, week: number, url: string, note: string): Promise<Assignment>;

  listNotifications(userId: string): Promise<Notice[]>;
  markNotificationsRead(userId: string, ids?: string[]): Promise<void>;

  myOrgs(userId: string): Promise<OrgMembership[]>;
  getOrg(id: string): Promise<Organization | null>;
  orgByCode(code: string): Promise<Pick<Organization, 'id' | 'name' | 'kind' | 'city' | 'country'> | null>;
  joinOrg(userId: string, code: string): Promise<{ id: string; name: string }>;
  leaveOrg(userId: string, orgId: string): Promise<void>;
  orgReport(orgId: string): Promise<OrgReportRow[]>;

  submit(s: Submission): Promise<void>;

  // Thesia team only. The database checks is_admin() on every call.
  isAdmin(): Promise<boolean>;
  adminOverview(): Promise<AdminOverview>;
  adminInbox(): Promise<InboxItem[]>;
  adminUpdateInbox(id: string, status: SubmissionStatus, note: string): Promise<void>;
  adminPeople(search: string): Promise<AdminPerson[]>;
  adminSetVerified(userId: string, verified: boolean): Promise<void>;
  adminEnrollments(): Promise<AdminEnrollment[]>;
  adminSetEnrollment(id: string, status: EnrollmentStatus): Promise<string | null>;
  adminOrgs(): Promise<Organization[]>;
  adminCreateOrg(input: NewOrg): Promise<Organization>;
  adminUpdateOrg(id: string, patch: Partial<NewOrg>): Promise<void>;
  adminAddOrgAdmin(orgId: string, email: string): Promise<void>;
  adminSaveCohort(c: Omit<Cohort, 'updatedAt'>): Promise<void>;
  adminAssignments(bootcampId: string): Promise<Assignment[]>;
  adminFeedback(id: string, feedback: string): Promise<void>;
}

export const lessonKey = (trackId: string, lessonId: string) => `${trackId}/${lessonId}`;
