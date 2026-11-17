-- ============================================================================
-- Thesia Database Setup for Neon Serverless Postgres
-- Compatible with Neon Data API, Neon Authorize, and Neon Auth
-- ============================================================================

-- 1. Create required extensions
create extension if not exists pgcrypto;

-- 2. Ensure roles exist (Neon / PostgreSQL compatibility)
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end
$$;

-- 3. Setup auth schema & users table for Neon
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  email_confirmed_at timestamptz default now(),
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4. auth.uid() function compatible with Neon Authorize & PostgREST/JWT
create or replace function auth.uid() returns uuid as $$
declare
  sub text;
begin
  -- Try request.jwt.claim.sub (PostgREST / Neon Data API standard)
  begin
    sub := current_setting('request.jwt.claim.sub', true);
  exception when others then
    sub := null;
  end;

  -- Fallback to auth.user_id() if provided by Neon Authorize / pg_session_jwt
  if sub is null or sub = '' then
    begin
      execute 'select auth.user_id()' into sub;
    exception when others then
      sub := null;
    end;
  end if;

  if sub is null or sub = '' then
    return null;
  end if;

  begin
    return sub::uuid;
  exception when others then
    return null;
  end;
end;
$$ language plpgsql stable security definer;

-- Grant permissions on auth schema to authenticated and anon
grant usage on schema auth to anon, authenticated, service_role;
grant select on table auth.users to anon, authenticated, service_role;

-- Thesia: complete database setup in one paste. Run in the Supabase SQL editor on an empty project.
-- Contents: migrations/0001_thesia_core.sql, migrations/0002_platform.sql, seed.sql (in that order).

-- Thesia core schema: profiles, projects, applications, saved items, lesson progress,
-- bootcamp enrollments, public submissions and AI guide usage.
-- Row-level security is on for every table. Clients use the anon key; privileged writes
-- (payments, plan changes, AI usage) happen in Edge Functions with the service role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth user, created by trigger on sign-up.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 120),
  handle text unique check (handle ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  level text not null default '' check (level in ('', 'high-school', 'undergrad', 'masters', 'phd', 'early-career', 'faculty')),
  fields text[] not null default '{}',
  city text not null default '' check (char_length(city) <= 80),
  country text not null default '' check (char_length(country) <= 80),
  affiliation text not null default '' check (char_length(affiliation) <= 160),
  headline text not null default '' check (char_length(headline) <= 160),
  bio text not null default '' check (char_length(bio) <= 1200),
  skills text[] not null default '{}',
  goals text[] not null default '{}',
  open_to text[] not null default '{}',
  languages text[] not null default '{}',
  links jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '[]'::jsonb,
  credit jsonb not null default '{}'::jsonb,
  badges text[] not null default '{}',
  onboarded boolean not null default false,
  is_public boolean not null default true,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are visible to everyone"
  on public.profiles for select
  using ((is_public and onboarded) or id = (select auth.uid()));

create policy "People update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Clients may edit profile content but never their plan or badges.
revoke update on public.profiles from anon, authenticated;
grant update (name, handle, level, fields, city, country, affiliation, headline, bio, skills, goals,
  open_to, languages, links, outputs, onboarded, is_public, updated_at) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Projects posted by researchers, labs and student leads.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid references auth.users (id) on delete set null,
  title text not null check (char_length(title) between 5 and 160),
  summary text not null check (char_length(summary) between 10 and 300),
  description text not null default '' check (char_length(description) <= 8000),
  fields text[] not null default '{}',
  tags text[] not null default '{}',
  levels text[] not null default '{}',
  city text not null default '',
  country text not null default 'Pakistan',
  mode text not null check (mode in ('remote', 'onsite', 'hybrid')),
  hours_per_week int not null check (hours_per_week between 1 and 60),
  duration_weeks int not null check (duration_weeks between 1 and 104),
  compensation text not null check (compensation in ('paid', 'stipend', 'unpaid', 'course-credit')),
  stipend text,
  roles jsonb not null default '[]'::jsonb,
  lead jsonb not null,
  ethics text not null check (ethics in ('approved', 'in-review', 'not-required')),
  credit text not null default '',
  apply_by date not null,
  start_date date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status, created_at desc);
create index if not exists projects_owner_idx on public.projects (owner_id);

alter table public.projects enable row level security;

create policy "Projects are visible to everyone"
  on public.projects for select using (true);

create policy "Signed-in people post their own projects"
  on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()) and is_sample = false);

create policy "Owners edit their projects"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and is_sample = false);

create policy "Owners delete their projects"
  on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Applications to project roles.
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects (id) on delete cascade,
  role_id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  applicant_name text not null check (char_length(applicant_name) between 1 and 120),
  pitch text not null check (char_length(pitch) between 20 and 2000),
  hours_per_week int not null check (hours_per_week between 1 and 60),
  status text not null default 'sent' check (status in ('sent', 'viewed', 'shortlisted', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (project_id, role_id, user_id)
);

create index if not exists applications_user_idx on public.applications (user_id, created_at desc);
create index if not exists applications_project_idx on public.applications (project_id);

alter table public.applications enable row level security;

create policy "Applicants and project owners see applications"
  on public.applications for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
  );

create policy "People apply as themselves"
  on public.applications for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'sent');

create policy "Project owners update application status"
  on public.applications for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));

revoke update on public.applications from anon, authenticated;
grant update (status) on public.applications to authenticated;

-- Free plan: five applications in any 30-day window.
create or replace function public.enforce_application_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_plan text;
  recent int;
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  if coalesce(user_plan, 'free') = 'free' then
    select count(*) into recent from public.applications
      where user_id = new.user_id and created_at > now() - interval '30 days';
    if recent >= 5 then
      raise exception 'monthly_application_limit' using hint = 'Free accounts can send 5 applications every 30 days.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists applications_limit on public.applications;
create trigger applications_limit
  before insert on public.applications
  for each row execute function public.enforce_application_limit();

-- ---------------------------------------------------------------------------
-- Saved items and Academy progress (private to each person).
-- ---------------------------------------------------------------------------
create table if not exists public.saved_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('project', 'conference', 'lab', 'program', 'person', 'bootcamp')),
  ref_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref_id)
);

alter table public.saved_items enable row level security;
create policy "People manage their saved items"
  on public.saved_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table if not exists public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_key text not null check (char_length(lesson_key) <= 120),
  score int not null default 0 check (score between 0 and 100),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_key)
);

alter table public.lesson_progress enable row level security;
create policy "People manage their lesson progress"
  on public.lesson_progress for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Bootcamp enrollments. "paid" is only ever set by the payment webhook.
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  bootcamp_id text not null check (char_length(bootcamp_id) <= 80),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null check (status in ('reserved', 'paid', 'scholarship-applied', 'waitlist')),
  price_usd numeric(8, 2) not null default 0,
  payment_ref text,
  created_at timestamptz not null default now(),
  unique (user_id, bootcamp_id)
);

alter table public.enrollments enable row level security;

create policy "People see their enrollments"
  on public.enrollments for select to authenticated
  using (user_id = (select auth.uid()));

create policy "People reserve seats for themselves"
  on public.enrollments for insert to authenticated
  with check (user_id = (select auth.uid()) and status in ('reserved', 'scholarship-applied', 'waitlist'));

create policy "People change their own unpaid reservations"
  on public.enrollments for update to authenticated
  using (user_id = (select auth.uid()) and status <> 'paid')
  with check (user_id = (select auth.uid()) and status in ('reserved', 'scholarship-applied', 'waitlist'));

revoke update on public.enrollments from anon, authenticated;
grant update (status, price_usd) on public.enrollments to authenticated;

-- ---------------------------------------------------------------------------
-- Public submissions: suggested conferences and labs, institution enquiries,
-- teaching and ambassador applications, country waitlists, feedback.
-- Anyone can submit; only the team (service role / dashboard) can read.
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('conference', 'lab', 'institution', 'teach', 'ambassador', 'country-waitlist', 'feedback')),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  name text check (char_length(name) <= 160),
  country text check (char_length(country) <= 80),
  payload jsonb not null default '{}'::jsonb check (pg_column_size(payload) < 8000),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;
create policy "Anyone can submit"
  on public.submissions for insert to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Research guide usage, written by the ask-thesia Edge Function.
-- ---------------------------------------------------------------------------
create table if not exists public.guide_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, day)
);

alter table public.guide_usage enable row level security;
create policy "People see their own guide usage"
  on public.guide_usage for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Public, privacy-safe counts for the impact page.
