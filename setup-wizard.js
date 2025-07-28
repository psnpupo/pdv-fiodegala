#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const https = require('https');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(`🚀 ${message}`, 'bright');
  console.log('='.repeat(60));
}

function logStep(step, message) {
  log(`\n📋 ${step}: ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Interface de leitura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Verificar dependências
function checkDependencies() {
  logStep('1', 'Verificando dependências do sistema...');
  
  try {
    // Verificar Node.js
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    logSuccess(`Node.js ${nodeVersion} encontrado`);
    
    // Verificar npm
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm ${npmVersion} encontrado`);
    
    // Verificar Git
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    logSuccess(`${gitVersion} encontrado`);
    
    return true;
  } catch (error) {
    logError('Dependências não encontradas. Instale Node.js, npm e Git primeiro.');
    return false;
  }
}

// Instalar dependências
function installDependencies() {
  logStep('2', 'Instalando dependências do projeto...');
  
  try {
    logInfo('Instalando dependências do frontend...');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependências do frontend instaladas');
    
    logInfo('Instalando dependências do backend...');
    execSync('cd backend && npm install', { stdio: 'inherit' });
    logSuccess('Dependências do backend instaladas');
    
    return true;
  } catch (error) {
    logError('Erro ao instalar dependências');
    return false;
  }
}

// Configurar Supabase
async function setupSupabase() {
  logStep('3', 'Configurando Supabase Cloud...');
  
  logInfo('Para configurar o Supabase, siga estes passos:');
  logInfo('1. Acesse: https://supabase.com');
  logInfo('2. Crie uma conta gratuita');
  logInfo('3. Crie um novo projeto');
  logInfo('4. Aguarde a criação do projeto');
  logInfo('5. Vá em Settings > API');
  logInfo('6. Copie a URL e a anon key');
  
  const supabaseUrl = await question('\n🔗 URL do Supabase: ');
  const supabaseKey = await question('🔑 Chave anônima do Supabase: ');
  
  if (!supabaseUrl || !supabaseKey) {
    logError('URL e chave do Supabase são obrigatórias');
    return false;
  }
  
  // Criar arquivo .env
  const envContent = `SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseKey}
PORT=4000
NODE_ENV=development`;

  try {
    fs.writeFileSync('backend/.env', envContent);
    logSuccess('Arquivo .env criado com sucesso');
    return true;
  } catch (error) {
    logError('Erro ao criar arquivo .env');
    return false;
  }
}

// Executar scripts SQL
async function executeSQLScripts() {
  logStep('4', 'Configurando banco de dados...');
  
  logInfo('Agora você precisa executar os scripts SQL no Supabase:');
  logInfo('1. Acesse seu projeto no Supabase');
  logInfo('2. Vá em SQL Editor');
  logInfo('3. Execute os seguintes scripts em ordem:');
  
  const scripts = [
    'tools/create-peripherals-tables.sql',
    'tools/create-fiscal-tables.sql', 
    'tools/create-scan-logs-table.sql',
    'tools/fix-peripherals-tables.sql'
  ];
  
  for (const script of scripts) {
    if (fs.existsSync(script)) {
      logInfo(`\n📄 ${script}:`);
      const content = fs.readFileSync(script, 'utf8');
      console.log(content);
      logInfo('Copie e cole este script no SQL Editor do Supabase');
    }
  }
  
  const confirm = await question('\n✅ Scripts SQL executados? (s/n): ');
  return confirm.toLowerCase() === 's';
}

// Testar conexão
function testConnection() {
  logStep('5', 'Testando conexão com o banco...');
  
  try {
    // Criar arquivo de teste temporário
    const testFile = `
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('peripheral_configs').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return false;
  }
}

testConnection();
`;
    
    fs.writeFileSync('test-connection.js', testFile);
    execSync('node test-connection.js', { stdio: 'inherit' });
    fs.unlinkSync('test-connection.js');
    
    return true;
  } catch (error) {
    logError('Erro ao testar conexão');
    return false;
  }
}

// Criar scripts de inicialização
function createStartupScripts() {
  logStep('6', 'Criando scripts de inicialização...');
  
  try {
    // Script para Windows
    const windowsScript = `@echo off
echo ========================================
echo   PDV Fio de Gala - Iniciando...
echo ========================================
echo.

echo Iniciando backend...
start "Backend" cmd /k "cd backend && npm start"

echo Aguardando backend iniciar...
timeout /t 3 /nobreak >nul

echo Iniciando frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Sistema iniciado com sucesso!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:4000
echo.
pause
`;
    
    fs.writeFileSync('iniciar-pdv.bat', windowsScript);
    logSuccess('Script Windows criado: iniciar-pdv.bat');
    
    // Script para Linux/macOS
    const unixScript = `#!/bin/bash
echo "========================================"
echo "  PDV Fio de Gala - Iniciando..."
echo "========================================"
echo ""

echo "Iniciando backend..."
gnome-terminal -- bash -c "cd backend && npm start; exec bash" 2>/dev/null || \
xterm -e "cd backend && npm start; bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/backend && npm start"' 2>/dev/null || \
echo "Iniciando backend em background..."

sleep 3

echo "Iniciando frontend..."
gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -e "npm run dev; bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"' 2>/dev/null || \
echo "Iniciando frontend em background..."

echo ""
echo "========================================"
echo "  Sistema iniciado com sucesso!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:4000"
echo ""
`;
    
    fs.writeFileSync('iniciar-pdv.sh', unixScript);
    execSync('chmod +x iniciar-pdv.sh');
    logSuccess('Script Unix criado: iniciar-pdv.sh');
    
    return true;
  } catch (error) {
    logError('Erro ao criar scripts de inicialização');
    return false;
  }
}

