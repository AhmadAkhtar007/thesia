// Shared data shapes. These mirror the Supabase tables in supabase/migrations.

export const FIELDS = [
  { id: 'public-health', label: 'Public health & medicine' },
  { id: 'environment', label: 'Environment & climate' },
  { id: 'cs-ai', label: 'Computer science & AI' },
  { id: 'economics', label: 'Economics & finance' },
  { id: 'social', label: 'Social sciences & policy' },
  { id: 'education', label: 'Education' },
  { id: 'psychology', label: 'Psychology & mental health' },
  { id: 'engineering', label: 'Engineering & energy' },
  { id: 'biology', label: 'Life sciences' },
  { id: 'physics-math', label: 'Physics & mathematics' },
  { id: 'chemistry', label: 'Chemistry & materials' },
  { id: 'agriculture', label: 'Agriculture & food' },
  { id: 'business', label: 'Business & management' },
  { id: 'humanities', label: 'Humanities & languages' },
] as const;
export type FieldId = (typeof FIELDS)[number]['id'];
export const fieldLabel = (id: string) => FIELDS.find((f) => f.id === id)?.label ?? id;

export const LEVELS = [
  { id: 'high-school', label: 'High school', short: 'High school' },
  { id: 'undergrad', label: 'Undergraduate', short: 'Undergrad' },
  { id: 'masters', label: "Master's", short: "Master's" },
  { id: 'phd', label: 'PhD', short: 'PhD' },
  { id: 'early-career', label: 'Early-career researcher', short: 'Early-career' },
  { id: 'faculty', label: 'Faculty or lab lead', short: 'Faculty' },
] as const;
export type Level = (typeof LEVELS)[number]['id'];
export const levelLabel = (id: string) => LEVELS.find((l) => l.id === id)?.short ?? id;

/**
 * CRediT (Contributor Roles Taxonomy, ANSI/NISO Z39.104-2022): the 14 roles journals use to say who did what.
 * Thesia uses them for project roles and for the contribution record on every profile.
 */
export const CREDIT_ROLES = [
  { id: 'conceptualization', label: 'Conceptualization', hint: 'Shaping the research question and aims' },
  { id: 'data-curation', label: 'Data curation', hint: 'Collecting, cleaning and maintaining data' },
  { id: 'formal-analysis', label: 'Formal analysis', hint: 'Statistics, modelling or other analysis' },
  { id: 'funding', label: 'Funding acquisition', hint: 'Winning the money that pays for the work' },
  { id: 'investigation', label: 'Investigation', hint: 'Running experiments, surveys or fieldwork' },
  { id: 'methodology', label: 'Methodology', hint: 'Designing the methods and instruments' },
  { id: 'project-admin', label: 'Project administration', hint: 'Coordinating people, timelines and tasks' },
  { id: 'resources', label: 'Resources', hint: 'Providing samples, equipment, data or access' },
  { id: 'software', label: 'Software', hint: 'Writing and testing research code' },
  { id: 'supervision', label: 'Supervision', hint: 'Mentoring and oversight' },
  { id: 'validation', label: 'Validation', hint: 'Checking results can be reproduced' },
  { id: 'visualization', label: 'Visualization', hint: 'Charts, figures and data presentation' },
  { id: 'writing-draft', label: 'Writing: original draft', hint: 'Writing the first draft' },
  { id: 'writing-review', label: 'Writing: review & editing', hint: 'Critical review and revision' },
] as const;
export type CreditRole = (typeof CREDIT_ROLES)[number]['id'];
export const creditLabel = (id: string) => CREDIT_ROLES.find((r) => r.id === id)?.label ?? id;

export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type Compensation = 'paid' | 'stipend' | 'unpaid' | 'course-credit';
export type EthicsStatus = 'approved' | 'in-review' | 'not-required';

