create table if not exists public.family_properties (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.family_listing_states (
  listing_id text primary key,
  favorite boolean not null default false,
  memo text not null default '',
  updated_at timestamptz not null default now(),
  constraint family_listing_states_memo_length check (char_length(memo) <= 1000)
);

create index if not exists family_properties_updated_at_idx
  on public.family_properties (updated_at desc);

create index if not exists family_listing_states_updated_at_idx
  on public.family_listing_states (updated_at desc);

alter table public.family_properties enable row level security;
alter table public.family_listing_states enable row level security;

revoke all on table public.family_properties from anon, authenticated;
revoke all on table public.family_listing_states from anon, authenticated;
grant all on table public.family_properties to service_role;
grant all on table public.family_listing_states to service_role;
