-- Script para criar produtos de teste
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos verificar se existe uma loja online
INSERT INTO stores (id, name, is_online_store, active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Loja Online Principal',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Buscar o ID da loja online
DO $$
DECLARE
    online_store_id UUID;
BEGIN
    SELECT id INTO online_store_id FROM stores WHERE is_online_store = true LIMIT 1;
    
    -- Criar produtos de teste
    INSERT INTO products (
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
        category_id,
        store_id,
        product_type,
        active,
        created_at,
        updated_at
    ) VALUES 
    (
        gen_random_uuid(),
        'Camiseta Básica',
        'Camiseta básica de algodão, cores variadas',
        '7891234567890',
        29.90,
        29.90,
        25.90,
        27.90,
        100,
        10,
        NULL,
        online_store_id,
        'simple',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Calça Jeans',
        'Calça jeans clássica, modelo reto',
        '7891234567891',
        89.90,
        89.90,
        75.90,
        82.90,
        50,
        5,
        NULL,
        online_store_id,
        'simple',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Tênis Esportivo',
        'Tênis confortável para atividades físicas',
        '7891234567892',
        129.90,
        129.90,
        110.90,
        120.90,
        30,
        3,
        NULL,
        online_store_id,
        'simple',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Vestido Casual',
        'Vestido casual para o dia a dia',
        '7891234567893',
        69.90,
        69.90,
        59.90,
        64.90,
        25,
        2,
        NULL,
        online_store_id,
        'simple',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Jaqueta Jeans',
        'Jaqueta jeans clássica',
        '7891234567894',
        149.90,
        149.90,
        129.90,
        139.90,
        20,
        2,
        NULL,
        online_store_id,
        'simple',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (barcode) DO NOTHING;
    
    RAISE NOTICE 'Produtos de teste criados com sucesso!';
END $$;

-- Verificar se os produtos foram criados
SELECT 
    name,
    barcode,
    price,
    stock,
    active
FROM products 
WHERE barcode IN (
    '7891234567890',
    '7891234567891', 
    '7891234567892',
    '7891234567893',
    '7891234567894'
)
ORDER BY name; 