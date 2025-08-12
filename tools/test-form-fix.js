// Script para testar o formulário corrigido
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFormFix() {
  console.log('🧪 Testando formulário corrigido...\n');

  try {
    // Teste 1: Criar grupo com valor médio
    console.log('Teste 1: Criar grupo com valor médio');
    const { data: test1, error: error1 } = await supabase
      .from('customer_groups')
      .insert({
        name: 'Teste Valor Médio',
        category: 'Varejo',
        ticket_min: 150.00, // Usando ticket_min para armazenar o valor médio
        ticket_max: null,
        description: 'Teste do formulário corrigido'
      })
      .select();

    if (error1) {
      console.log('❌ Erro:', error1);
    } else {
      console.log('✅ Sucesso:', test1);
    }

    // Teste 2: Listar grupos para verificar exibição
    console.log('\nTeste 2: Listar grupos');
    const { data: groups, error: error2 } = await supabase
      .from('customer_groups')
      .select('*')
      .order('name');

    if (error2) {
      console.log('❌ Erro:', error2);
    } else {
      console.log('✅ Grupos encontrados:', groups.length);
      groups.forEach(group => {
        console.log(`  - ${group.name} (${group.category})`);
        if (group.ticket_min) {
          console.log(`    Ticket Médio: R$ ${group.ticket_min}`);
        } else {
          console.log(`    Ticket Médio: Não definido`);
        }
        if (group.description) {
          console.log(`    Descrição: ${group.description}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFormFix();
