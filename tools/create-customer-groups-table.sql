-- Criar tabela de grupos de clientes
CREATE TABLE IF NOT EXISTS customer_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    average_ticket DECIMAL(10,2) NOT NULL,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna group_id na tabela customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES customer_groups(id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_customers_group_id ON customers(group_id);
CREATE INDEX IF NOT EXISTS idx_customer_groups_name ON customer_groups(name);

-- Habilitar RLS
ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para customer_groups
CREATE POLICY "Usuários autenticados podem visualizar grupos de clientes" ON customer_groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir grupos de clientes" ON customer_groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar grupos de clientes" ON customer_groups
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar grupos de clientes" ON customer_groups
    FOR DELETE USING (auth.role() = 'authenticated'); 