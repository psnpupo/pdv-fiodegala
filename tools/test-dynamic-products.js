// Script para testar a funcionalidade de produtos dinâmicos
const BACKEND_URL = 'http://localhost:4000/api';

async function testDynamicProducts() {
  console.log('🔍 Testando funcionalidade de produtos dinâmicos...');
  
  try {
    // Teste 1: Verificar se o backend está rodando
    console.log('\n1. Verificando se o backend está rodando...');
    const statusResponse = await fetch(`${BACKEND_URL}/status`);
    if (!statusResponse.ok) {
      console.log('❌ Backend não está respondendo');
      return;
    }
    console.log('✅ Backend está rodando');

    // Teste 2: Buscar todos os produtos para verificar os mais recentes
    console.log('\n2. Buscando produtos para identificar os 3 mais recentes...');
    
    try {
      const productsResponse = await fetch(`${BACKEND_URL}/products`);
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const activeProducts = productsData
          .filter(product => product.active)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3);
        
        console.log('📦 Os 3 produtos mais recentes são:');
        activeProducts.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} (${product.barcode}) - R$ ${product.price}`);
        });
        
        // Teste 3: Testar cada produto recente
        console.log('\n3. Testando busca de cada produto recente...');
        for (const product of activeProducts) {
          console.log(`\n📦 Testando: ${product.name} (${product.barcode})`);
          
          try {
            const response = await fetch(`${BACKEND_URL}/sales/products/barcode/${product.barcode}?modalidade=varejo`);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`✅ ${product.name} encontrado:`, {
                name: data.product.name,
                price: data.product.price,
                stock: data.product.stock
              });
            } else {
              const errorData = await response.json();
              console.log(`❌ ${product.name} não encontrado:`, errorData.error);
            }
          } catch (error) {
            console.log(`❌ Erro ao testar ${product.name}:`, error.message);
          }
        }
      } else {
        console.log('❌ Erro ao buscar produtos');
      }
    } catch (error) {
      console.log('❌ Erro ao buscar produtos:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o teste
testDynamicProducts();
