// Script para testar a conexão com o backend

const BACKEND_URL = 'http://localhost:4000/api';

async function testBackendConnection() {
  console.log('🔍 Testando conexão com o backend...');
  
  try {
    // Teste 1: Verificar se o backend está rodando
    console.log('\n1. Testando se o backend está rodando...');
    const statusResponse = await fetch(`${BACKEND_URL}/status`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Backend está rodando:', statusData);
    } else {
      console.log('❌ Backend não está respondendo');
      return;
    }

    // Teste 2: Testar busca de produto com código 6307CB
    console.log('\n2. Testando busca de produto com código 6307CB...');
    const productResponse = await fetch(`${BACKEND_URL}/sales/products/barcode/6307CB?modalidade=varejo`);
    
    if (productResponse.ok) {
      const productData = await productResponse.json();
      console.log('✅ Produto encontrado:', productData);
    } else {
      const errorData = await productResponse.json();
      console.log('❌ Erro ao buscar produto:', errorData);
    }

    // Teste 3: Testar busca de produto inexistente
    console.log('\n3. Testando busca de produto inexistente...');
    const fakeProductResponse = await fetch(`${BACKEND_URL}/sales/products/barcode/FAKE123?modalidade=varejo`);
    
    if (fakeProductResponse.ok) {
      const fakeProductData = await fakeProductResponse.json();
      console.log('✅ Produto fake encontrado (inesperado):', fakeProductData);
    } else {
      const fakeErrorData = await fakeProductResponse.json();
      console.log('✅ Erro esperado para produto inexistente:', fakeErrorData);
    }

  } catch (error) {
    console.error('❌ Erro ao testar backend:', error.message);
  }
}

// Executar o teste
testBackendConnection();
