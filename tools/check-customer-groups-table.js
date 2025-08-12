// Script para verificar a estrutura da tabela customer_groups
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomerGroupsTable() {
  console.log('🔍 Verificando estrutura da tabela customer_groups...\n');

  try {
    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('customer_groups')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Tabela customer_groups não existe ou não está acessível');
      console.log('Erro:', tableError);
      return;
    }

    console.log('✅ Tabela customer_groups existe');

    // Verificar estrutura da tabela
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'customer_groups' });

    if (columnsError) {
      console.log('⚠️ Não foi possível obter a estrutura da tabela via RPC');
      console.log('Tentando método alternativo...');
      
      // Tentar inserir um registro de teste para ver quais colunas existem
      const { data: testData, error: testError } = await supabase
        .from('customer_groups')
        .insert({
          name: 'Teste',
          average_ticket: 100.00,
          observations: 'Teste de estrutura'
        })
        .select();

      if (testError) {
        console.log('❌ Erro ao inserir teste:', testError);
        
        // Tentar sem average_ticket
        const { data: testData2, error: testError2 } = await supabase
          .from('customer_groups')
          .insert({
            name: 'Teste',
            observations: 'Teste sem average_ticket'
          })
          .select();

        if (testError2) {
          console.log('❌ Erro ao inserir sem average_ticket:', testError2);
        } else {
          console.log('✅ Tabela existe mas sem coluna average_ticket');
          console.log('Dados inseridos:', testData2);
        }
      } else {
        console.log('✅ Tabela existe com todas as colunas');
        console.log('Dados inseridos:', testData);
        
        // Limpar o registro de teste
        await supabase
          .from('customer_groups')
          .delete()
          .eq('name', 'Teste');
      }
    } else {
      console.log('📋 Estrutura da tabela:');
      console.log(columns);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
  }
}

checkCustomerGroupsTable();