-- ---------------------------------------------------------------------------
create or replace function public.platform_stats()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'researchers', (select count(*) from public.profiles where onboarded),
    'projects', (select count(*) from public.projects where not is_sample),
    'applications', (select count(*) from public.applications),
    'lessons_completed', (select count(*) from public.lesson_progress),
    'countries', (select count(distinct country) from public.profiles where onboarded and country <> '')
  );
$$;

grant execute on function public.platform_stats() to anon, authenticated;

-- ============================================================================
-- 0002_platform.sql
-- ============================================================================
-- Thesia platform features, on top of 0001_thesia_core.sql:
--   admins and verified profiles, referrals, organisations (B2B seats and reports),
--   certificates, bootcamp cohorts and assignments, confirmed CRediT contributions,
--   messages on applications, in-app notifications, and an admin inbox for submissions.
-- Security model: clients only ever use the anon key. Everything privileged runs inside
-- SECURITY DEFINER functions that check the caller first (is_admin, is_org_admin, ownership).

-- ---------------------------------------------------------------------------
-- Helpers: lock down function execution. Supabase grants EXECUTE on new public
-- functions to anon and authenticated by default, so each function below is
-- revoked first and then granted only to the roles that need it.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Admins. Only confirmed email addresses count, so nobody can sign up with an
-- admin's address and inherit the role before confirming it.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
-- No policies: the table is readable only through is_admin() and the service role.

insert into public.admins (email) values ('mrahmadakhtar@gmail.com'), ('zafarmaarij@gmail.com') on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on a.email = lower(u.email)
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles: verification (set by admins) and referrals (set once by the person).
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists verified boolean not null default false;
alter table public.profiles add column if not exists referred_by text check (char_length(referred_by) <= 40);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by) where referred_by is not null;
grant update (referred_by) on public.profiles to authenticated;

-- referred_by can be set once and never to your own handle.
-- School students' passports are always private (see /safeguarding in the app).
create or replace function public.guard_profile_referral()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.level = 'high-school' then
    new.is_public := false;
  end if;
  if tg_op = 'UPDATE' and old.referred_by is not null then
    new.referred_by := old.referred_by;
  else
    new.referred_by := lower(nullif(trim(new.referred_by), ''));
    if new.referred_by is not null and new.handle is not null and new.referred_by = new.handle then
      new.referred_by := null;
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_profile_referral() from public, anon, authenticated;

drop trigger if exists profiles_referral_guard on public.profiles;
create trigger profiles_referral_guard
  before insert or update on public.profiles
  for each row execute function public.guard_profile_referral();

-- Anonymous visitors only see passport fields, not plan, goals or referrals.
revoke select on public.profiles from anon;
grant select (id, handle, name, headline, affiliation, city, country, level, fields, skills, credit, bio, open_to,
  outputs, languages, links, badges, verified, onboarded, is_public, created_at) on public.profiles to anon;

-- Handles of private passports are invisible to other people, so availability is checked here.
create or replace function public.handle_available(h text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles p where p.handle = lower(trim(h)) and p.id is distinct from (select auth.uid())
  );
$$;
revoke execute on function public.handle_available(text) from public;
grant execute on function public.handle_available(text) to anon, authenticated;

-- Project leads can't apply to their own projects (and so can't confirm their own contributions).
drop policy if exists "People apply as themselves" on public.applications;
create policy "People apply as themselves"
  on public.applications for insert to authenticated
  with check (
    user_id = (select auth.uid()) and status = 'sent'
    and not exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
  );

-- New users: pick up the name and the referral code passed at sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ref text := lower(nullif(trim(new.raw_user_meta_data ->> 'ref'), ''));
begin
  if ref is not null and ref !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' then
    ref := null;
  end if;
  insert into public.profiles (id, name, referred_by)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''), 120), ref)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- How many people joined with my referral link.
create or replace function public.my_referral_count()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.profiles p
  where p.referred_by is not null
    and p.referred_by = (select handle from public.profiles where id = (select auth.uid()));
$$;
revoke execute on function public.my_referral_count() from public, anon;
grant execute on function public.my_referral_count() to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications. Written only by triggers and functions in this file.
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (char_length(kind) <= 40),
  title text not null check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 600),
  link text not null default '' check (char_length(link) <= 300),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;

create policy "People see their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "People mark their notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "People clear their notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify(target uuid, n_kind text, n_title text, n_body text, n_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select target, n_kind, left(n_title, 200), left(coalesce(n_body, ''), 600), left(coalesce(n_link, ''), 300)
  where target is not null;
$$;
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;

-- Applications: tell the project owner about new applications and the applicant about decisions.
create or replace function public.on_application_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj record;
begin
  select id, title, owner_id into proj from public.projects where id = new.project_id;
  if tg_op = 'INSERT' then
    if proj.owner_id is not null and proj.owner_id <> new.user_id then
      perform public.notify(proj.owner_id, 'application', 'New application: ' || new.applicant_name,
        'For ' || proj.title, '/projects/' || proj.id);
    end if;
  elsif new.status is distinct from old.status and new.status in ('shortlisted', 'accepted', 'declined') then
    perform public.notify(new.user_id, 'application-status',
      case new.status
        when 'accepted' then 'You were accepted: ' || proj.title
        when 'shortlisted' then 'You were shortlisted: ' || proj.title
        else 'Update on your application: ' || proj.title
      end,
      case new.status
        when 'declined' then 'The lead has filled this role. Keep going: new projects are posted every week.'
        else 'Open the project to message the lead.'
      end,
      '/projects/' || proj.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.on_application_change() from public, anon, authenticated;

drop trigger if exists applications_notify on public.applications;
create trigger applications_notify
  after insert or update of status on public.applications
  for each row execute function public.on_application_change();

-- ---------------------------------------------------------------------------
-- Messages between an applicant and the project lead.
-- ---------------------------------------------------------------------------
create or replace function public.can_access_application(app uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.applications a
    join public.projects p on p.id = a.project_id
    where a.id = app and (a.user_id = (select auth.uid()) or p.owner_id = (select auth.uid()))
  );
$$;
revoke execute on function public.can_access_application(uuid) from public, anon;
grant execute on function public.can_access_application(uuid) to authenticated;

create table if not exists public.application_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists application_messages_app_idx on public.application_messages (application_id, created_at);
alter table public.application_messages enable row level security;

create policy "Applicant and lead read their thread"
  on public.application_messages for select to authenticated
  using (public.can_access_application(application_id));
create policy "Applicant and lead write in their thread"
  on public.application_messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.can_access_application(application_id));

create or replace function public.on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  a record;
  target uuid;
begin
  select ap.user_id, ap.applicant_name, p.owner_id, p.title, p.id as project_id into a
  from public.applications ap join public.projects p on p.id = ap.project_id
  where ap.id = new.application_id;
  target := case when new.sender_id = a.user_id then a.owner_id else a.user_id end;
  if target is not null and target <> new.sender_id then
    perform public.notify(target, 'message',
      case when new.sender_id = a.user_id then 'Message from ' || a.applicant_name else 'Message from the project lead' end,
      left(new.body, 140), '/projects/' || a.project_id || '?thread=' || new.application_id);
  end if;
  return new;
end;
$$;
revoke execute on function public.on_message_insert() from public, anon, authenticated;

drop trigger if exists application_messages_notify on public.application_messages;
create trigger application_messages_notify
  after insert on public.application_messages
  for each row execute function public.on_message_insert();

-- ---------------------------------------------------------------------------
-- Confirmed contributions: a project lead confirms which CRediT roles an accepted
-- contributor held. These build the contribution record on the research passport.
-- ---------------------------------------------------------------------------
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.applications (id) on delete set null,
  project_id text references public.projects (id) on delete set null,
  project_title text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  roles text[] not null check (cardinality(roles) between 1 and 14),
  note text not null default '' check (char_length(note) <= 600),
  confirmed_by_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists contributions_user_idx on public.contributions (user_id, created_at desc);
alter table public.contributions enable row level security;

create policy "Contributions on public passports are public"
  on public.contributions for select
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles pr where pr.id = user_id and pr.is_public and pr.onboarded)
  );

