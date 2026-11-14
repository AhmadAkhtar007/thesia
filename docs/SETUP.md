# Going live: setup checklist

Everything here takes about 30 minutes. Steps marked *optional* can wait until after the beta launch.

## 1. Database (Supabase)

The Supabase project **thesia** already exists (org "Thesia", region ap-south-1 Mumbai, ref `fntkopybcfxjbshmykln`).

1. Open the project in the Supabase dashboard, go to **SQL Editor**, paste `supabase/setup.sql` and run it. (It is `migrations/0001_thesia_core.sql`, then `migrations/0002_platform.sql`, then `seed.sql`. If you run them separately, keep that order: the seed needs tables from 0002.)
2. Open **Advisors > Security** and confirm there are no errors. An "RLS enabled, no policy" notice on `admins` is expected: that table is deliberately unreadable from the app.
3. Sign up on the live site with **buraaqteam@gmail.com** and confirm the email. That address is the first admin (`public.admins`); the admin console at `/admin` opens only for confirmed admin emails. Add more admins with `insert into public.admins (email) values ('name@example.com');`.

What the schema enforces:
- Row-level security on every table. People can only edit their own profile, applications, saved items and progress.
- Clients can't change their plan, badges or payment status; only the Edge Functions (service role) can.
- Free accounts are limited to 5 applications in any 30 days (trigger `enforce_application_limit`).
- Public submissions (suggestions, waitlists, enquiries, scholarship applications) can be inserted by anyone and read only by admins in the console.
- Certificates are issued only by the database: a track certificate when every lesson in the track is complete with at least half the quiz right, a bootcamp certificate when an admin marks the seat completed. Anyone can check one by its ID; school students' certificates never appear in lists.
- Cohort details (joining links, materials) are visible only to people with a paid, confirmed or completed seat, or a reserved seat in a free bootcamp.
- Coordinators see their organisation's members' progress, never messages, application text, scholarship details or payments. Seat limits are enforced when someone joins.
- School students' passports (`level = 'high-school'`) are always private.
- Project leads can't apply to their own projects or confirm their own contributions.

## 2. Auth

In **Authentication > URL configuration**:
- Site URL: your live address, currently `https://thesia-gamma.vercel.app`
- Redirect URLs: add `https://thesia-gamma.vercel.app/welcome`

*Optional:* **Authentication > Providers > Google** to enable "Continue with Google". Email confirmations are on by default; leave them on.

## 3. Environment variables

In Vercel (Project > Settings > Environment Variables) and in a local `.env`:

| Variable | Value |
|---|---|
| `THESIA_SUPABASE_URL` | `https://fntkopybcfxjbshmykln.supabase.co` |
| `THESIA_SUPABASE_ANON_KEY` | Supabase > Project settings > API > publishable / anon key |
| `THESIA_SITE_URL` | your live address |
| `THESIA_CHECKOUT_URLS` | *optional*, see payments |

Redeploy after changing them: the values are compiled into the build.

## 4. AI research guide (optional but recommended)

```bash
supabase functions deploy ask-thesia --project-ref fntkopybcfxjbshmykln
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref fntkopybcfxjbshmykln
```

Free users get 10 guide questions a day (Claude Haiku 5.5); Pro users are unlimited (Claude Sonnet 5.5). Without the key, the app uses its built-in coach automatically.

## 5. Payments with Lemon Squeezy (optional until the first paid cohort)

Stripe doesn't onboard Pakistan-based businesses; Lemon Squeezy acts as merchant of record and pays out to Pakistani bank accounts.

1. Create a store and one product per paid bootcamp, plus "Scholar Pro" monthly and yearly variants. Charge the fair price: either create country-specific variants or use discount codes per tier.
2. Copy each product's checkout link into `THESIA_CHECKOUT_URLS`, keyed by bootcamp id (`survey-sprint`, `data-analysis`, `project-to-paper`, `systematic-review`, `grant-writing`, `young-researchers`) and `pro-monthly` / `pro-yearly`.
3. Deploy the webhook and set its secret:
   ```bash
   supabase functions deploy lemon-webhook --no-verify-jwt --project-ref fntkopybcfxjbshmykln
   supabase secrets set LEMON_SIGNING_SECRET=... --project-ref fntkopybcfxjbshmykln
   ```
4. In Lemon Squeezy > Settings > Webhooks, point to `https://fntkopybcfxjbshmykln.supabase.co/functions/v1/lemon-webhook` with events `order_created`, `subscription_created`, `subscription_updated`, `subscription_expired`.

Until checkout links exist, "Reserve a seat" records the reservation and the student gets a payment link by email when the cohort confirms.

## 6. Deploy

The current demo was deployed straight to the existing Vercel project `thesia` (production alias `thesia-gamma.vercel.app`). For ongoing work, push this folder to a GitHub repository and connect it to that project in Vercel (framework preset: Other; build `npm run build`; output `dist`). `vercel.json` handles routing and caching. Every push to `main` redeploys.

## 7. Email (strongly recommended before launch)

Supabase's built-in email sender is limited to a handful of messages an hour, which sign-ups will hit on day one. In **Authentication > Emails > SMTP settings**, connect a sender such as Resend, Postmark or Amazon SES with a domain you own. Keep "Confirm email" on: admin access depends on it.

## Before public launch

- Replace or clearly keep the "Sample" projects and profiles; the beta banner disappears automatically in live mode, but samples stay labelled.
- Re-check conference dates and set `LISTINGS_VERIFIED_ON` in `src/lib/config.ts`.
- Have the privacy policy and terms reviewed.
- Add a custom domain (e.g. thesia.pk) in Vercel.
