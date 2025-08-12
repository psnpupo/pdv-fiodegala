// Script para executar o SQL e adicionar colunas na tabela customers
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configurações do Supabase
const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeAddCustomerFields() {
  console.log('🔧 Executando SQL para adicionar campos de empresa...\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(process.cwd(), 'tools', 'add-customer-fields.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Separar os comandos SQL
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 Encontrados ${sqlCommands.length} comandos SQL para executar\n`);

    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      if (sql.trim()) {
        console.log(`Executando comando ${i + 1}:`);
        console.log(`SQL: ${sql}`);
        
        try {
          // Como o Supabase não permite executar SQL diretamente via RPC,
          // vou testar inserindo um cliente com os novos campos
          if (sql.includes('ALTER TABLE customers ADD COLUMN')) {
            console.log('⚠️ Comando ALTER TABLE detectado - execute manualmente no painel do Supabase');
            console.log(`SQL: ${sql};`);
          } else if (sql.includes('SELECT')) {
            console.log('ℹ️ Comando SELECT - executando consulta...');
            const { data, error } = await supabase
              .from('customers')
              .select('*')
              .limit(1);
            
            if (error) {
              console.log('❌ Erro na consulta:', error);
            } else {
              console.log('✅ Consulta executada com sucesso');
              console.log('Estrutura atual:', Object.keys(data[0] || {}));
            }
          }
        } catch (err) {
          console.log('❌ Erro ao executar comando:', err.message);
        }
        console.log('');
      }
    }

    // Teste final: tentar inserir cliente com campos de empresa
    console.log('🧪 Testando inserção com campos de empresa...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .insert({
        name: 'Teste Empresa',
        phone: '11999999999',
        email: 'empresa@teste.com',
        category: 'Atacado',
        cnpj: '12345678901234',
        razao_social: 'Empresa Teste LTDA',
        inscricao_estadual: '123456789',
        nome_fantasia: 'Empresa Teste'
      })
      .select();

    if (testError) {
      console.log('❌ Erro no teste:', testError);
      console.log('\n📝 Para resolver, execute manualmente no painel do Supabase:');
      console.log('1. Acesse o painel do Supabase');
      console.log('2. Vá em SQL Editor');
      console.log('3. Execute o arquivo tools/add-customer-fields.sql');
    } else {
      console.log('✅ Teste bem-sucedido! Campos adicionados.');
      console.log('Dados inseridos:', testData);
      
      // Limpar dados de teste
      await supabase.from('customers').delete().eq('name', 'Teste Empresa');
      console.log('🧹 Dados de teste limpos');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

executeAddCustomerFields();
