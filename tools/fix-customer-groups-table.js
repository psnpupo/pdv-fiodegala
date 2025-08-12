// Script para corrigir a tabela customer_groups
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCustomerGroupsTable() {
  console.log('🔧 Corrigindo tabela customer_groups...\n');

  try {
    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('customer_groups')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Tabela customer_groups não existe');
      return;
    }

    console.log('✅ Tabela customer_groups existe');

    // Tentar inserir com apenas name para ver se funciona
    const { data: testData, error: testError } = await supabase
      .from('customer_groups')
      .insert({
        name: 'Teste Básico'
      })
      .select();

    if (testError) {
      console.log('❌ Erro ao inserir com apenas name:', testError);
    } else {
      console.log('✅ Tabela aceita apenas name');
      console.log('Dados inseridos:', testData);
      
      // Limpar o registro de teste
      await supabase
        .from('customer_groups')
        .delete()
        .eq('name', 'Teste Básico');
    }

    // Agora vou executar SQL para adicionar as colunas faltantes
    console.log('\n🔧 Adicionando colunas faltantes...');
    
    const sqlCommands = [
      'ALTER TABLE customer_groups ADD COLUMN IF NOT EXISTS average_ticket DECIMAL(10,2) DEFAULT 0.00;',
      'ALTER TABLE customer_groups ADD COLUMN IF NOT EXISTS observations TEXT;'
    ];

    for (const sql of sqlCommands) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.log(`⚠️ Erro ao executar: ${sql}`);
          console.log('Erro:', error);
        } else {
          console.log(`✅ Executado: ${sql}`);
        }
      } catch (err) {
        console.log(`❌ Erro ao executar SQL: ${sql}`);
        console.log('Erro:', err);
      }
    }

    // Testar novamente após as correções
    console.log('\n🧪 Testando inserção após correções...');
    
    const { data: finalTest, error: finalError } = await supabase
      .from('customer_groups')
      .insert({
        name: 'Teste Final',
        average_ticket: 150.00,
        observations: 'Teste após correções'
      })
      .select();

    if (finalError) {
      console.log('❌ Ainda há erro após correções:', finalError);
    } else {
      console.log('✅ Inserção funcionando após correções!');
      console.log('Dados inseridos:', finalTest);
      
      // Limpar o registro de teste
      await supabase
        .from('customer_groups')
        .delete()
        .eq('name', 'Teste Final');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixCustomerGroupsTable();
