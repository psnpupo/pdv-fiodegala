-- Script para adicionar campos de empresa na tabela customers
-- Execute este SQL no painel do Supabase (SQL Editor)

-- Adicionar colunas para dados de empresa
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS nome_fantasia VARCHAR(255);

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Verificar estrutura atual da tabela
SELECT * FROM customers LIMIT 1;
