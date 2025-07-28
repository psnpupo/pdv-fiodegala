#!/bin/bash

# PDV Fio de Gala - Instalador Automático
# Versão: 1.0.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funções de log
print_header() {
    echo -e "${CYAN}"
    echo "========================================"
    echo "  PDV Fio de Gala - Instalador"
    echo "========================================"
    echo -e "${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo -e "${CYAN}📋 $1${NC}"
}

# Verificar se o comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Obter versão de um comando
get_version() {
    if command_exists "$1"; then
        "$1" --version 2>/dev/null | head -n1 || echo "versão desconhecida"
    else
        echo "não instalado"
    fi
}

# Função principal
main() {
    print_header
    
    print_info "Iniciando instalação do PDV Fio de Gala..."
    echo ""
    
    # Verificar dependências
    print_step "Verificando dependências do sistema..."
    
    if ! command_exists git; then
        print_error "Git não encontrado. Instale o Git primeiro:"
        echo "   Ubuntu/Debian: sudo apt install git"
        echo "   macOS: brew install git"
        echo "   Windows: https://git-scm.com/download/win"
        exit 1
    fi
    
    if ! command_exists node; then
        print_error "Node.js não encontrado. Instale o Node.js primeiro:"
        echo "   Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
        echo "   macOS: brew install node"
        echo "   Windows: https://nodejs.org/"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm não encontrado. Instale o npm primeiro."
        exit 1
    fi
    
    print_success "Git $(get_version git)"
    print_success "Node.js $(get_version node)"
    print_success "npm $(get_version npm)"
    echo ""
    
    # Criar diretório do projeto
    print_step "Preparando diretório do projeto..."
    PROJECT_DIR="$HOME/pdv-fiodegala"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Diretório $PROJECT_DIR já existe"
        read -p "Deseja sobrescrever? (s/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            rm -rf "$PROJECT_DIR"
        else
            print_info "Instalação cancelada"
            exit 0
        fi
    fi
    
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    print_success "Diretório criado: $PROJECT_DIR"
    echo ""
    
    # Baixar projeto
    print_step "Baixando projeto do GitHub..."
    if git clone https://github.com/psnpupo/pdv-fiodegala.git .; then
        print_success "Projeto baixado com sucesso!"
    else
        print_error "Erro ao baixar o projeto"
        exit 1
    fi
    echo ""
    
    # Verificar se os arquivos foram baixados
    if [ ! -f "package.json" ]; then
        print_error "Arquivos do projeto não encontrados"
        exit 1
    fi
    
    # Executar Setup Wizard
    print_step "Executando Setup Wizard..."
    echo ""
    print_info "O Setup Wizard irá:"
    print_info "1. Instalar dependências"
    print_info "2. Configurar Supabase Cloud"
    print_info "3. Executar scripts SQL"
    print_info "4. Testar conexão"
    print_info "5. Criar scripts de inicialização"
    echo ""
    
    if command_exists node; then
        node setup-wizard.js
    else
        print_error "Node.js não encontrado para executar o Setup Wizard"
        print_info "Execute manualmente: node setup-wizard.js"
    fi
    
    echo ""
    print_header
    print_success "Instalação concluída!"
    echo ""
    print_info "Para iniciar o sistema:"
    print_info "1. cd $PROJECT_DIR"
    print_info "2. ./iniciar-pdv.sh"
    print_info "3. Acesse: http://localhost:5173"
    echo ""
    print_info "Documentação disponível:"
    print_info "- GUIA-LOCAL.md"
    print_info "- GUIA-COMPLETO-SISTEMA.md"
    echo ""
}

# Executar função principal
main "$@" 