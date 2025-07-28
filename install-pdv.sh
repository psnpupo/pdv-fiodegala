#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
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

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para obter versão
get_version() {
    local cmd="$1"
    if command_exists "$cmd"; then
        echo "$($cmd --version 2>/dev/null | head -n1)"
    else
        echo "não encontrado"
    fi
}

print_header

print_info "Iniciando verificação de dependências..."

# Verificar Git
print_info "Verificando Git..."
if command_exists git; then
    GIT_VERSION=$(get_version git)
    print_info "Git encontrado: $GIT_VERSION"
else
    print_error "Git não encontrado"
    echo ""
    echo "Para instalar o Git:"
    echo "  Ubuntu/Debian: sudo apt-get install git"
    echo "  macOS: brew install git"
    echo "  Ou baixe em: https://git-scm.com/"
    echo ""
    exit 1
fi

# Verificar Node.js
print_info "Verificando Node.js..."
if command_exists node; then
    NODE_VERSION=$(get_version node)
    print_info "Node.js encontrado: $NODE_VERSION"
else
    print_error "Node.js não encontrado"
    echo ""
    echo "Para instalar o Node.js:"
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  macOS: brew install node"
    echo "  Ou baixe em: https://nodejs.org/"
    echo ""
    exit 1
fi

# Verificar npm
print_info "Verificando npm..."
if command_exists npm; then
    NPM_VERSION=$(get_version npm)
    print_info "npm encontrado: $NPM_VERSION"
else
    print_error "npm não encontrado"
    echo "Node.js e npm vêm juntos. Reinstale o Node.js."
    exit 1
fi

echo ""
print_info "========================================"
print_info "Iniciando instalação..."
print_info "========================================"
echo ""

# Criar diretório do projeto
PROJECT_DIR="$HOME/pdv-fiodegala"
print_info "Criando diretório do projeto..."

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p "$PROJECT_DIR"
    print_info "Diretório criado: $PROJECT_DIR"
else
    print_info "Diretório já existe: $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Clonar projeto
if [ ! -d ".git" ]; then
    print_info "Baixando projeto do GitHub..."
    if git clone https://github.com/psnpupo/pdv-fiodegala.git .; then
        print_info "Projeto baixado com sucesso!"
    else
        print_error "Falha ao baixar o projeto"
        echo "Verifique sua conexão com a internet"
        exit 1
    fi
else
    print_info "Projeto já existe. Atualizando..."
    git pull origin main
fi

# Verificar se os arquivos foram baixados
if [ ! -f "package.json" ]; then
    print_error "Arquivos do projeto não encontrados"
    echo "Verifique se o download foi concluído corretamente"
    exit 1
fi

echo ""
print_info "========================================"
print_info "Instalando dependências..."
print_info "========================================"

# Instalar dependências do frontend
print_info "Instalando dependências do frontend..."
if npm install; then
    print_info "Dependências do frontend instaladas"
else
    print_error "Falha ao instalar dependências do frontend"
    exit 1
fi

# Instalar dependências do backend
print_info "Instalando dependências do backend..."
cd backend
if npm install; then
    print_info "Dependências do backend instaladas"
else
    print_error "Falha ao instalar dependências do backend"
    exit 1
fi
cd ..

echo ""
print_info "Dependências instaladas com sucesso!"

# Criar arquivo .env
if [ ! -f "backend/.env" ]; then
    echo ""
    print_info "Criando arquivo de configuração..."
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        print_info "Arquivo .env criado"
        echo ""
        print_warning "IMPORTANTE: Configure suas credenciais do Supabase no arquivo backend/.env"
    else
        print_warning "Arquivo env.example não encontrado"
    fi
else
    print_info "Arquivo .env já existe"
fi

echo ""
print_info "========================================"
print_info "Instalação concluída com sucesso!"
print_info "========================================"
echo ""
echo "Próximos passos:"
echo ""
echo "1. Configure o banco de dados:"
echo "   - Acesse: https://supabase.com"
echo "   - Crie uma conta e um novo projeto"
echo "   - Execute os scripts SQL no SQL Editor"
echo ""
echo "2. Configure as credenciais:"
echo "   - Edite o arquivo: backend/.env"
echo "   - Adicione sua URL e chave do Supabase"
echo ""
echo "3. Inicie o sistema:"
echo "   - Terminal 1: cd backend && npm start"
echo "   - Terminal 2: npm run dev"
echo ""
echo "4. Acesse o sistema:"
echo "   - Abra: http://localhost:5173"
echo "   - Siga o Setup Wizard"
echo ""
print_info "========================================"
echo "Documentação disponível:"
print_info "========================================"
echo "- INSTALACAO-CLIENTE.md"
echo "- GUIA-SUPABASE.md"
echo "- GUIA-COMPLETO-SISTEMA.md"
echo ""
echo "Diretório do projeto: $PROJECT_DIR"
echo "" 