import type { Conference } from '../lib/types';

// Curated from official conference sites and university news pages, checked on 2026-10-08.
// Every entry links to the page we verified it against. Dates change: the listing tells
// students to confirm on the official site before submitting or travelling.
//
// To add a conference: append an entry, keep `source` pointing at an official page, and
// never add events that only appear on aggregator sites (see the Legit Check tool for why).

export const CONFERENCES: (Conference & { dateText?: string })[] = [
  {
    id: 'iccor-2026',
    name: 'International Conference on Computing Research',
    short: 'ICCoR 2026',
    host: 'Capital University of Science & Technology (CUST)',
    city: 'Islamabad',
    country: 'Pakistan',
    start: '2026-04-11',
    end: '2026-04-11',
    deadline: '2025-12-31',
    fields: ['cs-ai'],
    topics: ['Machine learning', 'Generative AI', 'Cybersecurity', 'IoT', 'Software engineering', 'Bioinformatics'],
    format: 'in-person',
    studentFriendly: true,
    indexing: 'Papers in the International Journal of Innovations in Science & Technology (HEC Y category); abstract book',
    url: 'https://iccor.cust.edu.pk',
    source: 'https://iccor.cust.edu.pk',
    note: 'Has a research track and an industry track, plus posters.',
  },
  {
    id: 'ivs-urc-2026',
    name: 'IVS Undergraduate Research Conference',
    short: 'IVS URC 2026',
    host: 'Indus Valley School of Art and Architecture',
    city: 'Karachi',
    country: 'Pakistan',
    start: '2026-04-11',
    end: '2026-04-11',
    fields: ['humanities', 'social'],
    topics: ['Space and memory', 'Inequality and ecology in Karachi', 'Cultural practice', 'Gender in life and art'],
    format: 'in-person',
    studentFriendly: true,
    url: 'https://indusvalley.edu.pk/ivs-undergraduate-research-conference-2026/',
    source: 'https://indusvalley.edu.pk/ivs-undergraduate-research-conference-2026/',
    note: 'Third edition. Presenters came from IVS, IBA, NCA, LUMS and Habib University.',
  },
  {
    id: 'ugrad-cebet-2026',
    name: 'UGRAD CEBET: Undergraduate Research Conference on Commerce, Economics, Business, Education and Technology',
    short: 'UGRAD CEBET 2026',
    host: 'Shaikh Ayaz University Shikarpur',
    city: 'Shikarpur',
    country: 'Pakistan',
    start: '2026-04-29',
    end: '2026-04-30',
    fields: ['economics', 'business', 'education', 'cs-ai'],
    topics: ['Commerce', 'Economics', 'Teacher education', 'Computer science', 'English'],
    format: 'in-person',
    studentFriendly: true,
    url: 'https://saus.edu.pk/?p=15506',
    source: 'https://saus.edu.pk/?p=15506',
  },
  {
    id: 'medverse-2026',
    name: "MedVerse'26 International Undergraduate Research Conference",
    short: "MedVerse'26",
    host: 'Fatima Memorial Hospital College of Medicine & Dentistry',
    city: 'Lahore',
    country: 'Pakistan',
    start: '2026-06-01',
    end: '2026-06-09',
    dateText: 'Early June 2026',
    fields: ['public-health'],
    topics: ['Student-led clinical research', 'Healthcare challenges', 'Research trends'],
    format: 'hybrid',
    studentFriendly: true,
    url: 'https://www.app.com.pk/?p=1223198',
    source: 'https://www.app.com.pk/?p=1223198',
    note: '140+ abstracts from 70 medical colleges; oral, poster and virtual poster sessions.',
  },
  {
    id: 'pk-ru-student-2026',
    name: 'Pakistan–Russia International Student Research Conference',
    short: 'PK–RU Student Research 2026',
    host: 'FUUAST, Financial University (Moscow) and CAPES',
    city: 'Online',
    country: 'Pakistan',
    start: '2026-07-06',
    end: '2026-07-06',
    fields: ['social', 'economics'],
    topics: ['International relations', 'Media', 'AI', 'Climate security', 'Trade'],
    format: 'online',
    studentFriendly: true,
    url: 'https://www.app.com.pk/?p=1238581',
    source: 'https://www.app.com.pk/?p=1238581',
  },
  {
    id: 'ibcast-2026',
    name: 'International Bhurban Conference on Applied Sciences & Technology',
    short: '23rd IBCAST',
    host: 'IBCAST organising committee',
    city: 'Murree (Bhurban)',
    country: 'Pakistan',
    start: '2026-08-17',
    end: '2026-08-20',
    deadline: '2026-05-20',
    fields: ['engineering', 'cs-ai', 'physics-math', 'chemistry', 'public-health'],
    topics: ['Advanced materials', 'Aerostructures', 'AI & software', 'Control & signal processing', 'Medical sciences', 'Underwater technologies', 'Wireless & radar'],
    format: 'in-person',
    studentFriendly: false,
    url: 'https://easychair.org/cfp/23rd_IBCAST-2026',
    source: 'https://easychair.org/cfp/23rd_IBCAST-2026',
    note: 'The medical sciences track is held in Islamabad.',
  },
  {
    id: 'aku-research-day-2026',
    name: 'Medicine Science Festival: Annual Research Day',
    short: 'AKU Research Day 2026',
    host: 'Aga Khan University',
    city: 'Karachi',
    country: 'Pakistan',
    start: '2026-08-20',
    end: '2026-08-20',
    fields: ['public-health', 'biology'],
    topics: ['Clinical research', 'Critical care', 'Student and early-career research'],
    format: 'in-person',
    studentFriendly: true,
    url: 'https://zu.edu.pk/medicine-science-festival-annual-research-day-2026-aga-khan-university-karachi/',
    source: 'https://zu.edu.pk/medicine-science-festival-annual-research-day-2026-aga-khan-university-karachi/',
  },
  {
    id: 'aas-in-asia-2026',
    name: 'AAS-in-Asia 2026: Centering Asia',
    short: 'AAS-in-Asia 2026',
    host: 'Association for Asian Studies and LUMS',
    city: 'Lahore',
    country: 'Pakistan',
    start: '2026-09-25',
    end: '2026-09-27',
    fields: ['humanities', 'social', 'economics'],
    topics: ['History', 'Political science', 'Anthropology', 'Literature', 'Economics', 'Arts'],
    format: 'in-person',
    studentFriendly: false,
    url: 'https://aasinasia2026.lums.edu.pk',
    source: 'https://propakistani.pk/2026/07/27/lums-brings-worlds-largest-asian-studies-conference-to-pakistan-for-the-first-time/',
    note: 'First time in Pakistan; 1,000+ scholars from 37+ countries. A scholar support fund helped Pakistani researchers attend.',
  },
  {
    id: 'psde-39',
    name: '39th Annual General Meeting & Conference of the Pakistan Society of Development Economists',
    short: 'PSDE 39th AGM',
    host: 'Pakistan Institute of Development Economics (PIDE)',
    city: 'Islamabad',
    country: 'Pakistan',
    start: '2026-10-14',
    end: '2026-10-15',
    fields: ['economics', 'social'],
    topics: ['Export-led growth', 'Development policy', 'Trade'],
    format: 'in-person',
    studentFriendly: true,
    url: 'https://psde.pide.org.pk',
    source: 'https://psde.pide.org.pk/wp-content/uploads/flyer-for-chinese-experts-AGM-39.pdf',
    note: 'Theme: “Mission $100 Billion: the national race for sustainable export-led prosperity.” Students usually attend as audience.',
  },
  {
    id: 'icic-2026',
    name: 'International Conference on Innovative Computing',
    short: 'ICIC 2026',
    host: 'University of Management and Technology (UMT)',
    city: 'Lahore',
    country: 'Pakistan',
    start: '2026-12-02',
    end: '2026-12-03',
    deadline: '2026-10-11',
    deadlineNote: 'Full papers. Registration closes 20 Nov 2026.',
    fields: ['cs-ai'],
    topics: ['Computing', 'AI', 'Data science'],
    format: 'in-person',
    studentFriendly: true,
    indexing: 'Previous edition published in IEEE Xplore',
    url: 'https://icic.umt.edu.pk/',
    source: 'https://icic.umt.edu.pk/',
  },
  {
    id: 'fit-2026',
    name: '23rd International Conference on Frontiers of Information Technology',
    short: 'FIT 2026',
    host: 'COMSATS University Islamabad',
    city: 'Islamabad',
    country: 'Pakistan',
    start: '2026-12-14',
    end: '2026-12-15',
    deadline: '2026-08-09',
    deadlineNote: 'Technical papers, tutorials and PhD symposium.',
    fields: ['cs-ai'],
    topics: ['NLP & generative AI', 'Explainable AI', 'Computer vision', 'Cybersecurity', 'Remote sensing', 'Human-centered agentic AI'],
    format: 'in-person',
    studentFriendly: true,
    indexing: 'Technically co-sponsored by IEEE Islamabad Section; papers submitted to IEEE Xplore',
    url: 'https://fit.edu.pk/',
    source: 'https://fit.edu.pk/',
    note: 'Includes a PhD symposium. Worth attending as audience even without a paper.',
  },
  {
    id: 'icosst-2026',
    name: 'International Conference on Open Source Systems and Technologies',
    short: 'ICOSST 2026',
    host: 'Al-Khawarizmi Institute of Computer Science (KICS), UET Lahore',
    city: 'Lahore',
    country: 'Pakistan',
    start: '2026-12-22',
    end: '2026-12-23',
    submissionsClosed: true,
    deadlineNote: 'The official site lists submissions as closed. Camera-ready papers are due 1 Nov 2026.',
    fields: ['cs-ai'],
    topics: ['Computational intelligence', 'AI', 'Cybersecurity', 'Smart cities', 'Cultural heritage', 'Business intelligence'],
    format: 'in-person',
    studentFriendly: true,
    indexing: 'IEEE technical co-sponsorship; proceedings in IEEE Xplore',
    url: 'https://icosst.kics.edu.pk/',
    source: 'https://icosst.kics.edu.pk/',
  },
  {
    id: 'iccii-2026',
    name: 'International Conference on Computing, Intelligence and Innovation',
    short: 'ICCII 2026',
    host: 'Riphah International University',
    city: 'Islamabad',
    country: 'Pakistan',
    start: '2026-12-23',
    end: '2026-12-24',
    deadline: '2026-10-15',
    fields: ['cs-ai'],
    topics: ['AI', 'Data science', 'Cybersecurity', 'Cloud computing', 'Emerging technologies'],
    format: 'in-person',
    studentFriendly: true,
    url: 'https://iccii.riphah.edu.pk/',
    source: 'https://iccii.riphah.edu.pk/',
  },
];

export type ConferenceStatus = 'open' | 'closing' | 'closed' | 'upcoming' | 'past';

export function conferenceStatus(c: Conference, today = new Date()): ConferenceStatus {
  const t = startOfDay(today);
  const end = startOfDay(new Date(c.end));
  if (end < t) return 'past';
  if (c.submissionsClosed) return 'closed';
  if (c.deadline) {
    const d = startOfDay(new Date(c.deadline));
    const days = Math.round((d.getTime() - t.getTime()) / 86400000);
    if (days >= 0 && days <= 14) return 'closing';
    if (days > 14) return 'open';
    return 'closed';
  }
  return 'upcoming';
}

export function daysUntil(iso: string, today = new Date()) {
  return Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(today).getTime()) / 86400000);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Aggregator sites list hundreds of "international conferences" per city per day. We track the pattern for the Legit Check tool. */
export const AGGREGATOR_NOISE = {
  site: 'conferenceindex.org',
  city: 'Karachi',
  date: '30 December 2026',
  count: 250,
  checked: '2026-10-08',
};