create or replace function public.confirm_contribution(app uuid, credit_roles text[], contribution_note text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a record;
  allowed text[] := array['conceptualization','data-curation','formal-analysis','funding','investigation','methodology',
    'project-admin','resources','software','supervision','validation','visualization','writing-draft','writing-review'];
  lead_name text;
begin
  select ap.id, ap.user_id, ap.status, p.id as project_id, p.title, p.owner_id, p.lead into a
  from public.applications ap join public.projects p on p.id = ap.project_id
  where ap.id = app;
  if not found or a.owner_id is distinct from (select auth.uid()) then
    raise exception 'not_project_owner';
  end if;
  if a.user_id = a.owner_id then
    raise exception 'cannot_confirm_own_contribution';
  end if;
  if a.status <> 'accepted' then
    raise exception 'not_accepted' using hint = 'Mark the application accepted before confirming a contribution.';
  end if;
  if credit_roles is null or cardinality(credit_roles) = 0 or not (credit_roles <@ allowed) then
    raise exception 'invalid_roles';
  end if;
  lead_name := coalesce(a.lead ->> 'name', '');

  insert into public.contributions (application_id, project_id, project_title, user_id, roles, note, confirmed_by_name)
  values (a.id, a.project_id, a.title, a.user_id, credit_roles, left(coalesce(contribution_note, ''), 600), lead_name)
  on conflict (application_id) do update set roles = excluded.roles, note = excluded.note, confirmed_by_name = excluded.confirmed_by_name;

  update public.profiles pr set credit = coalesce((
    select jsonb_object_agg(role, n)
    from (select unnest(c.roles) as role, count(*) as n from public.contributions c where c.user_id = a.user_id group by 1) t
  ), '{}'::jsonb)
  where pr.id = a.user_id;

  perform public.notify(a.user_id, 'contribution', 'Contribution confirmed: ' || a.title,
    'Your CRediT roles are now on your research passport.', '/dashboard');
end;
$$;
revoke execute on function public.confirm_contribution(uuid, text[], text) from public, anon;
grant execute on function public.confirm_contribution(uuid, text[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- Catalogue of Academy tracks and bootcamps (seeded from the app's data files
-- by scripts/gen-seed.mjs). The database uses it to check track completion,
-- free-cohort access and certificate titles.
-- ---------------------------------------------------------------------------
create table if not exists public.track_catalog (
  id text primary key,
  title text not null,
  lesson_ids text[] not null
);
create table if not exists public.bootcamp_catalog (
  id text primary key,
  title text not null,
  price_usd numeric(8, 2) not null default 0,
  weeks int not null default 1,
  start_date date
);
alter table public.track_catalog enable row level security;
alter table public.bootcamp_catalog enable row level security;
create policy "Catalogue is public" on public.track_catalog for select using (true);
create policy "Bootcamp catalogue is public" on public.bootcamp_catalog for select using (true);

-- ---------------------------------------------------------------------------
-- Certificates, publicly verifiable at /certificate/<id>.
-- ---------------------------------------------------------------------------
create table if not exists public.certificates (
  id text primary key default ('TH-' || upper(substr(md5(gen_random_uuid()::text), 1, 4)) || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 4))),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('track', 'bootcamp')),
  ref_id text not null,
  title text not null,
  recipient_name text not null,
  detail text not null default '',
  revoked boolean not null default false,
  issued_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)
);
create index if not exists certificates_user_idx on public.certificates (user_id);
alter table public.certificates enable row level security;
-- Listing is limited to your own certificates and those on public passports (school students'
-- names never appear in a list). Anyone can still check one certificate by its ID.
create policy "Own certificates and those on public passports"
  on public.certificates for select
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles pr where pr.id = user_id and pr.is_public and pr.onboarded)
  );

create or replace function public.verify_certificate(cert text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object('id', c.id, 'user_id', c.user_id, 'kind', c.kind, 'ref_id', c.ref_id, 'title', c.title,
    'recipient_name', c.recipient_name, 'detail', c.detail, 'issued_at', c.issued_at, 'revoked', c.revoked)
  from public.certificates c where c.id = upper(trim(cert));
$$;
revoke execute on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

create or replace function public.on_certificate_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify(new.user_id, 'certificate', 'Certificate issued: ' || new.title,
    'Add it to LinkedIn or share the verification link.', '/certificate/' || new.id);
  return new;
end;
$$;
revoke execute on function public.on_certificate_insert() from public, anon, authenticated;

drop trigger if exists certificates_notify on public.certificates;
create trigger certificates_notify
  after insert on public.certificates
  for each row execute function public.on_certificate_insert();

-- Claim a track certificate once every lesson in the track is complete. Also adds the track badge.
create or replace function public.claim_track_certificate(track text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  t record;
  done int;
  cert_id text;
  who text;
begin
  if me is null then raise exception 'not_signed_in'; end if;
  select * into t from public.track_catalog where id = track;
  if not found then raise exception 'unknown_track'; end if;
  -- Every lesson must be complete with at least half the quiz right (the app enforces the same mark).
  select count(*) into done from public.lesson_progress lp
    where lp.user_id = me and lp.score >= 50
      and lp.lesson_key = any (select track || '/' || l from unnest(t.lesson_ids) l);
  if done < cardinality(t.lesson_ids) then raise exception 'track_incomplete'; end if;

  select coalesce(nullif(name, ''), 'Thesia learner') into who from public.profiles where id = me;
  insert into public.certificates (user_id, kind, ref_id, title, recipient_name, detail)
  values (me, 'track', track, t.title, who, cardinality(t.lesson_ids) || ' lessons, each with a quiz passed, Thesia Academy')
  on conflict (user_id, kind, ref_id) do nothing;
  select id into cert_id from public.certificates where user_id = me and kind = 'track' and ref_id = track;

  update public.profiles set badges = array(select distinct unnest(badges || array[track]))
  where id = me and not (track = any (badges));
  return cert_id;
end;
$$;
revoke execute on function public.claim_track_certificate(text) from public, anon;
grant execute on function public.claim_track_certificate(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Bootcamp delivery: enrollment statuses, cohort details and weekly assignments.
-- ---------------------------------------------------------------------------
alter table public.enrollments drop constraint if exists enrollments_status_check;
alter table public.enrollments add constraint enrollments_status_check
  check (status in ('reserved', 'paid', 'scholarship-applied', 'waitlist', 'confirmed', 'completed'));

drop policy if exists "People change their own unpaid reservations" on public.enrollments;
create policy "People change their own unpaid reservations"
  on public.enrollments for update to authenticated
  using (user_id = (select auth.uid()) and status in ('reserved', 'scholarship-applied', 'waitlist'))
  with check (user_id = (select auth.uid()) and status in ('reserved', 'scholarship-applied', 'waitlist'));

create policy "Admins see all enrollments"
  on public.enrollments for select to authenticated
  using ((select public.is_admin()));

create or replace function public.has_cohort_access(bootcamp text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments e
    left join public.bootcamp_catalog b on b.id = e.bootcamp_id
    where e.user_id = (select auth.uid()) and e.bootcamp_id = bootcamp
      and (e.status in ('paid', 'confirmed', 'completed') or (e.status = 'reserved' and coalesce(b.price_usd, 1) = 0))
  ) or public.is_admin();
$$;
revoke execute on function public.has_cohort_access(text) from public, anon;
grant execute on function public.has_cohort_access(text) to authenticated;

create table if not exists public.cohorts (
  bootcamp_id text primary key check (char_length(bootcamp_id) <= 80),
  meeting_url text not null default '' check (char_length(meeting_url) <= 500),
  schedule_note text not null default '' check (char_length(schedule_note) <= 1000),
  materials_url text not null default '' check (char_length(materials_url) <= 500),
  instructor text not null default '' check (char_length(instructor) <= 200),
  announcement text not null default '' check (char_length(announcement) <= 2000),
  updated_at timestamptz not null default now()
);
alter table public.cohorts enable row level security;
create policy "Enrolled people see their cohort"
  on public.cohorts for select to authenticated
  using (public.has_cohort_access(bootcamp_id));
create policy "Admins create cohorts"
  on public.cohorts for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins edit cohorts"
  on public.cohorts for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bootcamp_id text not null check (char_length(bootcamp_id) <= 80),
  week int not null check (week between 1 and 20),
  url text not null default '' check (char_length(url) <= 500),
  note text not null default '' check (char_length(note) <= 2000),
  feedback text not null default '' check (char_length(feedback) <= 4000),
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, bootcamp_id, week)
);
alter table public.assignment_submissions enable row level security;
create policy "People see their own work, admins see all"
  on public.assignment_submissions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Enrolled people hand in work"
  on public.assignment_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and feedback = '' and status = 'submitted' and public.has_cohort_access(bootcamp_id));
