-- Script para criar apenas o produto 6307CB que está faltando
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
    
    -- Criar apenas o produto 6307CB que está faltando
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
        '6307CB',
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
    )
    ON CONFLICT (barcode) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        price_varejo = EXCLUDED.price_varejo,
        price_atacado = EXCLUDED.price_atacado,
        price_atacarejo = EXCLUDED.price_atacarejo,
        stock = EXCLUDED.stock,
        min_stock = EXCLUDED.min_stock,
        active = EXCLUDED.active,
        updated_at = NOW();
    
    RAISE NOTICE 'Produto 6307CB criado/atualizado com sucesso!';
END $$;

-- Verificar se o produto foi criado
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
