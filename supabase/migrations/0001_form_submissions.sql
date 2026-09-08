-- Demandes des formulaires publics : messages de contact et demandes de visite.
-- Cahier des charges V2 §9 & §12. RLS obligatoire : le rôle anonyme n'accède
-- jamais à ces données (seul le rôle service, utilisé côté serveur Next.js
-- avec SUPABASE_SECRET_KEY, écrit et lit).

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Messages du formulaire de contact
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  email        text not null,
  phone        text,
  message      text not null,
  consent      boolean not null default false,
  source       jsonb not null default '{}'::jsonb,
  email_status text not null default 'pending'   -- pending | sent | skipped | failed
);

alter table public.contact_messages enable row level security;
-- Aucune policy => inaccessible via la Data API (anon / authenticated).
-- Le rôle `service_role` contourne RLS et est le seul utilisé par le serveur.

-- ─────────────────────────────────────────────────────────────────────────────
-- Demandes de visite (VEFA — voir docs/CALENDRIER-IMMOPROX.md)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.visit_requests (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Idempotence : le client renvoie la même clé à chaque retry.
  idempotency_key    text unique,
  -- Référence de LA réservation, distincte de toute référence de contact.
  external_ref       text unique not null,
  project_slug       text not null,
  full_name          text not null,
  phone              text not null,
  email              text,
  preferred_date     date not null,
  preferred_time     text not null,
  typology           text,
  preferred_channel  text,
  note               text,
  marketing_consent  boolean not null default false,
  source             jsonb not null default '{}'::jsonb,
  -- recue -> transmise -> confirmee | replanifiee | refusee | en_file | arbitrage
  status             text not null default 'recue',
  crm_op_id          text,
  crm_visit_id       text,
  email_status       text not null default 'pending'
);

alter table public.visit_requests enable row level security;

create index if not exists visit_requests_status_idx  on public.visit_requests (status, created_at desc);
create index if not exists visit_requests_project_idx on public.visit_requests (project_slug, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists visit_requests_set_updated_at on public.visit_requests;
create trigger visit_requests_set_updated_at
  before update on public.visit_requests
  for each row execute function public.set_updated_at();