create policy "People edit their own work"
  on public.assignment_submissions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.has_cohort_access(bootcamp_id));
revoke update on public.assignment_submissions from anon, authenticated;
grant update (url, note, updated_at) on public.assignment_submissions to authenticated;

-- Editing work after feedback sends it back to the instructor's queue.
create or replace function public.on_assignment_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.feedback is not distinct from old.feedback
     and (new.url is distinct from old.url or new.note is distinct from old.note) then
    new.status := 'submitted';
  end if;
  return new;
end;
$$;
revoke execute on function public.on_assignment_edit() from public, anon, authenticated;

drop trigger if exists assignment_edit_status on public.assignment_submissions;
create trigger assignment_edit_status
  before update on public.assignment_submissions
  for each row execute function public.on_assignment_edit();

-- ---------------------------------------------------------------------------
-- Organisations: schools, universities and companies that buy seats.
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  kind text not null default 'school' check (kind in ('school', 'university', 'company', 'ngo', 'other')),
  city text not null default '' check (char_length(city) <= 80),
  country text not null default 'Pakistan' check (char_length(country) <= 80),
  seats int not null default 30 check (seats between 1 and 100000),
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create table if not exists public.org_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists org_members_user_idx on public.org_members (user_id);
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;

create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.org_members m where m.org_id = org and m.user_id = (select auth.uid()));
$$;
create or replace function public.is_org_admin(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.org_members m where m.org_id = org and m.user_id = (select auth.uid()) and m.role = 'admin')
    or public.is_admin();
$$;
revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.is_org_admin(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;

-- Coordinators and the Thesia team see the full row (seats, invite code, notes). Members see
-- only the name and type, through my_orgs().
create policy "Coordinators see their organisation"
  on public.organizations for select to authenticated
  using (public.is_org_admin(id));
create policy "Admins create organisations"
  on public.organizations for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins edit organisations"
  on public.organizations for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins delete organisations"
  on public.organizations for delete to authenticated
  using ((select public.is_admin()));

create policy "People see their memberships; org admins see members"
  on public.org_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_org_admin(org_id));
create policy "People leave; org admins remove members"
  on public.org_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_org_admin(org_id));

