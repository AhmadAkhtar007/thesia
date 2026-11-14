// Fair pricing by country. All prices are charged in US dollars; the amount depends on the
// buyer's country income group so a student in Lahore and a student in London pay a similar
// share of local income. Free features are free everywhere.

import { countryByName, type Tier } from '../data/countries';

export const TIER_MULTIPLIER: Record<Tier, number> = { A: 1, B: 0.6, C: 0.3, D: 0.2 };
export const TIER_LABEL: Record<Tier, string> = {
  A: 'Standard price',
  B: '40% fair-pricing discount',
  C: '70% fair-pricing discount',
  D: '80% fair-pricing discount',
};

export function tierFor(country: string | undefined): Tier {
  if (!country) return 'A';
  return countryByName(country)?.tier ?? 'A';
}

/** Rounds to friendly prices: $24, $39, $59 rather than $23.70. */
export function fairPrice(listUsd: number, country: string | undefined): number {
  if (listUsd <= 0) return 0;
  const v = listUsd * TIER_MULTIPLIER[tierFor(country)];
  if (v < 10) return Math.max(1, Math.round(v));
  return Math.round(v / 5) * 5 - 1;
}

export function formatUsd(n: number) {
  if (n === 0) return 'Free';
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    blurb: 'Everything a student needs to start research.',
    features: [
      'Research passport profile with contribution record',
      'Apply to up to 5 projects a month',
      'Full Academy: every lesson and quiz',
      'All research tools, including Legit Check',
      'Conference and lab listings, with deadline reminders',
      '10 questions a day to the research guide',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Scholar Pro',
    priceMonthlyUsd: 8,
    priceYearlyUsd: 72,
    blurb: 'For students actively applying, publishing or leading a project.',
    features: [
      'Unlimited project applications and messages',
      'Lead projects with up to 12 collaborators and a shared task board',
      'Unlimited research guide, with feedback on drafts and proposals',
      'Verified skill badges from Academy assessments',
      'Priority review for bootcamp scholarships',
      'Profile analytics: who viewed your passport and from which labs',
    ],
  },
  institution: {
    id: 'institution',
    name: 'Institutions',
    priceMonthlyUsd: null,
    priceYearlyUsd: null,
    blurb: 'For schools, universities, research offices and companies.',
    features: [
      'Licensed seats for students and staff, with a cohort dashboard',
      'Run the Young Researchers Programme in your school',
      'Post research assistant roles and industry challenges',
      'Showcase your lab to students across the network',
      'Reports for accreditation, ORIC and funders',
    ],
  },
} as const;
