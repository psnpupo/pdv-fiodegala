// Script para verificar a estrutura da tabela customers
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomersTable() {
  console.log('🔍 Verificando estrutura da tabela customers...\n');

  try {
    // Teste 1: Tentar inserir cliente básico
    console.log('Teste 1: Inserir cliente básico');
    const { data: test1, error: error1 } = await supabase
      .from('customers')
      .insert({
        name: 'Cliente Teste',
        phone: '11999999999',
        email: 'teste@teste.com'
      })
      .select();

    if (error1) {
      console.log('❌ Erro:', error1);
    } else {
      console.log('✅ Sucesso:', test1);
      
      // Limpar o registro de teste
      await supabase.from('customers').delete().eq('id', test1[0].id);
    }

    // Teste 2: Tentar inserir com campos adicionais
    console.log('\nTeste 2: Inserir com campos adicionais');
    const { data: test2, error: error2 } = await supabase
      .from('customers')
      .insert({
        name: 'Cliente Empresa',
        phone: '11999999999',
        email: 'empresa@teste.com',
        cnpj: '12345678901234',
        razao_social: 'Empresa Teste LTDA'
      })
      .select();

    if (error2) {
      console.log('❌ Erro:', error2);
    } else {
      console.log('✅ Sucesso:', test2);
      
      // Limpar o registro de teste
      await supabase.from('customers').delete().eq('id', test2[0].id);
    }

    // Teste 3: Listar clientes existentes
    console.log('\nTeste 3: Listar clientes existentes');
    const { data: customers, error: error3 } = await supabase
      .from('customers')
      .select('*')
      .limit(3);

    if (error3) {
      console.log('❌ Erro:', error3);
    } else {
      console.log('✅ Clientes encontrados:', customers.length);
      if (customers.length > 0) {
        console.log('Exemplo de cliente:', customers[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkCustomersTable();
