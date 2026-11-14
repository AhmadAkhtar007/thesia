# Thesia

The research network and learning platform for students. Students find people working on their question, join real research projects in defined CRediT roles, learn methods in a free Academy, track verified conferences and labs, and build a public research passport. Started in Pakistan, built for every country.

**Live demo:** https://thesia-gamma.vercel.app (Vercel project `thesia`, demo mode: data is saved in the visitor's browser until Supabase keys are added).

## What's in the box

| Area | What it does | Where |
|---|---|---|
| Home + search | Ask a research question; a live concept map highlights matching topics; search across everything | `src/pages/Home.tsx`, `src/pages/Search.tsx`, `src/components/Atlas.tsx` |
| Projects marketplace | Browse/filter projects, fit score, apply for a role, post a project, owners review applications | `src/pages/Projects.tsx`, `ProjectDetail.tsx`, `ProjectNew.tsx` |
| Fellowships & programmes | 18 real programmes linked to official pages | `src/pages/Opportunities.tsx`, `src/data/programs.ts` |
| People | Research passports with CRediT contribution records | `src/pages/People.tsx` |
| Conferences | Verified Pakistan 2026 conferences with deadlines and status, country picker + waitlist for other countries | `src/pages/Conferences.tsx`, `src/data/conferences.ts` |
| Labs | 19 Pakistani research labs and centres | `src/pages/Labs.tsx`, `src/data/labs.ts` |
| Academy | 5 tracks, 23 lessons with quizzes and progress | `src/pages/Learn.tsx`, `src/data/academy/*` |
| Bootcamps | 7 cohorts, fair pricing by country, reservations, scholarships, checkout hook | `src/pages/Bootcamps.tsx`, `src/data/bootcamps.ts` |
| Tools | Question builder, Legit Check, outreach composer, sample size, citations, consent forms | `src/pages/tools/*` |
| Research guide | AI mentor (Claude) with a built-in coach fallback | `src/pages/Guide.tsx`, `src/lib/guide.ts`, `supabase/functions/ask-thesia` |
| Pricing, institutions, impact | Freemium plans, B2B offers, the evidence case with sources | `src/pages/Pricing.tsx`, `Institutions.tsx`, `Impact.tsx` |
| Accounts | Sign up/in (password, magic link, Google), onboarding, dashboard with outputs editor and referral link | `src/pages/Auth.tsx`, `Dashboard.tsx` |
| Messages | Applicant ↔ project-lead threads tied to each application, with a report link | `src/components/Thread.tsx` |
| Confirmed contributions | Leads confirm an accepted contributor's CRediT roles; they appear on the passport | `ProjectDetail.tsx`, `confirm_contribution()` |
| Certificates | Verifiable certificates for finished tracks and bootcamps, LinkedIn add-to-profile, print to PDF | `src/pages/Certificate.tsx` |
| Cohort space | Joining link, schedule, materials, weekly hand-ins and instructor feedback for enrolled students | `src/pages/Cohort.tsx` |
| Organisations (B2B) | Schools and universities: invite link/code, seat limits, coordinator dashboard, CSV export, sample dashboard at `/org/sample` | `src/pages/Org.tsx` |
| Notifications | Header bell and `/notifications` for applications, messages, certificates, feedback | `src/pages/Notifications.tsx` |
| Admin console | Metrics, enquiry inbox, enrollments → certificates, cohorts and feedback, organisations, profile verification | `src/pages/Admin.tsx` |
| Industry challenges, safeguarding | Company research challenges with forms; safeguarding commitments for under-18s | `src/pages/Challenges.tsx`, `Safeguarding.tsx` |
| SEO + installable app | One prerendered HTML file per public page with link-preview tags, sitemap, robots, web manifest, service worker | `scripts/build.mjs`, `src/seo.ts`, `public/` |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (demo mode until you add Supabase keys)
npm run build      # production build in dist/
npm run build:artifact   # one self-contained HTML file in dist-artifact/
```

Requires Node 20+. The build uses esbuild directly (`scripts/build.mjs`); there is no other bundler.

### Demo mode vs live mode

Without Supabase settings the app runs in **demo mode**: sample projects and profiles, and everything a visitor does is stored in their browser. With `THESIA_SUPABASE_URL` and `THESIA_SUPABASE_ANON_KEY` set at build time it runs in **live mode** against Supabase. All data access goes through one interface (`src/lib/repo/types.ts`) with two implementations (`local.ts`, `remote.ts`).

## Set up the live backend

Full steps are in [`docs/SETUP.md`](docs/SETUP.md). In short:

1. Run `supabase/setup.sql` in the Supabase SQL editor (project `fntkopybcfxjbshmykln`). It is `0001_thesia_core.sql`, `0002_platform.sql` and `seed.sql` in that order; you can also run the three files one by one in that order.
2. Copy `.env.example` to `.env` and fill in the anon key and site URL; add the same variables in Vercel.
3. Deploy the Edge Functions and set their secrets (`ANTHROPIC_API_KEY`, `LEMON_SIGNING_SECRET`).
4. In Supabase Auth, set the Site URL and redirect URL to your domain + `/welcome`, and enable Google if wanted.

## Code map

```
src/
  App.tsx              routes
  lib/                 config, router, Supabase client, data layer, search/matching, pricing, guide
  components/          layout, ledger rows, concept map, UI primitives
  pages/               one file per page (tools in pages/tools)
  data/                curated listings (conferences, labs, programmes), bootcamps, Academy lessons, samples
  styles/app.css       the design system (tokens at the top)
supabase/
  migrations/          0001 core schema, 0002 platform (admin, orgs, certificates, cohorts, messages, notifications)
  seed.sql             sample projects + track/bootcamp catalogue (generated by scripts/gen-seed.mjs)
  setup.sql            0001 + 0002 + seed in one file, for a one-paste setup
  functions/           ask-thesia (AI guide), lemon-webhook (payments)
```

## Running it day to day

See [`docs/OPERATIONS.md`](docs/OPERATIONS.md): onboarding a school, running a cohort from seat to certificate, answering the inbox and verifying passports.

## Keeping listings honest

Conferences, labs and programmes are curated in `src/data/*.ts` and link to the official page they were verified against. Only add events hosted by a university, society or institute. `LISTINGS_VERIFIED_ON` in `src/lib/config.ts` records the last check.

## Design

Concept: a researcher's lab notebook. Indigo ink on cool graph paper, a yellow highlighter for what's relevant to you, the notebook's red margin rule for deadlines and lessons. Typefaces: Literata (display) and Atkinson Hyperlegible Next (body), chosen for readability by people reading in a second language. Light and dark (cyanotype) themes are defined as tokens at the top of `src/styles/app.css`.
