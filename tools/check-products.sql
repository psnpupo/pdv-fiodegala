-- Script para verificar produtos no banco de dados
-- Execute este script no Supabase SQL Editor

-- Verificar todos os produtos ativos
SELECT 
    id,
    name,
    barcode,
    price,
    price_varejo,
    price_atacado,
    price_atacarejo,
    stock,
    active,
    store_id,
    created_at
FROM products 
WHERE active = true
ORDER BY name;

-- Verificar especificamente o produto com código 6307CB
SELECT 
    id,
    name,
    barcode,
    price,
    price_varejo,
    price_atacado,
    price_atacarejo,
    stock,
    active,
    store_id,
    created_at
FROM products 
WHERE barcode = '6307CB';

-- Contar total de produtos
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN active = true THEN 1 END) as active_products,
    COUNT(CASE WHEN active = false THEN 1 END) as inactive_products
FROM products;
