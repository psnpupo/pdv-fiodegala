-- Script para criar tabelas de configuração de periféricos
-- Execute este script no SQL Editor do Supabase

-- Tabela para configurações de periféricos por loja
CREATE TABLE IF NOT EXISTS public.peripheral_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    config_type TEXT NOT NULL CHECK (config_type IN ('printer', 'scanner', 'fiscal')),
    config_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_peripheral_configs_store_id ON public.peripheral_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_peripheral_configs_type ON public.peripheral_configs(config_type);
CREATE INDEX IF NOT EXISTS idx_peripheral_configs_active ON public.peripheral_configs(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_peripheral_configs
    BEFORE UPDATE ON public.peripheral_configs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Tabela para logs de impressão
CREATE TABLE IF NOT EXISTS public.print_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sale_id UUID,
    printer_config JSONB NOT NULL,
    receipt_content TEXT,
    print_status TEXT NOT NULL CHECK (print_status IN ('success', 'error', 'pending')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_print_logs_store_id ON public.print_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_print_logs_sale_id ON public.print_logs(sale_id);
CREATE INDEX IF NOT EXISTS idx_print_logs_status ON public.print_logs(print_status);
CREATE INDEX IF NOT EXISTS idx_print_logs_created_at ON public.print_logs(created_at);

-- Tabela para dispositivos detectados
CREATE TABLE IF NOT EXISTS public.detected_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL CHECK (device_type IN ('printer', 'scanner', 'payment_terminal')),
    device_name TEXT NOT NULL,
    device_id TEXT,
    interface_type TEXT,
    port_address TEXT,
    is_connected BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para dispositivos
CREATE INDEX IF NOT EXISTS idx_detected_devices_store_id ON public.detected_devices(store_id);
CREATE INDEX IF NOT EXISTS idx_detected_devices_type ON public.detected_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_detected_devices_connected ON public.detected_devices(is_connected);

-- Trigger para dispositivos
CREATE TRIGGER set_timestamp_detected_devices
    BEFORE UPDATE ON public.detected_devices
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies (simplificadas para evitar problemas)
ALTER TABLE public.peripheral_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_devices ENABLE ROW LEVEL SECURITY;

-- Políticas para peripheral_configs
CREATE POLICY "Usuários podem ver configurações da sua loja" ON public.peripheral_configs
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir configurações da sua loja" ON public.peripheral_configs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar configurações da sua loja" ON public.peripheral_configs
    FOR UPDATE USING (true);

-- Políticas para print_logs
CREATE POLICY "Usuários podem ver logs da sua loja" ON public.print_logs
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir logs da sua loja" ON public.print_logs
    FOR INSERT WITH CHECK (true);

-- Políticas para detected_devices
CREATE POLICY "Usuários podem ver dispositivos da sua loja" ON public.detected_devices
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir dispositivos da sua loja" ON public.detected_devices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar dispositivos da sua loja" ON public.detected_devices
    FOR UPDATE USING (true);

-- Inserir configurações padrão para teste
INSERT INTO public.peripheral_configs (store_id, config_type, config_data) VALUES
    (NULL, 'printer', '{"type": "epson", "interface": "USB", "port": "USB001", "enabled": true}'),
    (NULL, 'scanner', '{"deviceId": "", "autoScan": true, "enabled": true}'),
    (NULL, 'fiscal', '{"nfeEnabled": false, "satEnabled": false, "cnpj": "", "inscricaoEstadual": ""}');

-- Comentários para documentação
COMMENT ON TABLE public.peripheral_configs IS 'Configurações de periféricos por loja';
COMMENT ON TABLE public.print_logs IS 'Logs de impressão de recibos';
COMMENT ON TABLE public.detected_devices IS 'Dispositivos detectados automaticamente'; 