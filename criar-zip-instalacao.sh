#!/bin/bash

# Script para criar ZIP de instalação do PDV Fio de Gala
# Uso: ./criar-zip-instalacao.sh

echo "📦 Criando ZIP de instalação do PDV Fio de Gala..."
echo ""

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto pdv-fiodegala"
    exit 1
fi

# Nome do arquivo ZIP
ZIP_NAME="pdv-fiodegala-instalacao-$(date +%Y%m%d).zip"

echo "🗂️  Criando ZIP: $ZIP_NAME"
echo ""

# Criar ZIP excluindo arquivos desnecessários
zip -r "$ZIP_NAME" . \
    -x "node_modules/*" \
    -x "backend/node_modules/*" \
    -x ".git/*" \
    -x "*.log" \
    -x ".DS_Store" \
    -x "Thumbs.db" \
    -x "*.tmp" \
    -x "dist/*" \
    -x "build/*" \
    -x ".env" \
    -x "backend/.env"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ZIP criado com sucesso: $ZIP_NAME"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Transferir $ZIP_NAME para a nova máquina"
    echo "2. Extrair o ZIP na nova máquina"
    echo "3. Executar: npm install && cd backend && npm install"
    echo "4. Configurar backend/.env com credenciais do Supabase"
    echo "5. Iniciar: cd backend && npm start (Terminal 1)"
    echo "6. Iniciar: npm run dev (Terminal 2)"
    echo ""
    echo "🎯 O sistema funcionará com o mesmo banco de dados!"
else
    echo "❌ Erro ao criar ZIP"
    exit 1
fi 