export interface ProjectRole {
  id: string;
  credit: CreditRole;
  title: string;
  description: string;
  spots: number;
  skills: string[];
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  description: string; // markdown
  fields: FieldId[];
  tags: string[];
  levels: Level[];
  city: string;
  country: string;
  mode: WorkMode;
  hoursPerWeek: number;
  durationWeeks: number;
  compensation: Compensation;
  stipend?: string;
  roles: ProjectRole[];
  lead: { name: string; handle?: string; affiliation: string };
  ethics: EthicsStatus;
  credit: string; // how contributors are credited
  applyBy: string; // ISO date
  startDate: string;
  status: 'open' | 'closed';
  createdAt: string;
  isSample: boolean;
  ownerId?: string;
}

export type OutputType = 'paper' | 'preprint' | 'poster' | 'dataset' | 'code' | 'talk' | 'report';

export interface Output {
  title: string;
  type: OutputType;
  venue?: string;
  year: number;
  url?: string;
  roles: CreditRole[];
}

export type OpenTo = 'collaborate' | 'ra-role' | 'mentor' | 'mentee' | 'squad';
export const OPEN_TO_LABEL: Record<OpenTo, string> = {
  collaborate: 'Collaborating on projects',
  'ra-role': 'Research assistant roles',
  mentor: 'Mentoring students',
  mentee: 'Finding a mentor',
  squad: 'Joining a research squad',
};

export interface Person {
  id: string;
  handle: string;
  name: string;
  headline: string;
  affiliation: string;
  city: string;
  country: string;
  level: Level;
  fields: FieldId[];
  skills: string[];
  credit: Partial<Record<CreditRole, number>>;
  bio: string;
  openTo: OpenTo[];
  outputs: Output[];
  languages: string[];
  links: { orcid?: string; scholar?: string; linkedin?: string; website?: string };
  badges: string[]; // academy track ids completed
  joined: string;
  isSample: boolean;
  verified?: boolean; // identity and affiliation checked by the Thesia team
}

export type ApplicationStatus = 'sent' | 'viewed' | 'shortlisted' | 'accepted' | 'declined';

