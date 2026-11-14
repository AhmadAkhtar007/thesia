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

insert into public.admins (email) values ('zafarmaarij@gmail.com') on conflict do nothing;

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
