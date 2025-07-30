// Script para testar conexão com Supabase
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (mesmas do backend)
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');

  try {
    // Testar conexão básica
    console.log('1. Testando conexão básica...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro na conexão:', testError);
      return;
    }
    console.log('✅ Conexão básica OK\n');

    // Listar produtos
    console.log('2. Listando produtos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, barcode, active, stock')
      .order('name');

    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError);
      return;
    }

    console.log(`📦 Produtos encontrados: ${products.length}`);
    products.forEach(product => {
      console.log(`   - ${product.name} (${product.barcode}) - Ativo: ${product.active} - Estoque: ${product.stock}`);
    });
    console.log('');

    // Listar lojas
    console.log('3. Listando lojas...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, is_online_store, active')
      .order('name');

    if (storesError) {
      console.error('❌ Erro ao buscar lojas:', storesError);
      return;
    }

    console.log(`🏪 Lojas encontradas: ${stores.length}`);
    stores.forEach(store => {
      console.log(`   - ${store.name} (Online: ${store.is_online_store}) - Ativo: ${store.active}`);
    });
    console.log('');

    // Testar busca por código de barras
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log(`4. Testando busca por código: ${firstProduct.barcode}`);
      
      const { data: foundProduct, error: searchError } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', firstProduct.barcode)
        .eq('active', true)
        .single();

      if (searchError) {
        console.error('❌ Erro na busca:', searchError);
      } else {
        console.log(`✅ Produto encontrado: ${foundProduct.name}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConnection(); 