export interface Application {
  id: string;
  projectId: string;
  roleId: string;
  userId: string;
  applicantName: string;
  pitch: string;
  hoursPerWeek: number;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Conference {
  id: string;
  name: string;
  short: string;
  host: string;
  city: string;
  country: string;
  start: string; // ISO date
  end: string;
  deadline?: string; // paper or abstract deadline
  deadlineNote?: string;
  submissionsClosed?: boolean;
  fields: FieldId[];
  topics: string[];
  format: 'in-person' | 'online' | 'hybrid';
  studentFriendly: boolean;
  indexing?: string; // e.g. "IEEE technical co-sponsorship"
  url: string;
  source: string; // where we verified it
  note?: string;
}

export interface Lab {
  id: string;
  name: string;
  short?: string;
  host: string;
  city: string;
  country: string;
  fields: FieldId[];
  focus: string;
  themes: string[];
  url: string;
  approach: string; // how students usually get involved
}

export interface Program {
  id: string;
  name: string;
  org: string;
  country: string; // where it takes place
  levels: Level[];
  fields: FieldId[] | 'all';
  funding: 'fully-funded' | 'partly-funded' | 'stipend' | 'paid' | 'free';
  format: string;
  summary: string;
  eligibility: string;
  url: string;
}

export interface BootcampWeek {
  title: string;
  outcome: string;
}

export interface Bootcamp {
  id: string;
  title: string;
  tagline: string;
  levels: Level[];
  fields: FieldId[] | 'all';
  weeks: number;
  hoursPerWeek: number;
  start: string;
  seats: number;
  priceUsd: number; // list price, before fair pricing by country
  format: string;
  deliverable: string;
  syllabus: BootcampWeek[];
  forWhom: string;
  instructorBrief: string;
  scholarship: boolean;
  b2b?: boolean;
}

/** A lesson is played as four steps: concept, professor's field rule, real example, then the check. */
export type LessonStepKind = 'concept' | 'rule' | 'example';

export interface LessonStep {
  kind: LessonStepKind;
  title: string;
  body: string; // markdown
}

export interface ExerciseOption {
  text: string;
  correct: boolean;
  why: string;
}

/** The interactive mini-exercise that sits before the knowledge check. */
export interface Exercise {
  title: string;
  prompt: string;
  options: ExerciseOption[];
}

export interface LessonTemplate {
  title: string;
  filename: string;
  body: string; // plain text or markdown
}

/** Open university guides, handbooks and checklists the lesson is built from. */
export interface LessonSource {
  title: string;
  url: string;
  note: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  xp: number; // base XP for completing the lesson; the quiz adds up to 10 more
  summary: string;
  steps: LessonStep[];
  takeaways: string[];
  exercise: Exercise;
  quiz: QuizQuestion[];
  template?: LessonTemplate;
  tool?: string; // related tool route
  skillTags: string[]; // used for track badges and the talent pool
}

export interface Track {
  id: string;
  title: string;
  short: string; // badge label
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  audience: string;
  summary: string;
  outcome: string; // what a learner can do at the end of the track
  skills: string[];
  lessons: Lesson[];
}

/** One row of public.lesson_progress. XP is derived from these rows, not stored separately. */
export interface LessonProgress {
  completedAt: string;
  score: number;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  handle: string;
  level: Level | '';
  fields: FieldId[];
  city: string;
  country: string;
  affiliation: string;
  headline: string;
  bio: string;
  skills: string[];
  goals: string[];
  openTo: OpenTo[];
  links: Person['links'];
  outputs: Output[]; // self-reported
  languages: string[];
  badges: string[];
  verified: boolean;
  referredBy: string;
  onboarded: boolean;
  plan: 'free' | 'pro';
  createdAt: string;
}

export type EnrollmentStatus = 'reserved' | 'paid' | 'scholarship-applied' | 'waitlist' | 'confirmed' | 'completed';

export interface Enrollment {
  id: string;
  bootcampId: string;
  userId: string;
  status: EnrollmentStatus;
  priceUsd: number;
  createdAt: string;
}

/** Statuses that open the cohort space (a free bootcamp also opens on 'reserved'). */
export const COHORT_ACCESS: EnrollmentStatus[] = ['paid', 'confirmed', 'completed'];

export interface Certificate {
  id: string;
  userId: string;
  kind: 'track' | 'bootcamp';
  refId: string;
  title: string;
  recipientName: string;
  detail: string;
  issuedAt: string;
  revoked: boolean;
  isSample?: boolean;
}

export interface Notice {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  applicationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Contribution {
  id: string;
  applicationId?: string;
  projectId?: string;
  projectTitle: string;
  userId: string;
  roles: CreditRole[];
  note: string;
  confirmedByName: string;
  createdAt: string;
}

export type OrgKind = 'school' | 'university' | 'company' | 'ngo' | 'other';
export const ORG_KIND_LABEL: Record<OrgKind, string> = {
  school: 'School',
  university: 'University',
  company: 'Company',
  ngo: 'NGO or funder',
  other: 'Organisation',
};

export interface Organization {
  id: string;
  name: string;
  kind: OrgKind;
  city: string;
  country: string;
  seats: number;
  inviteCode: string;
  note: string;
  createdAt: string;
}

export interface OrgMembership {
  org: Organization;
  role: 'admin' | 'member';
}

export interface OrgReportRow {
  userId: string;
  name: string;
  handle: string;
  level: string;
  role: 'admin' | 'member';
  joinedAt: string;
  lessonsCompleted: number;
  tracksCompleted: number;
  applications: number;
  accepted: number;
  bootcamps: string[]; // "bootcamp-id:status"
  certificates: number;
  lastActive: string;
}

export interface Cohort {
  bootcampId: string;
  meetingUrl: string;
  scheduleNote: string;
  materialsUrl: string;
  instructor: string;
  announcement: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  userId: string;
  bootcampId: string;
  week: number;
  url: string;
  note: string;
  feedback: string;
  status: 'submitted' | 'reviewed';
  updatedAt: string;
  name?: string;
  email?: string;
}
