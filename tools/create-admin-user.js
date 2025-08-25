// Script para criar usuário admin
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovpfcyqudltassvckvxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGZjeXF1ZGx0YXNzdmNrdnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI3NzQ1MywiZXhwIjoyMDY1ODUzNDUzfQ.y9lCyCWHZJYCeSCvjZs1W23lR_Vu4Y8xNAA_RRSez3A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  console.log('👤 Criando usuário admin...\n');
  
  // Dados do usuário (você pode modificar aqui)
  const userData = {
    email: 'admin@fiodegala.com.br',
    password: 'Admin@2025!',
    name: 'Administrador Fio de Gala'
  };
  
  try {
    // Criar usuário no Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name
      }
    });
    
    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔑 Senha: ${userData.password}`);
    console.log(`👤 Nome: ${userData.name}`);
    console.log(`🆔 ID: ${authUser.user.id}`);
    console.log(`📅 Criado em: ${new Date(authUser.user.created_at).toLocaleString('pt-BR')}`);
    
    console.log('\n💡 Credenciais de acesso:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Senha: ${userData.password}`);
    console.log('\n🌐 Acesse: https://fiodegalasystem.com.br');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar criação
createAdminUser();