create or replace function public.my_orgs()
returns table (id uuid, name text, kind text, city text, country text, role text, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.name, o.kind, o.city, o.country, m.role, m.joined_at
  from public.org_members m join public.organizations o on o.id = m.org_id
  where m.user_id = (select auth.uid())
  order by m.joined_at desc;
$$;
revoke execute on function public.my_orgs() from public, anon;
grant execute on function public.my_orgs() to authenticated;

-- Public preview of an invite code, so the join page can show the organisation's name.
create or replace function public.org_by_code(code text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object('id', o.id, 'name', o.name, 'kind', o.kind, 'city', o.city, 'country', o.country)
  from public.organizations o where o.invite_code = upper(trim(code));
$$;
revoke execute on function public.org_by_code(text) from public;
grant execute on function public.org_by_code(text) to anon, authenticated;

create or replace function public.join_org(code text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  o record;
  used int;
begin
  if me is null then raise exception 'not_signed_in'; end if;
  select * into o from public.organizations where invite_code = upper(trim(code)) for update;
  if not found then raise exception 'invalid_code'; end if;
  if not exists (select 1 from public.org_members where org_id = o.id and user_id = me) then
    select count(*) into used from public.org_members where org_id = o.id and role = 'member';
    if used >= o.seats then raise exception 'org_full' using hint = 'Every seat is taken. Ask your coordinator to add seats.'; end if;
    insert into public.org_members (org_id, user_id, role) values (o.id, me, 'member');
  end if;
  return json_build_object('id', o.id, 'name', o.name);
end;
$$;
revoke execute on function public.join_org(text) from public, anon;
grant execute on function public.join_org(text) to authenticated;

-- Org admins (teachers, ORIC staff) see each member's progress. Members are told this when they join.
create or replace function public.org_report(org uuid)
returns table (
  user_id uuid,
  name text,
  handle text,
  level text,
  role text,
  joined_at timestamptz,
  lessons_completed int,
  tracks_completed int,
  applications int,
  accepted int,
  bootcamps text[],
  certificates int,
  last_active timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_org_admin(org) then raise exception 'not_org_admin'; end if;
  return query
  select m.user_id, p.name, p.handle, p.level, m.role, m.joined_at,
    (select count(*)::int from public.lesson_progress lp where lp.user_id = m.user_id),
    coalesce(cardinality(p.badges), 0),
    (select count(*)::int from public.applications a where a.user_id = m.user_id),
    (select count(*)::int from public.applications a where a.user_id = m.user_id and a.status = 'accepted'),
    coalesce((select array_agg(e.bootcamp_id || ':' || e.status) from public.enrollments e where e.user_id = m.user_id), '{}'),
    (select count(*)::int from public.certificates c where c.user_id = m.user_id and not c.revoked),
    greatest(
      (select max(lp.completed_at) from public.lesson_progress lp where lp.user_id = m.user_id),
      (select max(a.created_at) from public.applications a where a.user_id = m.user_id),
      m.joined_at
    )
  from public.org_members m
  join public.profiles p on p.id = m.user_id
  where m.org_id = org
  order by m.role, p.name;
end;
$$;
revoke execute on function public.org_report(uuid) from public, anon;
grant execute on function public.org_report(uuid) to authenticated;

-- Thesia admins make someone an org admin by email (they must have an account).
create or replace function public.add_org_admin(org uuid, member_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  select id into target from auth.users where lower(email) = lower(trim(member_email));
  if target is null then raise exception 'no_account' using hint = 'Ask them to create a Thesia account first.'; end if;
  insert into public.org_members (org_id, user_id, role) values (org, target, 'admin')
  on conflict (org_id, user_id) do update set role = 'admin';
  perform public.notify(target, 'org', 'You are now a coordinator', 'Open your organisation dashboard to invite students.', '/org/' || org);
end;
$$;
revoke execute on function public.add_org_admin(uuid, text) from public, anon;
grant execute on function public.add_org_admin(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Submissions: an admin inbox with status, and new kinds.
-- ---------------------------------------------------------------------------
alter table public.submissions drop constraint if exists submissions_kind_check;
alter table public.submissions add constraint submissions_kind_check
  check (kind in ('conference', 'lab', 'institution', 'teach', 'ambassador', 'country-waitlist', 'feedback', 'scholarship', 'challenge', 'challenge-interest'));
alter table public.submissions add column if not exists status text not null default 'new'
  check (status in ('new', 'in-progress', 'done', 'archived'));
alter table public.submissions add column if not exists admin_note text not null default '' check (char_length(admin_note) <= 2000);

drop policy if exists "Anyone can submit" on public.submissions;
create policy "Anyone can submit"
  on public.submissions for insert to anon, authenticated
  with check (status = 'new' and admin_note = '' and (user_id is null or user_id = (select auth.uid())));
create policy "Admins read submissions"
  on public.submissions for select to authenticated
  using ((select public.is_admin()));
create policy "Admins triage submissions"
  on public.submissions for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
revoke update on public.submissions from anon, authenticated;
grant update (status, admin_note) on public.submissions to authenticated;

-- ---------------------------------------------------------------------------
-- Admin functions.
-- ---------------------------------------------------------------------------
create or replace function public.admin_overview()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result json;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  select json_build_object(
    'users', (select count(*) from public.profiles),
    'onboarded', (select count(*) from public.profiles where onboarded),
    'signups_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'signups_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
    'signups_by_week', coalesce((
      select json_agg(json_build_object('week', w, 'n', n) order by w)
      from (select date_trunc('week', created_at)::date as w, count(*) as n from public.profiles
            where created_at > now() - interval '12 weeks' group by 1) t), '[]'::json),
    'projects', (select count(*) from public.projects where not is_sample),
    'open_projects', (select count(*) from public.projects where not is_sample and status = 'open'),
    'applications', (select count(*) from public.applications),
    'accepted', (select count(*) from public.applications where status = 'accepted'),
    'lessons_completed', (select count(*) from public.lesson_progress),
    'certificates', (select count(*) from public.certificates where not revoked),
    'contributions', (select count(*) from public.contributions),
    'enrollments', coalesce((select json_object_agg(status, n) from (select status, count(*) as n from public.enrollments group by 1) t), '{}'::json),
    'revenue_usd', (select coalesce(sum(price_usd), 0) from public.enrollments where status in ('paid', 'completed') and payment_ref is not null),
    'pro_users', (select count(*) from public.profiles where plan = 'pro'),
    'new_submissions', coalesce((select json_object_agg(kind, n) from (select kind, count(*) as n from public.submissions where status = 'new' group by 1) t), '{}'::json),
    'organizations', (select count(*) from public.organizations),
    'org_members', (select count(*) from public.org_members),
    'countries', (select count(distinct country) from public.profiles where country <> ''),
    'top_countries', coalesce((select json_agg(json_build_object('name', country, 'n', n)) from (
      select country, count(*) as n from public.profiles where country <> '' group by 1 order by 2 desc limit 8) t), '[]'::json),
    'top_affiliations', coalesce((select json_agg(json_build_object('name', affiliation, 'n', n)) from (
      select affiliation, count(*) as n from public.profiles where affiliation <> '' group by 1 order by 2 desc limit 10) t), '[]'::json),
    'top_referrers', coalesce((select json_agg(json_build_object('name', referred_by, 'n', n)) from (
      select referred_by, count(*) as n from public.profiles where referred_by is not null group by 1 order by 2 desc limit 10) t), '[]'::json)
  ) into result;
  return result;
end;
$$;
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

create or replace function public.admin_people(search text default '')
returns table (
  id uuid, email text, name text, handle text, affiliation text, country text, level text,
  onboarded boolean, verified boolean, plan text, referred_by text, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
  select p.id, u.email::text, p.name, p.handle, p.affiliation, p.country, p.level, p.onboarded, p.verified, p.plan, p.referred_by, p.created_at
  from public.profiles p join auth.users u on u.id = p.id
  where coalesce(search, '') = ''
     or p.name ilike '%' || search || '%' or u.email ilike '%' || search || '%'
     or p.handle ilike '%' || search || '%' or p.affiliation ilike '%' || search || '%'
  order by p.created_at desc
  limit 200;
end;
$$;
revoke execute on function public.admin_people(text) from public, anon;
grant execute on function public.admin_people(text) to authenticated;

create or replace function public.admin_set_verified(person uuid, value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  update public.profiles set verified = value where id = person;
  if value then
    perform public.notify(person, 'verified', 'Your passport is verified', 'A verified mark now shows on your research passport.', '/dashboard');
  end if;
end;
$$;
revoke execute on function public.admin_set_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;

create or replace function public.admin_enrollments()
returns table (
  id uuid, bootcamp_id text, user_id uuid, email text, name text, status text,
  price_usd numeric, payment_ref text, created_at timestamptz, certificate_id text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
  select e.id, e.bootcamp_id, e.user_id, u.email::text, p.name, e.status, e.price_usd, e.payment_ref, e.created_at,
    (select c.id from public.certificates c where c.user_id = e.user_id and c.kind = 'bootcamp' and c.ref_id = e.bootcamp_id)
  from public.enrollments e
  join auth.users u on u.id = e.user_id
  left join public.profiles p on p.id = e.user_id
  order by e.created_at desc
  limit 1000;
end;
$$;
revoke execute on function public.admin_enrollments() from public, anon;
grant execute on function public.admin_enrollments() to authenticated;

-- Confirm a seat (e.g. an approved scholarship or a school-funded seat), or mark the
-- bootcamp completed, which issues the certificate.
create or replace function public.admin_set_enrollment(enrollment uuid, new_status text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  e record;
  b record;
  who text;
  cert_id text;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if new_status not in ('reserved', 'paid', 'scholarship-applied', 'waitlist', 'confirmed', 'completed') then
    raise exception 'invalid_status';
  end if;
  update public.enrollments set status = new_status where id = enrollment returning * into e;
  if not found then raise exception 'not_found'; end if;
  select * into b from public.bootcamp_catalog where id = e.bootcamp_id;

  if new_status = 'confirmed' then
    perform public.notify(e.user_id, 'enrollment', 'Your seat is confirmed: ' || coalesce(b.title, e.bootcamp_id),
      'Joining details are in your cohort space.', '/bootcamps/' || e.bootcamp_id || '/cohort');
  elsif new_status = 'completed' then
    select coalesce(nullif(name, ''), 'Thesia learner') into who from public.profiles where id = e.user_id;
    insert into public.certificates (user_id, kind, ref_id, title, recipient_name, detail)
    values (e.user_id, 'bootcamp', e.bootcamp_id, coalesce(b.title, e.bootcamp_id), who,
      coalesce(b.weeks, 1) || '-week live cohort, Thesia Bootcamps')
    on conflict (user_id, kind, ref_id) do update set revoked = false;
    select id into cert_id from public.certificates where user_id = e.user_id and kind = 'bootcamp' and ref_id = e.bootcamp_id;
  end if;
  return cert_id;
end;
$$;
revoke execute on function public.admin_set_enrollment(uuid, text) from public, anon;
grant execute on function public.admin_set_enrollment(uuid, text) to authenticated;

create or replace function public.admin_assignments(bootcamp text)
returns table (
  id uuid, user_id uuid, name text, email text, week int, url text, note text, feedback text, status text, updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
  select s.id, s.user_id, p.name, u.email::text, s.week, s.url, s.note, s.feedback, s.status, s.updated_at
  from public.assignment_submissions s
  join auth.users u on u.id = s.user_id
  left join public.profiles p on p.id = s.user_id
  where s.bootcamp_id = bootcamp
  order by s.week, s.updated_at desc;
end;
$$;
revoke execute on function public.admin_assignments(text) from public, anon;
grant execute on function public.admin_assignments(text) to authenticated;

create or replace function public.admin_feedback(submission uuid, feedback_text text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  update public.assignment_submissions set feedback = left(feedback_text, 4000), status = 'reviewed', updated_at = now()
  where id = submission returning * into s;
  if not found then raise exception 'not_found'; end if;
  perform public.notify(s.user_id, 'feedback', 'Feedback on your week ' || s.week || ' work',
    left(feedback_text, 140), '/bootcamps/' || s.bootcamp_id || '/cohort');
end;
$$;
revoke execute on function public.admin_feedback(uuid, text) from public, anon;
grant execute on function public.admin_feedback(uuid, text) to authenticated;

-- Public counts now include certificates.
create or replace function public.platform_stats()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'researchers', (select count(*) from public.profiles where onboarded),
    'projects', (select count(*) from public.projects where not is_sample),
    'applications', (select count(*) from public.applications),
    'lessons_completed', (select count(*) from public.lesson_progress),
    'certificates', (select count(*) from public.certificates where not revoked),
    'countries', (select count(distinct country) from public.profiles where onboarded and country <> '')
  );
$$;
grant execute on function public.platform_stats() to anon, authenticated;

-- Trigger functions from 0001 never need to be called directly.
revoke execute on function public.enforce_application_limit() from public, anon, authenticated;

-- ============================================================================
-- seed.sql
-- ============================================================================
-- Sample projects for the beta (is_sample = true). Generated by scripts/gen-seed.mjs.
insert into public.projects (id, title, summary, description, fields, tags, levels, city, country, mode, hours_per_week, duration_weeks, compensation, stipend, roles, lead, ethics, credit, apply_by, start_date, status, is_sample, created_at)
values
('smog-asthma-lahore', 'Winter smog and asthma visits in Lahore', 'Link daily PM2.5 readings to hospital outpatient asthma visits across three winters.', 'Every winter Lahore''s air quality drops to hazardous levels, but we have little local evidence on how much each smog day adds to hospital load. This project builds a daily time series of PM2.5 (from public monitors) and outpatient asthma visits (from two partner hospitals, de-identified) for November to February, 2023–2026.

**What we will do**
- Clean and merge monitor data with weather controls.
- Estimate the lagged effect of PM2.5 on visits with a distributed-lag model.
- Write a short policy brief alongside the paper.

**What you will learn:** time-series data cleaning, distributed-lag models in R, and how hospital data is handled ethically.', array['public-health','environment']::text[], array['air pollution','PM2.5','asthma','time series','R','Lahore','smog']::text[], array['undergrad','masters']::text[], 'Lahore', 'Pakistan', 'hybrid', 6, 12, 'unpaid', null, '[{"id":"r1","credit":"data-curation","title":"Air-quality data curator","description":"Pull and clean monitor data, document every decision in a log.","spots":2,"skills":["Excel","R or Python","Attention to detail"]},{"id":"r2","credit":"formal-analysis","title":"Analysis assistant","description":"Run distributed-lag models with the lead and check robustness.","spots":1,"skills":["R","Regression","Statistics"]},{"id":"r3","credit":"writing-draft","title":"Policy brief writer","description":"Turn findings into a two-page brief for city officials.","spots":1,"skills":["Writing","Public health"]}]'::jsonb, '{"name":"Ayesha Rehman","handle":"ayesha-r","affiliation":"PhD candidate, environmental health"}'::jsonb, 'approved', 'Authorship follows contribution: contributors who meet journal criteria are co-authors; everyone is listed with their CRediT role.', '2026-10-31', '2026-11-10', 'open', true, '2026-09-28'),
('saraiki-asr', 'Speech recognition for Saraiki and Punjabi dialects', 'Build an open dataset and fine-tune a speech model for under-served Pakistani languages.', 'Most speech recognition tools work poorly for Saraiki and regional Punjabi. We are recording consented speech from volunteers across South Punjab, transcribing it, and fine-tuning an open-source speech model. The dataset will be released openly for other researchers.

**What we will do**
- Collect 40 hours of consented, transcribed speech.
- Fine-tune and evaluate an open speech model (word error rate by dialect).
- Publish the dataset with a datasheet describing who is represented.

**What you will learn:** dataset design, consent for speech data, model fine-tuning and evaluation.', array['cs-ai','humanities']::text[], array['NLP','speech recognition','Saraiki','Punjabi','low-resource languages','Python','dataset']::text[], array['undergrad','masters']::text[], 'Multan', 'Pakistan', 'remote', 5, 16, 'stipend', 'PKR 15,000 per month for transcribers', '[{"id":"r1","credit":"data-curation","title":"Transcriber (Saraiki speaker)","description":"Transcribe recordings using our guidelines; flag unclear audio.","spots":6,"skills":["Saraiki","Urdu script","Typing"]},{"id":"r2","credit":"software","title":"ML research assistant","description":"Fine-tune and evaluate models; keep experiments reproducible.","spots":2,"skills":["Python","PyTorch","Git"]},{"id":"r3","credit":"investigation","title":"Field recording coordinator","description":"Organise consented recording sessions in your town.","spots":2,"skills":["Organising","Saraiki or Punjabi"]}]'::jsonb, '{"name":"Hamza Khalid","handle":"hamza-k","affiliation":"Lecturer, Computer Science"}'::jsonb, 'approved', 'Dataset contributors are named in the dataset release; research assistants who meet authorship criteria co-author the paper.', '2026-11-15', '2026-12-01', 'open', true, '2026-10-02'),
('glof-gilgit', 'Mapping glacial lakes in Gilgit-Baltistan from satellite imagery', 'Track how fast glacial lakes are growing and which villages sit downstream.', 'Glacial lake outburst floods (GLOFs) threaten communities across Gilgit-Baltistan and Chitral. Using free Sentinel-2 imagery, we map lake area every year since 2017 and overlay settlements and roads downstream.

**What we will do**
- Delineate lakes with NDWI and manual checks.
- Build a growth-rate table and flag fast-growing lakes.
- Share a public map with local disaster-management offices.

**What you will learn:** remote sensing with Google Earth Engine, GIS, and communicating risk responsibly.', array['environment','engineering']::text[], array['GLOF','glaciers','remote sensing','GIS','climate','Earth Engine','Gilgit-Baltistan']::text[], array['undergrad','masters']::text[], 'Islamabad', 'Pakistan', 'remote', 6, 14, 'unpaid', null, '[{"id":"r1","credit":"investigation","title":"Lake mapper","description":"Delineate lakes year by year and record uncertainty.","spots":3,"skills":["GIS","QGIS or Earth Engine"]},{"id":"r2","credit":"visualization","title":"Map and figure designer","description":"Make the public map and paper figures.","spots":1,"skills":["Cartography","Design"]},{"id":"r3","credit":"validation","title":"Accuracy checker","description":"Cross-check a sample of lakes against high-resolution imagery.","spots":1,"skills":["Remote sensing","Patience"]}]'::jsonb, '{"name":"Dr. Sana Mirza","handle":"sana-m","affiliation":"Assistant professor, remote sensing"}'::jsonb, 'not-required', 'Co-authorship for substantial contributors; all contributors credited on the public map.', '2026-11-05', '2026-11-20', 'open', true, '2026-09-30'),
('microfinance-women-south-punjab', 'Microfinance and women-led home businesses in South Punjab', 'Interviews and repayment records to understand what helps women’s home businesses grow.', 'Microfinance loans to women in South Punjab are often used for household needs rather than the business. We combine anonymised repayment records from a partner lender with 40 in-depth interviews to understand what helps loans turn into growing businesses.

**What we will do**
- Conduct and transcribe interviews in Urdu and Saraiki.
- Code interviews thematically with a shared codebook.
- Link themes to repayment patterns.

**What you will learn:** qualitative interviewing, thematic analysis, mixed-methods design and research ethics with vulnerable groups.', array['economics','social']::text[], array['microfinance','women','qualitative','interviews','thematic analysis','mixed methods','South Punjab']::text[], array['undergrad','masters']::text[], 'Bahawalpur', 'Pakistan', 'hybrid', 8, 10, 'paid', 'PKR 2,500 per completed interview', '[{"id":"r1","credit":"investigation","title":"Field interviewer","description":"Conduct consented interviews with women entrepreneurs.","spots":4,"skills":["Urdu","Saraiki","Interviewing","Empathy"]},{"id":"r2","credit":"formal-analysis","title":"Qualitative coder","description":"Code transcripts with the team codebook in NVivo or Taguette.","spots":2,"skills":["Thematic analysis","Careful reading"]}]'::jsonb, '{"name":"Usman Tariq","handle":"usman-t","affiliation":"Research associate, development economics"}'::jsonb, 'approved', 'Interviewers and coders are acknowledged by name and CRediT role; authorship by contribution.', '2026-10-25', '2026-11-03', 'open', true, '2026-09-22'),
('heat-riders-karachi', 'Heat stress among Karachi’s delivery riders', 'A student-led study measuring heat exposure and symptoms in motorbike delivery workers.', 'Delivery riders spend long hours on the road during Karachi’s heatwaves. This student-led study surveys riders about symptoms, hydration and breaks, and logs on-road temperature with low-cost sensors for a subgroup.

**What we will do**
- Survey 300 riders with a validated heat-symptom questionnaire.
- Log temperature for 30 riders over two weeks.
- Share practical recommendations with delivery companies.

**What you will learn:** occupational health survey design, sensor data, and turning research into workplace change.', array['public-health']::text[], array['heat','occupational health','gig workers','survey','sensors','Karachi','climate']::text[], array['undergrad']::text[], 'Karachi', 'Pakistan', 'onsite', 6, 10, 'unpaid', null, '[{"id":"r1","credit":"investigation","title":"Survey enumerator","description":"Interview riders at hubs; follow the consent script.","spots":6,"skills":["Urdu","Confidence","Mobile survey apps"]},{"id":"r2","credit":"data-curation","title":"Sensor data lead","description":"Set up loggers and clean temperature data.","spots":1,"skills":["Excel","Python","Hardware basics"]}]'::jsonb, '{"name":"Omar Farooq","handle":"omar-f","affiliation":"MBBS final year (student lead)"}'::jsonb, 'in-review', 'Student team co-authors the paper; faculty supervisor listed for supervision.', '2026-11-01', '2026-11-15', 'open', true, '2026-10-04'),
('amr-poultry-faisalabad', 'Antibiotic resistance in poultry farms near Faisalabad', 'Sample poultry farms and test E. coli isolates for resistance to common antibiotics.', 'Antibiotics are widely used in Pakistani poultry, often without veterinary supervision. We collect samples from 30 farms, isolate E. coli, and test resistance patterns, alongside a short farmer questionnaire on antibiotic use.

**What we will do**
- Collect and process samples with biosafety procedures.
- Run disk diffusion tests and record results.
- Link resistance to reported antibiotic use.

**What you will learn:** microbiology lab techniques, biosafety, and One Health research.', array['biology','agriculture','public-health']::text[], array['AMR','antibiotic resistance','microbiology','poultry','One Health','lab work','Faisalabad']::text[], array['undergrad','masters']::text[], 'Faisalabad', 'Pakistan', 'onsite', 10, 12, 'course-credit', null, '[{"id":"r1","credit":"investigation","title":"Lab assistant","description":"Process samples and run susceptibility tests under supervision.","spots":3,"skills":["Microbiology lab","Biosafety"]},{"id":"r2","credit":"data-curation","title":"Data manager","description":"Maintain the sample register and results database.","spots":1,"skills":["Excel","Record keeping"]}]'::jsonb, '{"name":"Zainab Hussain","handle":"zainab-h","affiliation":"MPhil Microbiology"}'::jsonb, 'approved', 'Contributors listed by CRediT role; authorship by contribution.', '2026-11-10', '2026-11-24', 'open', true, '2026-09-26'),
('textbook-gender', 'How gender appears in Punjab school textbooks', 'A content analysis of Grade 1–8 textbooks: who is shown, doing what, and how often.', 'Textbooks shape what children think is normal. We code every image and named character in Grade 1–8 English, Urdu and General Knowledge textbooks for gender, role and setting, and compare editions over time.

**What we will do**
- Build and test a coding scheme with inter-rater reliability checks.
- Code all textbooks in pairs.
- Publish the coded dataset openly.

**What you will learn:** content analysis, reliability statistics (Cohen’s kappa), and education policy. Good first project: no prior experience needed.', array['education','social']::text[], array['gender','textbooks','content analysis','education policy','beginner friendly','Punjab']::text[], array['high-school','undergrad']::text[], 'Remote', 'Pakistan', 'remote', 3, 8, 'unpaid', null, '[{"id":"r1","credit":"investigation","title":"Textbook coder","description":"Code images and characters using the scheme, in pairs.","spots":10,"skills":["Careful reading","Urdu","English"]},{"id":"r2","credit":"validation","title":"Reliability checker","description":"Calculate agreement between coders and resolve disagreements.","spots":1,"skills":["Excel","Basic statistics"]}]'::jsonb, '{"name":"Saima Akhtar","affiliation":"Schoolteacher and M.Ed researcher"}'::jsonb, 'not-required', 'All coders named in the dataset; substantial contributors co-author.', '2026-11-20', '2026-12-01', 'open', true, '2026-10-05'),
('rawal-water', 'Citizen science water-quality map of the Rawal Lake catchment', 'Test stream water monthly with simple kits and build an open map of pollution hotspots.', 'Rawal Lake supplies drinking water to Rawalpindi, but the streams feeding it pass through growing settlements. School and university volunteers test water monthly (pH, turbidity, nitrates, E. coli presence) at fixed points and upload results to an open map.

**What we will do**
- Train volunteers to sample safely and consistently.
- Test 20 sites monthly for six months.
- Publish an open dataset and a public map.

**What you will learn:** field sampling, quality control in citizen science, and data mapping. Open to high-school students with a guardian’s consent.', array['environment','chemistry']::text[], array['water quality','citizen science','Rawal Lake','field sampling','high school','mapping']::text[], array['high-school','undergrad']::text[], 'Islamabad', 'Pakistan', 'onsite', 3, 24, 'unpaid', null, '[{"id":"r1","credit":"investigation","title":"Field sampler","description":"Collect and test samples at assigned sites each month.","spots":12,"skills":["Reliability","Outdoor fieldwork"]},{"id":"r2","credit":"visualization","title":"Map maintainer","description":"Update the open map after each sampling round.","spots":1,"skills":["Google Sheets","Basic GIS"]}]'::jsonb, '{"name":"Twin Cities Water Watch","affiliation":"Volunteer science club"}'::jsonb, 'not-required', 'Every volunteer credited on the dataset and map.', '2026-12-15', '2027-01-05', 'open', true, '2026-10-06'),
('mobile-money-peshawar', 'Why small shopkeepers in Peshawar do or don’t use mobile money', 'Survey 250 kiryana stores on digital payment adoption, trust and costs.', 'Digital payments are growing fast in Pakistan, but many small shops still prefer cash. We survey 250 shopkeepers across Peshawar on adoption, fees, trust and customer demand, and test which factors predict adoption.

**What we will do**
- Pilot and run a structured survey.
- Analyse adoption with logistic regression.
- Share findings with fintech and policy audiences.

**What you will learn:** sampling small businesses, survey fieldwork and logistic regression.', array['business','economics']::text[], array['fintech','mobile money','digital payments','small business','survey','Peshawar']::text[], array['undergrad']::text[], 'Peshawar', 'Pakistan', 'onsite', 5, 8, 'paid', 'PKR 300 per completed survey', '[{"id":"r1","credit":"investigation","title":"Survey enumerator","description":"Interview shopkeepers in assigned markets.","spots":5,"skills":["Pashto","Urdu","Survey apps"]},{"id":"r2","credit":"formal-analysis","title":"Analysis assistant","description":"Clean data and run the regression models.","spots":1,"skills":["Stata or R","Regression"]}]'::jsonb, '{"name":"Imran Shah","affiliation":"Lecturer, business studies"}'::jsonb, 'approved', 'Authorship by contribution; enumerators acknowledged by name.', '2026-10-28', '2026-11-05', 'open', true, '2026-09-20'),
('xai-retinopathy', 'Explainable AI for diabetic retinopathy screening on local images', 'Test whether public retinopathy models work on images from Pakistani clinics, and explain their errors.', 'Models trained on Western datasets may fail on images from local cameras and patients. With an eye hospital partner, we evaluate open models on de-identified local images and use saliency methods to understand failure cases.

**What we will do**
- Evaluate three open models against ophthalmologist labels.
- Analyse failures with Grad-CAM and error categories.
- Fine-tune on a local subset and re-evaluate.

**What you will learn:** medical imaging evaluation, explainability methods and dataset shift.', array['cs-ai','public-health']::text[], array['medical imaging','explainable AI','diabetic retinopathy','deep learning','dataset shift','Python']::text[], array['undergrad','masters']::text[], 'Islamabad', 'Pakistan', 'remote', 8, 16, 'unpaid', null, '[{"id":"r1","credit":"software","title":"Deep learning assistant","description":"Run evaluations and fine-tuning experiments.","spots":2,"skills":["Python","PyTorch","Computer vision"]},{"id":"r2","credit":"validation","title":"Reproducibility checker","description":"Re-run experiments from the logs and confirm results.","spots":1,"skills":["Git","Python"]}]'::jsonb, '{"name":"Faisal Nawaz","handle":"faisal-n","affiliation":"MS Data Science"}'::jsonb, 'approved', 'Authorship by contribution; code contributors listed in the repository.', '2026-11-12', '2026-11-25', 'open', true, '2026-10-01'),
('student-help-seeking', 'Mental health help-seeking among university students in Islamabad', 'A survey and focus groups on why students do or don’t use campus counselling.', 'Many universities now have counsellors, but few students use them. We survey students at four universities on stigma, awareness and barriers, then run focus groups to understand the results.

**What we will do**
- Run a validated help-seeking attitudes survey.
- Hold six focus groups with trained facilitators.
- Recommend changes to counselling services.

**What you will learn:** psychology research ethics, validated scales, focus-group facilitation and mixed methods. All team members complete safeguarding training before fieldwork.', array['psychology','public-health','education']::text[], array['mental health','students','help-seeking','survey','focus groups','Islamabad']::text[], array['undergrad','masters']::text[], 'Islamabad', 'Pakistan', 'hybrid', 5, 12, 'unpaid', null, '[{"id":"r1","credit":"investigation","title":"Survey coordinator","description":"Distribute the survey at your campus and track responses.","spots":4,"skills":["Organising","Communication"]},{"id":"r2","credit":"formal-analysis","title":"Focus-group analyst","description":"Transcribe and code focus groups.","spots":2,"skills":["Qualitative analysis","Urdu","English"]}]'::jsonb, '{"name":"Dr. Hira Qureshi","handle":"hira-q","affiliation":"Clinical psychologist and lecturer"}'::jsonb, 'approved', 'Authorship by contribution; all contributors listed with CRediT roles.', '2026-11-08', '2026-11-18', 'open', true, '2026-09-29'),
('solar-net-metering', 'Does rooftop solar still pay off after net-metering changes?', 'Model household payback periods for rooftop solar under old and new tariff rules.', 'Rooftop solar has boomed in Pakistan, and net-metering rules have been changing. We collect real bills and system quotes from 120 households and model payback periods under different tariff scenarios.

**What we will do**
- Collect bills and installation quotes with consent.
- Build a transparent payback model in a spreadsheet and Python.
- Publish a calculator households can use.

**What you will learn:** energy economics, financial modelling and communicating uncertainty.', array['engineering','economics','environment']::text[], array['solar','net metering','energy policy','financial modelling','households','Python','Excel']::text[], array['undergrad','masters']::text[], 'Lahore', 'Pakistan', 'remote', 5, 10, 'unpaid', null, '[{"id":"r1","credit":"data-curation","title":"Household data collector","description":"Collect bills and quotes from households in your city.","spots":6,"skills":["Communication","Spreadsheets"]},{"id":"r2","credit":"methodology","title":"Model builder","description":"Build and document the payback model.","spots":1,"skills":["Excel","Python","Finance basics"]}]'::jsonb, '{"name":"Dr. Kamran Yousaf","affiliation":"Energy policy researcher"}'::jsonb, 'not-required', 'Authorship by contribution; data collectors acknowledged by name.', '2026-11-18', '2026-12-01', 'open', true, '2026-10-03'),
('psl-toss', 'Does winning the toss matter in the PSL?', 'A beginner-friendly sports statistics project using every Pakistan Super League match.', 'Commentators say the toss decides matches at some grounds. We collect ball-by-ball data for every PSL match and test whether toss winners win more often, and whether it depends on the ground, dew, or batting first.

**What we will do**
- Build a clean match dataset from public scorecards.
- Test the toss effect with simple statistics, then logistic regression.
- Write a short paper and a public explainer.

**What you will learn:** data collection, hypothesis testing and logistic regression, on a topic you already care about.', array['physics-math']::text[], array['statistics','cricket','sports analytics','beginner friendly','hypothesis testing','R','Python']::text[], array['high-school','undergrad']::text[], 'Remote', 'Pakistan', 'remote', 3, 8, 'unpaid', null, '[{"id":"r1","credit":"data-curation","title":"Scorecard data collector","description":"Enter and check match data from public scorecards.","spots":4,"skills":["Spreadsheets","Cricket knowledge"]},{"id":"r2","credit":"formal-analysis","title":"Stats analyst","description":"Run tests and models with the lead.","spots":2,"skills":["Statistics","R or Python"]}]'::jsonb, '{"name":"Fatima Zahra","handle":"fatima-z","affiliation":"BS Statistics (student lead)"}'::jsonb, 'not-required', 'Student team co-authors; all contributors credited.', '2026-11-25', '2026-12-05', 'open', true, '2026-10-07'),
('predatory-awareness', 'How well do early-career researchers in Pakistan spot predatory journals?', 'A national survey testing whether researchers can tell predatory outlets from legitimate ones.', 'Predatory journals and conferences charge fees without real peer review, and they target early-career researchers. We show participants real journal and conference invitations and ask them to judge which are legitimate, then test whether training changes their answers.

**What we will do**
- Build a set of real, anonymised invitations with known status.
- Survey 500 researchers across universities.
- Test a short training module in a randomised design.

**What you will learn:** survey experiments, randomisation, and meta-research.', array['education','social']::text[], array['predatory journals','meta-research','research integrity','survey experiment','randomised']::text[], array['undergrad','masters','phd']::text[], 'Remote', 'Pakistan', 'remote', 4, 12, 'unpaid', null, '[{"id":"r1","credit":"methodology","title":"Instrument designer","description":"Help build and test the invitation set and questionnaire.","spots":2,"skills":["Survey design","Research integrity"]},{"id":"r2","credit":"project-admin","title":"University outreach lead","description":"Recruit participants at your university.","spots":6,"skills":["Communication","Networking"]}]'::jsonb, '{"name":"Thesia Research Desk","affiliation":"Thesia"}'::jsonb, 'in-review', 'Authorship by contribution; outreach leads acknowledged.', '2026-11-30', '2026-12-10', 'open', true, '2026-10-08'),
('sylhet-floods-schooling', 'Flood displacement and children’s schooling in Sylhet', 'Track how repeated floods affect school attendance and dropout in north-east Bangladesh.', 'Sylhet division has faced severe floods in recent years. We combine school attendance records with household interviews to measure how displacement affects learning, and which supports help children return.

**What we will do**
- Collect attendance records from partner schools.
- Interview 120 households in Bangla and Sylheti.
- Analyse attendance before and after flood events.

**What you will learn:** education research in emergencies, panel data and fieldwork ethics.', array['education','environment','social']::text[], array['floods','climate','education','displacement','Bangladesh','panel data']::text[], array['undergrad','masters']::text[], 'Sylhet', 'Bangladesh', 'hybrid', 6, 12, 'stipend', 'BDT 6,000 per month for field roles', '[{"id":"r1","credit":"investigation","title":"Household interviewer","description":"Interview families in Bangla or Sylheti.","spots":4,"skills":["Bangla","Sylheti","Interviewing"]},{"id":"r2","credit":"formal-analysis","title":"Panel data analyst (remote)","description":"Analyse attendance data; open to students anywhere.","spots":1,"skills":["Stata or R","Panel data"]}]'::jsonb, '{"name":"Nusrat Jahan","handle":"nusrat-j","affiliation":"Research officer, education"}'::jsonb, 'approved', 'Authorship by contribution; field team acknowledged.', '2026-11-14', '2026-12-01', 'open', true, '2026-10-02'),
('naija-pidgin-corpus', 'A sentiment corpus for Nigerian Pidgin', 'Build an open, annotated dataset of Nigerian Pidgin text for sentiment analysis.', 'Nigerian Pidgin is spoken by tens of millions of people but has few NLP resources. We collect public text, annotate sentiment with native speakers, and release the corpus with baseline models.

**What we will do**
- Write annotation guidelines and train annotators.
- Annotate 20,000 sentences with agreement checks.
- Train and publish baseline models.

**What you will learn:** annotation project design, agreement metrics and NLP baselines. Remote, open to students worldwide.', array['cs-ai','humanities']::text[], array['NLP','Nigerian Pidgin','sentiment analysis','annotation','low-resource languages','dataset']::text[], array['undergrad','masters']::text[], 'Lagos', 'Nigeria', 'remote', 4, 12, 'unpaid', null, '[{"id":"r1","credit":"data-curation","title":"Annotator (Pidgin speaker)","description":"Label sentences following the guidelines.","spots":8,"skills":["Nigerian Pidgin","Careful reading"]},{"id":"r2","credit":"software","title":"Baseline model builder","description":"Train and evaluate baseline classifiers; open to non-speakers.","spots":2,"skills":["Python","NLP","Transformers"]}]'::jsonb, '{"name":"Chiamaka Okafor","handle":"chiamaka-o","affiliation":"MSc Linguistics"}'::jsonb, 'not-required', 'Annotators named in the dataset; authorship by contribution.', '2026-11-22', '2026-12-01', 'open', true, '2026-10-05')
on conflict (id) do nothing;

-- Academy tracks and bootcamps, used for certificates and free-cohort access.
insert into public.track_catalog (id, title, lesson_ids)
values
('foundations', 'Research foundations', array['what-is-research','research-question','finding-papers','reading-papers','literature-review','ethics-basics']::text[]),
('getting-in', 'Getting into research', array['emailing-researchers','research-passport','ra-and-summer','graduate-study']::text[]),
('methods', 'Methods and analysis', array['choosing-a-method','sampling','survey-design','interviews-thematic','statistics-essentials','reproducible-workflow']::text[]),
('publishing', 'Publishing and presenting', array['imrad','choosing-a-venue','peer-review','posters-and-talks','authorship']::text[]),
('ai', 'AI in research, responsibly', array['ai-without-fooling-yourself','ai-literature-search']::text[])
on conflict (id) do update set title = excluded.title, lesson_ids = excluded.lesson_ids;

insert into public.bootcamp_catalog (id, title, price_usd, weeks, start_date)
values
('research-launchpad', 'Research Launchpad', 0, 3, '2026-11-07'),
('survey-sprint', 'Survey Research Sprint', 79, 4, '2026-11-21'),
('data-analysis', 'Data Analysis for Researchers', 129, 6, '2026-12-05'),
('project-to-paper', 'From Project to Paper', 199, 8, '2027-01-09'),
('systematic-review', 'Systematic Reviews and Meta-analysis', 249, 6, '2027-01-16'),
('young-researchers', 'Young Researchers Programme', 149, 8, '2027-02-06'),
('grant-writing', 'Fellowship and Grant Writing Clinic', 99, 4, '2027-02-13')
on conflict (id) do update set title = excluded.title, price_usd = excluded.price_usd, weeks = excluded.weeks, start_date = excluded.start_date;
