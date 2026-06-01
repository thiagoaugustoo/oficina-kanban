# Supabase Setup

Para salvar os dados remotamente e permitir que todos os usuários vejam as alterações em tempo real, configure o Supabase com as seguintes tabelas:

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Tabelas sugeridas

```sql
create table users (
  id text primary key,
  name text not null,
  email text not null,
  password text not null,
  role text not null,
  active boolean not null,
  createdAt timestamptz not null
);

create table employees (
  id text primary key,
  name text not null,
  role text not null,
  areaId text,
  isEstimator boolean default false,
  phone text,
  active boolean not null,
  createdAt timestamptz not null
);

create table areas (
  id text primary key,
  name text not null,
  order int not null,
  color text,
  createdAt timestamptz not null
);

create table vehicles (
  id text primary key,
  plate text not null,
  brand text not null,
  model text not null,
  color text,
  clientName text,
  observations text,
  entryDate date not null,
  promisedDate date,
  estimatorId text not null,
  currentAreaId text not null,
  status text not null,
  completedAt timestamptz,
  completedByUserId text,
  createdByUserId text not null,
  createdAt timestamptz not null,
  updatedAt timestamptz not null
);

create table history (
  id text primary key,
  vehicleId text not null,
  type text not null,
  fromAreaId text,
  toAreaId text,
  employeeId text,
  userId text not null,
  notes text,
  timestamp timestamptz not null
);
```

## Regras de segurança

No Supabase Dashboard, permita leitura e escrita nas tabelas durante o desenvolvimento. Para produção, crie políticas RLS adequadas.

## Uso

- O código do app usará Supabase para carregar dados ao abrir e enviar atualizações automaticamente.
- As mudanças serão propagadas em tempo real para todos os usuários conectados.

## Observação

O login continua sendo feito pelo store local atualmente. Se quiser, posso também migrar o login para Supabase Auth.
