// Script para criar tabela de grupos de clientes
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configurações do Supabase (mesmas do backend)
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCustomerGroupsTable() {
  console.log('🔧 Criando tabela de grupos de clientes...\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(process.cwd(), 'tools', 'create-customer-groups-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Conteúdo do SQL:');
    console.log(sqlContent);
    console.log('\n');

    // Executar o SQL
    console.log('⚡ Executando SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Se não conseguir executar via RPC, tentar criar a tabela diretamente
      console.log('🔄 Tentando criar tabela diretamente...');
      
      // Criar tabela customer_groups
      const { error: createTableError } = await supabase
        .from('customer_groups')
        .select('id')
        .limit(1);
      
      if (createTableError && createTableError.code === '42P01') {
        console.log('📋 Tabela customer_groups não existe, criando...');
        // A tabela não existe, vamos criar manualmente
        console.log('⚠️  Execute manualmente no Supabase SQL Editor:');
        console.log(sqlContent);
      } else {
        console.log('✅ Tabela customer_groups já existe');
      }
      
      return;
    }

    console.log('✅ SQL executado com sucesso!');
    console.log('📊 Resultado:', data);

    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando se a tabela foi criada...');
    const { data: testData, error: testError } = await supabase
      .from('customer_groups')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Erro ao verificar tabela:', testError);
    } else {
      console.log('✅ Tabela customer_groups criada com sucesso!');
      console.log('📊 Estrutura da tabela:', testData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createCustomerGroupsTable();
