-- Migração Financeira v4: Campos da Conta + Suporte a Logo
-- Proteção embutida ("IF NOT EXISTS") caso a v2 tenha sido pulada pelo usuário.

ALTER TABLE public.finance_accounts
ADD COLUMN IF NOT EXISTS credit_limit numeric(15,2),
ADD COLUMN IF NOT EXISTS due_date integer,
ADD COLUMN IF NOT EXISTS closing_date integer,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Finalizado! Rode este script no Editor SQL.
