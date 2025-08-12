-- Tabela para configuração de taxas de juros
CREATE TABLE IF NOT EXISTS public.interest_rates_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    credit_card_interest DECIMAL(5,2) NOT NULL DEFAULT 2.99,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Inserir configuração padrão (apenas se não existir)
INSERT INTO public.interest_rates_config (credit_card_interest) 
SELECT 2.99
WHERE NOT EXISTS (SELECT 1 FROM public.interest_rates_config);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interest_rates_config_updated_at 
    BEFORE UPDATE ON public.interest_rates_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.interest_rates_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler configuração de juros" ON public.interest_rates_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção/atualização para usuários com permissão
CREATE POLICY "Usuários com permissão podem gerenciar configuração de juros" ON public.interest_rates_config
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_interest_rates_config_created_at ON public.interest_rates_config(created_at);
CREATE INDEX IF NOT EXISTS idx_interest_rates_config_updated_at ON public.interest_rates_config(updated_at); 