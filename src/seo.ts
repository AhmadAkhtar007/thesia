// Page titles and descriptions for the prerendered HTML files, sitemap and link previews.
// scripts/build.mjs reads this at build time; the app itself doesn't import it.

import { TRACKS } from './data/academy';
import { BOOTCAMPS } from './data/bootcamps';

export interface SeoRoute {
  path: string;
  title: string;
  description: string;
  /** Structured data for search engines (schema.org), optional. */
  jsonld?: Record<string, unknown>;
  priority?: number;
}

const TOOLS: [string, string, string][] = [
  ['question-builder', 'Research question builder', 'Turn a topic into a focused research question that names who, where, when and what you will measure, then check it against FINER.'],
  ['legit-check', 'Legit Check: spot predatory journals', 'Screen a journal or conference invitation for the warning signs of predatory publishing before you pay or submit.'],
  ['outreach', 'Email a researcher', 'Write a short, specific email to a researcher that gets read, with checks for the phrases that get ignored.'],
  ['sample-size', 'Sample size calculator', 'Work out how many survey responses you need for a proportion or a mean, with corrections for small populations and non-response.'],
  ['citation', 'Citation builder', 'Format references in APA, MLA, Chicago, Harvard and IEEE for articles, books, web pages and conference papers.'],
  ['consent-form', 'Consent form builder', 'Draft a plain-language informed consent form, including a guardian section for participants under 18.'],
];

export function seoRoutes(siteUrl: string): SeoRoute[] {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Thesia',
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    email: 'buraaqteam@gmail.com',
    description: 'A research marketplace and live research academy for students, started in Pakistan.',
  };
  return [
    {
      path: '/',
      title: 'Thesia: learn research, then do it',
      description: 'Find research projects and the people running them, learn research methods for free, take live bootcamps and build a research passport. Started in Pakistan, open to every country.',
      jsonld: org,
      priority: 1,
    },
    { path: '/projects', title: 'Research projects for students', description: 'Join a research project as a defined contributor. Every role says what you’ll do, how many hours, and how you’ll be credited.', priority: 0.9 },
    { path: '/people', title: 'People in research', description: 'Students, researchers and mentors, each with a research passport showing what they have actually contributed.' },
    { path: '/conferences', title: 'Research conferences in Pakistan, 2026', description: 'Verified research conferences in Pakistan with paper deadlines, dates, indexing and whether students can take part.', priority: 0.9 },
    { path: '/labs', title: 'Research labs and centres in Pakistan', description: 'Where research happens in Pakistan, what each lab works on, and how students usually get involved.' },
    { path: '/opportunities', title: 'Research fellowships and programmes for students', description: 'Funded research programmes, summer schools and scholarships open to students from Pakistan and many other countries, linked to official pages.' },
    { path: '/learn', title: 'Thesia Academy: free research lessons', description: 'Short, free lessons on how research works, from your first question to your first paper, each with a quiz and a certificate for every track.', priority: 0.9 },
    ...TRACKS.map((t) => ({
      path: `/learn/${t.id}`,
      title: `${t.title}: free course`,
      description: t.summary,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: t.title,
        description: t.summary,
        provider: { '@type': 'Organization', name: 'Thesia', sameAs: siteUrl },
        isAccessibleForFree: true,
        educationalLevel: t.level,
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: `PT${t.lessons.reduce((n, l) => n + l.minutes, 0)}M` },
        offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free' },
      },
    })),
    ...TRACKS.flatMap((t) => t.lessons.map((l) => ({ path: `/learn/${t.id}/${l.id}`, title: `${l.title} | ${t.title}`, description: l.summary, priority: 0.6 }))),
    { path: '/bootcamps', title: 'Live research bootcamps', description: 'Small live cohorts that finish with something real: a proposal, a dataset, a paper or a poster. Priced fairly for every country.', priority: 0.9 },
    ...BOOTCAMPS.map((b) => ({
      path: `/bootcamps/${b.id}`,
      title: `${b.title}: live bootcamp`,
      description: `${b.tagline} ${b.weeks} weeks, ${b.hoursPerWeek} hours a week, starts ${b.start}.`,
      priority: 0.8,
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: b.title,
        description: b.tagline,
        provider: { '@type': 'Organization', name: 'Thesia', sameAs: siteUrl },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', startDate: b.start, courseWorkload: `PT${b.weeks * b.hoursPerWeek}H` },
        offers: { '@type': 'Offer', price: b.priceUsd, priceCurrency: 'USD', category: b.priceUsd ? 'Paid' : 'Free' },
      },
    })),
    { path: '/tools', title: 'Free research tools', description: 'Free tools for student researchers: question builder, sample size calculator, citation builder, consent forms, predatory journal check and outreach emails.' },
    ...TOOLS.map(([id, title, description]) => ({ path: `/tools/${id}`, title, description, priority: 0.7 })),
    { path: '/guide', title: 'Research guide', description: 'Describe an idea or where you’re stuck. The guide helps you sharpen your question and points you to projects, people, lessons and tools.' },
    { path: '/pricing', title: 'Pricing: free to start, fair everywhere', description: 'Everything a student needs to begin research is free. Pro and bootcamps are priced in US dollars and adjusted to your country’s income level.' },
    { path: '/institutions', title: 'Thesia for schools, universities and companies', description: 'Run a research programme for your students, give your ORIC a dashboard, or post an industry research challenge.', priority: 0.8 },
    { path: '/challenges', title: 'Industry research challenges', description: 'Companies post a real question and a supervised student squad answers it in eight to ten weeks.' },
    { path: '/impact', title: 'Why Thesia exists', description: 'Talent for research is everywhere. Ways into research are not. The evidence behind Thesia, starting in Pakistan.' },
    { path: '/faculty', title: 'Faculty workspace (demo)', description: 'A demo of the faculty side of Thesia: prioritised student reviews, AI first-pass screening held to critical checks, sign-off and supervision analytics. Illustrative data stored in your browser.', priority: 0.4 },
    { path: '/safeguarding', title: 'Keeping students safe', description: 'How Thesia protects students under 18: private passports, on-platform messages, a teacher in every school session and a one-day response to reports.' },
    { path: '/certificate/verify', title: 'Verify a Thesia certificate', description: 'Check a Thesia Academy or bootcamp certificate by its ID.' },
    { path: '/org/sample', title: 'Sample school dashboard', description: 'What a school coordinator sees on Thesia: every student’s lessons, certificates and applications, with a CSV export.' },
    { path: '/privacy', title: 'Privacy', description: 'How Thesia collects, uses and protects your information.', priority: 0.3 },
    { path: '/terms', title: 'Terms of use', description: 'The terms for using Thesia.', priority: 0.3 },
  ];
}
