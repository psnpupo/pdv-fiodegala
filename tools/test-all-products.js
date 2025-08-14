// Script para testar todos os produtos dos botões rápidos
const BACKEND_URL = 'http://localhost:4000/api';

const testProducts = [
  { barcode: '6307CB', name: 'Camiseta Básica' },
  { barcode: '7182CSR', name: 'Calça com Regulagem' },
  { barcode: '68426GM', name: 'Gola Média' }
];

async function testAllProducts() {
  console.log('🔍 Testando todos os produtos dos botões rápidos...');
  
  try {
    // Teste 1: Verificar se o backend está rodando
    console.log('\n1. Verificando se o backend está rodando...');
    const statusResponse = await fetch(`${BACKEND_URL}/status`);
    if (!statusResponse.ok) {
      console.log('❌ Backend não está respondendo');
      return;
    }
    console.log('✅ Backend está rodando');

    // Teste 2: Testar cada produto
    console.log('\n2. Testando produtos dos botões rápidos...');
    
    for (const product of testProducts) {
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

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o teste
testAllProducts();
