-- Tabela de estado das sessões de navegador remoto (orquestrador GCP).
-- Caso Supabase não esteja configurado, o orquestrador usa sessions.json local.
create table if not exists public.browser_sessions (
  nav_id      text primary key,
  user_id     text not null,
  vm_name     text not null,
  vm_ip       text not null,
  ws_port     integer not null,
  token       text not null,
  display     integer not null,
  vnc_port    integer not null,
  status      text not null default 'active',
  started_at  bigint not null
);

create index if not exists browser_sessions_user_idx on public.browser_sessions (user_id);
create index if not exists browser_sessions_vm_idx on public.browser_sessions (vm_name);
create index if not exists browser_sessions_wsport_idx on public.browser_sessions (ws_port);

-- RLS desligado: o orquestrador usa a service_role key (server-to-server).
alter table public.browser_sessions disable row level security;
