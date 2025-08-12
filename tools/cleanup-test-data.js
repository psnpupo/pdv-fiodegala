// Script para limpar dados de teste
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTestData() {
  console.log('🧹 Limpando dados de teste...\n');

  try {
    // Listar todos os grupos
    const { data: groups, error: listError } = await supabase
      .from('customer_groups')
      .select('*');

    if (listError) {
      console.log('❌ Erro ao listar grupos:', listError);
      return;
    }

    console.log(`📋 Encontrados ${groups.length} grupos:`);
    groups.forEach(group => {
      console.log(`  - ${group.name} (${group.category})`);
    });

    // Deletar grupos de teste
    const testNames = [
      'Teste Apenas Nome',
      'Teste com Categoria',
      'Teste Básico',
      'Teste Final',
      'Clientes Premium',
      'Clientes Básicos'
    ];

    for (const name of testNames) {
      const { error: deleteError } = await supabase
        .from('customer_groups')
        .delete()
        .eq('name', name);

      if (deleteError) {
        console.log(`⚠️ Erro ao deletar "${name}":`, deleteError);
      } else {
        console.log(`✅ Deletado: ${name}`);
      }
    }

    // Verificar grupos restantes
    const { data: remainingGroups, error: remainingError } = await supabase
      .from('customer_groups')
      .select('*');

    if (remainingError) {
      console.log('❌ Erro ao verificar grupos restantes:', remainingError);
    } else {
      console.log(`\n📋 Grupos restantes: ${remainingGroups.length}`);
      remainingGroups.forEach(group => {
        console.log(`  - ${group.name} (${group.category})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

cleanupTestData();
