-- Script para criar tabela de logs de scanner
-- Execute este script no SQL Editor do Supabase

-- Tabela para logs de leitura de código de barras
CREATE TABLE IF NOT EXISTS public.scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    barcode TEXT NOT NULL,
    format TEXT,
    scanner_config JSONB,
    scan_status TEXT NOT NULL CHECK (scan_status IN ('success', 'error', 'pending')),
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs de scanner
CREATE INDEX IF NOT EXISTS idx_scan_logs_store_id ON public.scan_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_barcode ON public.scan_logs(barcode);
CREATE INDEX IF NOT EXISTS idx_scan_logs_status ON public.scan_logs(scan_status);
CREATE INDEX IF NOT EXISTS idx_scan_logs_timestamp ON public.scan_logs(timestamp);

-- RLS Policies
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para scan_logs
CREATE POLICY "Usuários podem ver logs de scanner da sua loja" ON public.scan_logs
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir logs de scanner da sua loja" ON public.scan_logs
    FOR INSERT WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.scan_logs IS 'Logs de leitura de código de barras'; 