-- Script para corrigir a tabela customer_groups
-- Execute este SQL no painel do Supabase (SQL Editor)

-- Adicionar colunas faltantes na tabela customer_groups
ALTER TABLE customer_groups ADD COLUMN IF NOT EXISTS average_ticket DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE customer_groups ADD COLUMN IF NOT EXISTS observations TEXT;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customer_groups' 
ORDER BY ordinal_position;

-- Inserir alguns grupos de exemplo se a tabela estiver vazia
INSERT INTO customer_groups (name, average_ticket, observations)
SELECT 'Cliente Básico', 50.00, 'Clientes com ticket médio baixo'
WHERE NOT EXISTS (SELECT 1 FROM customer_groups WHERE name = 'Cliente Básico');

INSERT INTO customer_groups (name, average_ticket, observations)
SELECT 'Cliente Médio', 150.00, 'Clientes com ticket médio intermediário'
WHERE NOT EXISTS (SELECT 1 FROM customer_groups WHERE name = 'Cliente Médio');

INSERT INTO customer_groups (name, average_ticket, observations)
SELECT 'Cliente Premium', 500.00, 'Clientes com ticket médio alto'
WHERE NOT EXISTS (SELECT 1 FROM customer_groups WHERE name = 'Cliente Premium');

-- Verificar os dados inseridos
SELECT * FROM customer_groups ORDER BY name;
