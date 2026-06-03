create table if not exists public.rsvp_submissions (
  id uuid primary key,
  submitted_at timestamptz not null default now(),
  name text not null,
  attending text not null,
  meal text,
  dietary text,
  contact text not null,
  message text,
  user_agent text
);

alter table public.rsvp_submissions enable row level security;

drop policy if exists "Block public reads" on public.rsvp_submissions;
drop policy if exists "Block public inserts" on public.rsvp_submissions;

create policy "Block public reads"
  on public.rsvp_submissions
  for select
  to anon, authenticated
  using (false);

create policy "Block public inserts"
  on public.rsvp_submissions
  for insert
  to anon, authenticated
  with check (false);
