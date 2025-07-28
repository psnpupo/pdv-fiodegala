-- Script para corrigir tabelas de periféricos
-- Execute este script no SQL Editor do Supabase

-- Adicionar constraint única para device_id na tabela detected_devices
ALTER TABLE public.detected_devices 
ADD CONSTRAINT detected_devices_device_id_unique UNIQUE (device_id);

-- Verificar se a constraint foi criada
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'detected_devices' 
AND constraint_type = 'UNIQUE';

-- Testar inserção de dados
INSERT INTO public.detected_devices (device_type, device_name, device_id, interface_type, port_address, is_connected) 
VALUES 
('printer', 'Epson TM-T20II', 'USB001', 'USB', 'USB001', true),
('scanner', 'Honeywell 1900', 'USB002', 'USB', 'USB002', true)
ON CONFLICT (device_id) DO UPDATE SET
  device_name = EXCLUDED.device_name,
  interface_type = EXCLUDED.interface_type,
  port_address = EXCLUDED.port_address,
  is_connected = EXCLUDED.is_connected,
  last_seen = NOW(),
  updated_at = NOW();

-- Verificar dados inseridos
SELECT * FROM public.detected_devices ORDER BY created_at DESC; 