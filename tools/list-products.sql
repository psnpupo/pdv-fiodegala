-- Script para listar todos os produtos cadastrados
-- Execute este script no Supabase SQL Editor

SELECT 
    id,
    name,
    description,
    barcode,
    price,
    price_varejo,
    price_atacado,
    price_atacarejo,
    stock,
    min_stock,
    active,
    product_type,
    store_id,
    created_at,
    updated_at
FROM products 
ORDER BY name;

-- Verificar também as lojas
SELECT 
    id,
    name,
    is_online_store,
    active
FROM stores 
ORDER BY name; 