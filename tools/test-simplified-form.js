// Script para testar o formulário simplificado
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimplifiedForm() {
  console.log('🧪 Testando formulário simplificado...\n');

  try {
    // Teste 1: Criar grupo simples
    console.log('Teste 1: Criar grupo simples');
    const { data: test1, error: error1 } = await supabase
      .from('customer_groups')
      .insert({
        name: 'Grupo Simples',
        category: 'Varejo',
        ticket_min: 100.00,
        ticket_max: null,
        description: 'Teste do formulário simplificado'
      })
      .select();

    if (error1) {
      console.log('❌ Erro:', error1);
    } else {
      console.log('✅ Sucesso:', test1);
      
      // Teste 2: Editar o grupo criado
      console.log('\nTeste 2: Editar grupo');
      const { data: test2, error: error2 } = await supabase
        .from('customer_groups')
        .update({
          name: 'Grupo Simples Editado',
          category: 'Varejo',
          ticket_min: 200.00,
          ticket_max: null,
          description: 'Grupo editado com sucesso'
        })
        .eq('id', test1[0].id)
        .select();

      if (error2) {
        console.log('❌ Erro ao editar:', error2);
      } else {
        console.log('✅ Editado com sucesso:', test2);
      }

      // Teste 3: Buscar o grupo editado
      console.log('\nTeste 3: Buscar grupo editado');
      const { data: test3, error: error3 } = await supabase
        .from('customer_groups')
        .select('*')
        .eq('id', test1[0].id)
        .single();

      if (error3) {
        console.log('❌ Erro ao buscar:', error3);
      } else {
        console.log('✅ Busca bem-sucedida:', test3);
      }

      // Limpar dados de teste
      await supabase.from('customer_groups').delete().eq('id', test1[0].id);
      console.log('🧹 Dados de teste limpos');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSimplifiedForm();
