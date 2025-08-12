// Script para testar inserção simples na tabela customer_groups
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerGroupsSimple() {
  console.log('🧪 Testando inserção simples na tabela customer_groups...\n');

  try {
    // Teste 1: Apenas name
    console.log('Teste 1: Apenas name');
    const { data: test1, error: error1 } = await supabase
      .from('customer_groups')
      .insert({
        name: 'Teste Apenas Nome'
      })
      .select();

    if (error1) {
      console.log('❌ Erro:', error1);
    } else {
      console.log('✅ Sucesso:', test1);
      // Limpar
      await supabase.from('customer_groups').delete().eq('name', 'Teste Apenas Nome');
    }

    // Teste 2: name + category
    console.log('\nTeste 2: name + category');
    const { data: test2, error: error2 } = await supabase
      .from('customer_groups')
      .insert({
        name: 'Teste com Categoria',
        category: 'Varejo'
      })
      .select();

    if (error2) {
      console.log('❌ Erro:', error2);
    } else {
      console.log('✅ Sucesso:', test2);
      // Limpar
      await supabase.from('customer_groups').delete().eq('name', 'Teste com Categoria');
    }

    // Teste 3: Verificar estrutura atual
    console.log('\nTeste 3: Verificar dados existentes');
    const { data: existing, error: error3 } = await supabase
      .from('customer_groups')
      .select('*')
      .limit(5);

    if (error3) {
      console.log('❌ Erro ao buscar dados existentes:', error3);
    } else {
      console.log('✅ Dados existentes:', existing);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCustomerGroupsSimple();
