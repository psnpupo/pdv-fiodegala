// Script para testar o formulário de grupos de clientes
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerGroupsForm() {
  console.log('🧪 Testando formulário de grupos de clientes...\n');

  try {
    // Teste 1: Criar grupo com dados completos
    console.log('Teste 1: Criar grupo com dados completos');
    const { data: test1, error: error1 } = await supabase
      .from('customer_groups')
      .insert({
        name: 'Clientes Premium',
        category: 'Cliente Exclusivo',
        ticket_min: 500.00,
        ticket_max: 2000.00,
        description: 'Clientes com alto poder aquisitivo'
      })
      .select();

    if (error1) {
      console.log('❌ Erro:', error1);
    } else {
      console.log('✅ Sucesso:', test1);
    }

    // Teste 2: Criar grupo com dados mínimos
    console.log('\nTeste 2: Criar grupo com dados mínimos');
    const { data: test2, error: error2 } = await supabase
      .from('customer_groups')
      .insert({
        name: 'Clientes Básicos',
        category: 'Varejo'
      })
      .select();

    if (error2) {
      console.log('❌ Erro:', error2);
    } else {
      console.log('✅ Sucesso:', test2);
    }

    // Teste 3: Listar todos os grupos
    console.log('\nTeste 3: Listar todos os grupos');
    const { data: groups, error: error3 } = await supabase
      .from('customer_groups')
      .select('*')
      .order('name');

    if (error3) {
      console.log('❌ Erro:', error3);
    } else {
      console.log('✅ Grupos encontrados:', groups.length);
      groups.forEach(group => {
        console.log(`  - ${group.name} (${group.category})`);
        if (group.ticket_min && group.ticket_max) {
          console.log(`    Ticket: R$ ${group.ticket_min} - R$ ${group.ticket_max}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCustomerGroupsForm();
