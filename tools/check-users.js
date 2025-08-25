// Script para verificar usuários do sistema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('🔍 Verificando usuários do sistema...\n');
  
  try {
    // Listar todos os usuários
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log('📋 Estrutura da resposta:', JSON.stringify(data, null, 2));
    
    if (!data || !data.users || data.users.length === 0) {
      console.log('📝 Nenhum usuário encontrado no sistema.');
      console.log('\n💡 Para criar o usuário admin padrão:');
      console.log('   Email: admin@server.com');
      console.log('   Senha: (definir uma senha forte)');
      console.log('   Role: admin');
      return;
    }
    
    console.log(`📊 Total de usuários: ${data.users.length}\n`);
    
    // Listar cada usuário
    data.users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 Usuário:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.user_metadata?.name || 'Não definido'}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}`);
      console.log(`   Status: ${user.confirmed_at ? '✅ Confirmado' : '❌ Não confirmado'}`);
      console.log(`   Role: ${user.email === 'admin@server.com' ? 'admin' : 'user'}`);
      console.log('');
    });
    
    // Verificar se existe o admin padrão
    const adminUser = data.users.find(u => u.email === 'admin@server.com');
    if (!adminUser) {
      console.log('⚠️  Usuário admin padrão não encontrado!');
      console.log('\n💡 Para criar o usuário admin padrão:');
      console.log('   Email: admin@server.com');
      console.log('   Senha: (definir uma senha forte)');
      console.log('   Role: admin');
    } else {
      console.log('✅ Usuário admin padrão encontrado!');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar verificação
checkUsers();
