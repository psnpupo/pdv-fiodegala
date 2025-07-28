#!/bin/bash

# Script de Instalação do PDV Fio de Gala
# Versão: 1.0.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  PDV Fio de Gala - Instalador${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Verificar se está rodando como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Este script não deve ser executado como root"
        exit 1
    fi
}

# Verificar dependências do sistema
check_dependencies() {
    print_message "Verificando dependências do sistema..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado. Instalando..."
        install_nodejs
    else
        NODE_VERSION=$(node --version)
        print_message "Node.js encontrado: $NODE_VERSION"
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não está instalado"
        exit 1
    else
        NPM_VERSION=$(npm --version)
        print_message "npm encontrado: $NPM_VERSION"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        print_warning "Git não está instalado. Instalando..."
        install_git
    else
        GIT_VERSION=$(git --version)
        print_message "Git encontrado: $GIT_VERSION"
    fi
}

# Instalar Node.js
install_nodejs() {
    print_message "Instalando Node.js..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install node
        else
            print_error "Homebrew não está instalado. Instale o Homebrew primeiro."
            exit 1
        fi
    else
        print_error "Sistema operacional não suportado"
        exit 1
    fi
}

# Instalar Git
install_git() {
    print_message "Instalando Git..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y git
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install git
        else
            print_error "Homebrew não está instalado. Instale o Git manualmente."
            exit 1
        fi
    fi
}

# Criar diretório do projeto
create_project_directory() {
    print_message "Criando diretório do projeto..."
    
    PROJECT_DIR="$HOME/pdv-fiodegala"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Diretório $PROJECT_DIR já existe"
        read -p "Deseja sobrescrever? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_DIR"
        else
            print_message "Instalação cancelada"
            exit 0
        fi
    fi
    
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    print_message "Diretório criado: $PROJECT_DIR"
}

# Baixar código do projeto
download_project() {
    print_message "Baixando código do projeto..."
    
    # Se o script está sendo executado dentro do projeto, copiar arquivos
    if [ -f "package.json" ]; then
        print_message "Detectado projeto existente. Copiando arquivos..."
        cp -r . "$PROJECT_DIR/"
    else
        # Clonar do repositório (se disponível)
        print_message "Clonando repositório..."
        git clone https://github.com/seu-usuario/pdv-fiodegala.git .
    fi
    
    print_message "Código baixado com sucesso"
}

# Instalar dependências
install_dependencies() {
    print_message "Instalando dependências..."
    
    # Instalar dependências do frontend
    print_message "Instalando dependências do frontend..."
    npm install
    
    # Instalar dependências do backend
    print_message "Instalando dependências do backend..."
    cd backend
    npm install
    cd ..
    
    print_message "Dependências instaladas com sucesso"
}

# Configurar variáveis de ambiente
setup_environment() {
    print_message "Configurando variáveis de ambiente..."
    
    # Criar arquivo .env para o backend
    if [ ! -f "backend/.env" ]; then
        cp backend/env.example backend/.env
        print_message "Arquivo .env criado. Configure as variáveis necessárias."
    fi
    
    # Criar arquivo .env para o frontend (se necessário)
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        print_message "Arquivo .env do frontend criado."
    fi
}

# Configurar banco de dados
setup_database() {
    print_message "Configurando banco de dados..."
    
    print_warning "IMPORTANTE: Execute os seguintes scripts no SQL Editor do Supabase:"
    echo "1. tools/fix-peripherals-tables.sql"
    echo "2. tools/create-fiscal-tables.sql"
    echo "3. tools/create-scan-logs-table.sql"
    echo ""
    print_message "Após executar os scripts, configure as variáveis de ambiente no arquivo backend/.env"
}

# Criar scripts de inicialização
create_startup_scripts() {
    print_message "Criando scripts de inicialização..."
    
    # Script para iniciar o backend
    cat > start-backend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/backend"
npm start
EOF
    
    # Script para iniciar o frontend
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
npm run dev
EOF
    
    # Script para iniciar tudo
    cat > start-all.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "Iniciando PDV Fio de Gala..."

# Iniciar backend em background
echo "Iniciando backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 5

# Iniciar frontend
echo "Iniciando frontend..."
npm run dev

# Quando frontend parar, parar backend também
kill $BACKEND_PID
EOF
    
    # Tornar scripts executáveis
    chmod +x start-backend.sh start-frontend.sh start-all.sh
    
    print_message "Scripts de inicialização criados"
}

# Criar arquivo de configuração
create_config() {
    print_message "Criando arquivo de configuração..."
    
    cat > pdv-config.json << EOF
{
  "version": "1.0.0",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "project_directory": "$PROJECT_DIR",
  "backend_port": 4000,
  "frontend_port": 5173,
  "setup_completed": false
}
EOF
    
    print_message "Arquivo de configuração criado"
}

# Criar documentação local
create_documentation() {
    print_message "Criando documentação local..."
    
    cat > INSTALACAO.md << 'EOF'
# Guia de Instalação - PDV Fio de Gala

## Configuração Inicial

### 1. Configurar Banco de Dados
Execute os seguintes scripts no SQL Editor do Supabase:
- `tools/fix-peripherals-tables.sql`
- `tools/create-fiscal-tables.sql`
- `tools/create-scan-logs-table.sql`

### 2. Configurar Variáveis de Ambiente
Edite o arquivo `backend/.env` com suas configurações do Supabase.

### 3. Iniciar o Sistema
```bash
# Iniciar tudo
./start-all.sh

# Ou iniciar separadamente
./start-backend.sh  # Terminal 1
./start-frontend.sh # Terminal 2
```

### 4. Acessar o Sistema
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Primeiro Acesso
1. Acesse http://localhost:5173
2. Siga o Setup Wizard
3. Configure periféricos e fiscal
4. Cadastre produtos
5. Teste uma venda

## Suporte
- Documentação: GUIA-COMPLETO-SISTEMA.md
- Problemas: Verifique os logs no console
EOF
    
    print_message "Documentação local criada"
}

# Função principal
main() {
    print_header
    
    print_message "Iniciando instalação do PDV Fio de Gala..."
    
    # Verificações iniciais
    check_root
    check_dependencies
    
    # Instalação
    create_project_directory
    download_project
    install_dependencies
    setup_environment
    setup_database
    create_startup_scripts
    create_config
    create_documentation
    
    # Finalização
    print_message "Instalação concluída com sucesso!"
    echo ""
    print_message "Próximos passos:"
    echo "1. Configure o banco de dados no Supabase"
    echo "2. Configure as variáveis de ambiente"
    echo "3. Execute: ./start-all.sh"
    echo "4. Acesse: http://localhost:5173"
    echo ""
    print_message "Documentação disponível em: INSTALACAO.md"
    echo ""
    print_message "Diretório do projeto: $PROJECT_DIR"
}

# Executar função principal
main "$@" 