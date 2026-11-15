// Sample content for the beta and for sales demos. Every item here is labelled as a sample in the UI.

import type { Certificate, Organization, OrgReportRow } from '../lib/types';

/** Certificates for sample passports, so the verification page can be shown in a demo. */
export const SAMPLE_CERTIFICATES: Certificate[] = [
  {
    id: 'TH-SAMP-0001',
    userId: 'sample-ayesha-r',
    kind: 'track',
    refId: 'scoping',
    title: 'Scoping & literature review',
    recipientName: 'Ayesha Rehman',
    detail: '4 lessons, each with a quiz passed, Thesia Learn',
    issuedAt: '2026-09-14T10:00:00Z',
    revoked: false,
    isSample: true,
  },
  {
    id: 'TH-SAMP-0002',
    userId: 'sample-ayesha-r',
    kind: 'bootcamp',
    refId: 'survey-sprint',
    title: 'Survey Research Sprint',
    recipientName: 'Ayesha Rehman',
    detail: '4-week live cohort, Thesia Bootcamps',
    issuedAt: '2026-08-30T10:00:00Z',
    revoked: false,
    isSample: true,
  },
];

export const SAMPLE_ORG: Organization = {
  id: 'sample',
  name: 'Crescent Grammar School (sample)',
  kind: 'school',
  city: 'Lahore',
  country: 'Pakistan',
  seats: 40,
  inviteCode: 'SAMPLE01',
  note: 'Young Researchers Programme, spring cohort. Coordinator: A-Level Biology department.',
  createdAt: '2026-09-01T09:00:00Z',
};

const roster: [string, string, number, number, number, number, string[], number, number][] = [
  // name, handle, lessons, tracks, applications, accepted, bootcamps, certificates, days since active
  ['Areeba Khan', 'areeba-k', 17, 2, 2, 1, ['young-researchers:confirmed'], 2, 1],
  ['Hassan Ali', 'hassan-a', 12, 1, 1, 0, ['young-researchers:confirmed'], 1, 2],
  ['Mahnoor Iqbal', 'mahnoor-i', 23, 4, 3, 1, ['young-researchers:confirmed', 'research-launchpad:completed'], 5, 0],
  ['Saad Qureshi', 'saad-q', 6, 1, 0, 0, ['young-researchers:confirmed'], 1, 6],
  ['Eman Shahid', 'eman-s', 9, 1, 1, 0, ['young-researchers:confirmed'], 1, 3],
  ['Abdullah Butt', 'abdullah-b', 3, 0, 0, 0, ['young-researchers:confirmed'], 0, 11],
  ['Zoha Malik', 'zoha-m', 14, 2, 2, 1, ['young-researchers:confirmed'], 2, 1],
  ['Rayyan Siddiqui', 'rayyan-s', 6, 1, 1, 0, ['young-researchers:confirmed'], 1, 4],
  ['Anaya Rizvi', 'anaya-r', 0, 0, 0, 0, [], 0, 19],
  ['Taha Javed', 'taha-j', 11, 1, 1, 0, ['young-researchers:confirmed'], 1, 2],
  ['Laiba Ahmed', 'laiba-a', 20, 3, 2, 1, ['young-researchers:confirmed', 'research-launchpad:completed'], 4, 0],
  ['Musa Chaudhry', 'musa-c', 8, 1, 0, 0, ['young-researchers:confirmed'], 1, 5],
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const SAMPLE_ORG_REPORT: OrgReportRow[] = [
  {
    userId: 'sample-coordinator',
    name: 'Ms. Samina Aslam (sample)',
    handle: '',
    level: 'faculty',
    role: 'admin',
    joinedAt: '2026-09-01T09:00:00Z',
    lessonsCompleted: 0,
    tracksCompleted: 0,
    applications: 0,
    accepted: 0,
    bootcamps: [],
    certificates: 0,
    lastActive: daysAgo(0),
  },
  ...roster.map(([name, handle, lessons, tracks, apps, accepted, bootcamps, certs, active]) => ({
    userId: `sample-${handle}`,
    name,
    handle: '',
    level: 'high-school',
    role: 'member' as const,
    joinedAt: '2026-09-03T09:00:00Z',
    lessonsCompleted: lessons,
    tracksCompleted: tracks,
    applications: apps,
    accepted,
    bootcamps,
    certificates: certs,
    lastActive: daysAgo(active),
  })),
];

export interface Challenge {
  id: string;
  title: string;
  sponsor: string;
  city: string;
  fields: string[];
  question: string;
  deliverable: string;
  weeks: number;
  squad: string;
  reward: string;
  status: 'open' | 'scoping';
}

export const SAMPLE_CHALLENGES: Challenge[] = [
  {
    id: 'wallet-churn',
    title: 'Why do first-time users stop using a mobile wallet?',
    sponsor: 'A Karachi fintech (sample)',
    city: 'Karachi',
    fields: ['economics', 'business', 'social'],
    question: 'Half of new wallet users stop after their first month. Which reasons matter most, and which can the product fix?',
    deliverable: 'A 15-page report with 30 user interviews, a survey of 300 users and three tested recommendations.',
    weeks: 8,
    squad: '4 students and a faculty supervisor',
    reward: 'PKR 200,000 prize pool, plus interviews for internships',
    status: 'open',
  },
  {
    id: 'mango-losses',
    title: 'Cutting post-harvest losses for mango growers',
    sponsor: 'A Multan agri-exporter (sample)',
    city: 'Multan',
    fields: ['agriculture', 'engineering', 'economics'],
    question: 'Where between orchard and port do mangoes spoil, and which low-cost fixes pay for themselves in one season?',
    deliverable: 'A loss map across 12 orchards and a cost-benefit table for five interventions.',
    weeks: 10,
    squad: '4 students and a faculty supervisor',
    reward: 'Four funded bootcamp seats and a paid summer role',
    status: 'open',
  },
  {
    id: 'heat-textiles',
    title: 'Heat, productivity and worker health in textile units',
    sponsor: 'A Faisalabad textile group (sample)',
    city: 'Faisalabad',
    fields: ['public-health', 'environment', 'engineering'],
    question: 'How much output and health are lost on days above 40°C, and which cooling measures work on a factory floor?',
    deliverable: 'A data analysis of two summers of shift records and a short guide for floor managers.',
    weeks: 8,
    squad: '3 students and a public health supervisor',
    reward: 'PKR 150,000 prize pool',
    status: 'scoping',
  },
];
