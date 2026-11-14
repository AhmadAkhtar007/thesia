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
