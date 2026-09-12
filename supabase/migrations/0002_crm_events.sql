-- Boîte de réception des événements du CRM IMMO PRO-X.
--
-- Rôle : garantir qu'un événement rejoué (le worker distant réessaie tant qu'il
-- n'a pas d'accusé de réception) ne soit traité qu'une seule fois. La clé
-- primaire composite fait foi : une seconde insertion échoue, on répond 200
-- sans retraiter. Sans cela, un même « visite effectuée » pourrait être compté
-- plusieurs fois côté publicité.
--
-- RLS activée sans policy : inaccessible via la Data API, seul le rôle service
-- (serveur Next.js) y écrit.

create table if not exists public.crm_events (
  integration_id text not null,
  event_id       text not null,
  received_at    timestamptz not null default now(),
  event_type     text not null,
  payload        jsonb not null default '{}'::jsonb,
  -- recu | traite | ignore | erreur
  status         text not null default 'recu',
  detail         text,
  processed_at   timestamptz,
  primary key (integration_id, event_id)
);

alter table public.crm_events enable row level security;

create index if not exists crm_events_received_idx on public.crm_events (received_at desc);
create index if not exists crm_events_status_idx   on public.crm_events (status, received_at desc);
