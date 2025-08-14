-- Script para verificar e criar produtos de teste para os botões rápidos do POS
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
    
    -- Criar/atualizar produtos de teste para os botões rápidos
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
    ),
    (
        gen_random_uuid(),
        'Calça com Regulagem',
        'Calça jeans com regulagem na cintura',
        '7182CSR',
        259.90,
        259.90,
        220.90,
        240.90,
        15,
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
        'Gola Média',
        'Camiseta com gola média',
        '68426GM',
        99.90,
        99.90,
        85.90,
        92.90,
        15,
        8,
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
    
    RAISE NOTICE 'Produtos de teste criados/atualizados com sucesso!';
END $$;

-- Verificar se todos os produtos foram criados corretamente
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
WHERE barcode IN ('6307CB', '7182CSR', '68426GM')
ORDER BY name;