// Criar documentação local
function createLocalDocs() {
  logStep('7', 'Criando documentação local...');
  
  const docsContent = `# PDV Fio de Gala - Guia Local

## 🚀 Como Iniciar o Sistema

### Windows:
\`\`\`bash
iniciar-pdv.bat
\`\`\`

### Linux/macOS:
\`\`\`bash
./iniciar-pdv.sh
\`\`\`

### Manual:
\`\`\`bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
npm run dev
\`\`\`

## 🌐 Acessos

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:4000

## 📋 Primeiro Acesso

1. Acesse http://localhost:5173
2. Siga o Setup Wizard
3. Configure os dados da empresa
4. Configure periféricos (impressora, scanner)
5. Configure sistema fiscal
6. Crie usuário administrador

## 🔧 Configurações

- **Banco de dados:** Supabase Cloud
- **Arquivo de configuração:** backend/.env
- **Logs:** backend/server.log

## 📞 Suporte

- Documentação completa: GUIA-COMPLETO-SISTEMA.md
- Instalação: GUIA-INSTALACAO.md
- Periféricos: GUIA-PERIFERICOS.md
- Sistema Fiscal: GUIA-SISTEMA-FISCAL.md

## 🆘 Solução de Problemas

### Erro de conexão com banco:
1. Verifique o arquivo backend/.env
2. Confirme as credenciais do Supabase
3. Execute: node test-connection.js

### Erro de periféricos:
1. Verifique se os dispositivos estão conectados
2. Configure as portas corretas
3. Consulte GUIA-PERIFERICOS.md

### Erro de sistema fiscal:
1. Configure CNPJ e inscrição estadual
2. Verifique certificados digitais
3. Consulte GUIA-SISTEMA-FISCAL.md
`;

  try {
    fs.writeFileSync('GUIA-LOCAL.md', docsContent);
    logSuccess('Documentação local criada: GUIA-LOCAL.md');
    return true;
  } catch (error) {
    logError('Erro ao criar documentação');
    return false;
  }
}

// Função principal
async function main() {
  logHeader('PDV Fio de Gala - Setup Wizard');
  logInfo('Este assistente irá configurar todo o sistema automaticamente');
  
  // Verificar se estamos no diretório correto
  if (!fs.existsSync('package.json')) {
    logError('Execute este script no diretório raiz do projeto');
    process.exit(1);
  }
  
  let success = true;
  
  // 1. Verificar dependências
  if (!checkDependencies()) {
    success = false;
  }
  
  // 2. Instalar dependências
  if (success && !installDependencies()) {
    success = false;
  }
  
  // 3. Configurar Supabase
  if (success && !(await setupSupabase())) {
    success = false;
  }
  
  // 4. Executar scripts SQL
  if (success && !(await executeSQLScripts())) {
    success = false;
  }
  
  // 5. Testar conexão
  if (success && !testConnection()) {
    success = false;
  }
  
  // 6. Criar scripts de inicialização
  if (success && !createStartupScripts()) {
    success = false;
  }
  
  // 7. Criar documentação
  if (success && !createLocalDocs()) {
    success = false;
  }
  
  // Resultado final
  if (success) {
    logHeader('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    logSuccess('O PDV Fio de Gala está pronto para uso!');
    logInfo('\n📋 Próximos passos:');
    logInfo('1. Execute o script de inicialização:');
    logInfo('   - Windows: iniciar-pdv.bat');
    logInfo('   - Linux/macOS: ./iniciar-pdv.sh');
    logInfo('2. Acesse: http://localhost:5173');
    logInfo('3. Siga o Setup Wizard do sistema');
    logInfo('4. Configure periféricos e sistema fiscal');
    logInfo('\n📚 Documentação disponível:');
    logInfo('- GUIA-LOCAL.md (este diretório)');
    logInfo('- GUIA-COMPLETO-SISTEMA.md');
    logInfo('- GUIA-INSTALACAO.md');
  } else {
    logHeader('❌ CONFIGURAÇÃO FALHOU');
    logError('Algumas etapas falharam. Verifique os erros acima.');
    logInfo('Consulte a documentação para solução de problemas.');
  }
  
  rl.close();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 