-- Script de Migração: Módulo de Finanças Pessoais (MVP)
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de Contas
CREATE TABLE public.finance_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL, -- 'WALLET', 'CHECKING', 'SAVINGS', 'BROKERAGE', 'CREDIT'
  balance numeric NOT NULL DEFAULT 0,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só vê e manipula as próprias contas
CREATE POLICY "Users can manage their own accounts"
  ON public.finance_accounts FOR ALL
  USING (auth.uid() = user_id);

-- 2. Criar tabela de Transações
CREATE TABLE public.finance_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  subcategory text,
  tags text[],
  type text NOT NULL, -- 'INCOME', 'EXPENSE', 'TRANSFER'
  status text NOT NULL DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED'
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipts text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só vê e manipula as próprias transações
CREATE POLICY "Users can manage their own transactions"
  ON public.finance_transactions FOR ALL
  USING (auth.uid() = user_id);
