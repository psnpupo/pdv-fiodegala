-- Script para criar tabelas do sistema fiscal
-- Execute este script no SQL Editor do Supabase

-- Tabela para configurações fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    config_type TEXT NOT NULL CHECK (config_type IN ('nfe', 'sat', 'general')),
    config_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para configurações fiscais
CREATE INDEX IF NOT EXISTS idx_fiscal_configs_store_id ON public.fiscal_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_configs_type ON public.fiscal_configs(config_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_configs_active ON public.fiscal_configs(is_active);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_timestamp_fiscal_configs
    BEFORE UPDATE ON public.fiscal_configs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Tabela para documentos fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    sale_id UUID,
    document_type TEXT NOT NULL CHECK (document_type IN ('nfe', 'sat', 'nfce')),
    document_number TEXT,
    access_key TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'approved', 'rejected', 'cancelled')),
    xml_content TEXT,
    response_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para documentos fiscais
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_store_id ON public.fiscal_documents(store_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_sale_id ON public.fiscal_documents(sale_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_type ON public.fiscal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_status ON public.fiscal_documents(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_number ON public.fiscal_documents(document_number);

-- Trigger para documentos fiscais
CREATE TRIGGER set_timestamp_fiscal_documents
    BEFORE UPDATE ON public.fiscal_documents
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Tabela para certificados digitais
CREATE TABLE IF NOT EXISTS public.digital_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    certificate_type TEXT NOT NULL CHECK (certificate_type IN ('a1', 'a3')),
    certificate_data TEXT NOT NULL,
    password TEXT,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para certificados
CREATE INDEX IF NOT EXISTS idx_digital_certificates_store_id ON public.digital_certificates(store_id);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_type ON public.digital_certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_digital_certificates_active ON public.digital_certificates(is_active);

-- Trigger para certificados
CREATE TRIGGER set_timestamp_digital_certificates
    BEFORE UPDATE ON public.digital_certificates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Tabela para logs fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    document_id UUID REFERENCES public.fiscal_documents(id) ON DELETE SET NULL,
    details JSONB,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs fiscais
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_store_id ON public.fiscal_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_action ON public.fiscal_logs(action);
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_status ON public.fiscal_logs(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_created_at ON public.fiscal_logs(created_at);

-- RLS Policies (simplificadas)
ALTER TABLE public.fiscal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para fiscal_configs
CREATE POLICY "Usuários podem ver configurações fiscais da sua loja" ON public.fiscal_configs
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir configurações fiscais da sua loja" ON public.fiscal_configs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar configurações fiscais da sua loja" ON public.fiscal_configs
    FOR UPDATE USING (true);

-- Políticas para fiscal_documents
CREATE POLICY "Usuários podem ver documentos fiscais da sua loja" ON public.fiscal_documents
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir documentos fiscais da sua loja" ON public.fiscal_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar documentos fiscais da sua loja" ON public.fiscal_documents
    FOR UPDATE USING (true);

-- Políticas para digital_certificates
CREATE POLICY "Usuários podem ver certificados da sua loja" ON public.digital_certificates
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir certificados da sua loja" ON public.digital_certificates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar certificados da sua loja" ON public.digital_certificates
    FOR UPDATE USING (true);

-- Políticas para fiscal_logs
CREATE POLICY "Usuários podem ver logs fiscais da sua loja" ON public.fiscal_logs
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir logs fiscais da sua loja" ON public.fiscal_logs
    FOR INSERT WITH CHECK (true);

-- Inserir configurações padrão
INSERT INTO public.fiscal_configs (store_id, config_type, config_data) VALUES
    (NULL, 'nfe', '{"enabled": false, "environment": "homologation", "series": "1", "nextNumber": 1}'),
    (NULL, 'sat', '{"enabled": false, "environment": "homologation", "nextNumber": 1}'),
    (NULL, 'general', '{"cnpj": "", "inscricaoEstadual": "", "razaoSocial": "", "nomeFantasia": ""}');

-- Comentários para documentação
COMMENT ON TABLE public.fiscal_configs IS 'Configurações do sistema fiscal';
COMMENT ON TABLE public.fiscal_documents IS 'Documentos fiscais gerados';
COMMENT ON TABLE public.digital_certificates IS 'Certificados digitais';
COMMENT ON TABLE public.fiscal_logs IS 'Logs de operações fiscais'; 