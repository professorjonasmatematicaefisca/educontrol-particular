-- Script de Migração V2: Expansão de Cartões de Crédito
-- Execute este script no SQL Editor do Supabase para adicionar as novas colunas

ALTER TABLE public.finance_accounts
ADD COLUMN credit_limit numeric,
ADD COLUMN due_date integer, -- dia do vencimento (1-31)
ADD COLUMN closing_date integer; -- dia do fechamento (1-31)
