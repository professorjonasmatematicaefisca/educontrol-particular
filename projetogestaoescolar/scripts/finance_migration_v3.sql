-- Script de Migração V3: Planejamento Financeiro e Caixinhas
-- Execute este script no SQL Editor do Supabase para criar a nova tabela

CREATE TABLE public.finance_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  color varchar(20),
  icon varchar(50),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança
ALTER TABLE public.finance_goals ENABLE ROW LEVEL SECURITY;

-- Política de RLS
CREATE POLICY "Users can manage their own goals"
  ON public.finance_goals FOR ALL
  USING (auth.uid() = user_id);
