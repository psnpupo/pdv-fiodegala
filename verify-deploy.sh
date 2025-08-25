#!/bin/bash

echo "🔍 Verificação Pós-Deploy - PDV Fio de Gala"
echo "=============================================="

# CONFIGURAÇÕES
VPS_USER="root"
VPS_HOST="31.97.86.88"
DOMAIN="fiodegalasystem.com.br"

echo ""
echo "1️⃣ Verificando conectividade com a VPS..."
if ping -c 1 $VPS_HOST > /dev/null 2>&1; then
    echo "✅ VPS acessível"
else
    echo "❌ VPS não acessível"
    exit 1
fi

echo ""
echo "2️⃣ Verificando serviços na VPS..."

# Verificar Nginx
echo "📋 Status do Nginx:"
ssh $VPS_USER@$VPS_HOST "systemctl is-active nginx" 2>/dev/null || echo "❌ Nginx não está rodando"

# Verificar Docker
echo "📋 Status do Docker:"
ssh $VPS_USER@$VPS_HOST "docker ps | grep pdv-backend" 2>/dev/null || echo "❌ Container do backend não está rodando"

echo ""
echo "3️⃣ Testando conectividade da API..."

# Testar API localmente na VPS
echo "🔍 Testando API na VPS (localhost:4000):"
API_RESPONSE=$(ssh $VPS_USER@$VPS_HOST "curl -s http://localhost:4000/api/status" 2>/dev/null)
if [ ! -z "$API_RESPONSE" ]; then
    echo "✅ Backend respondendo: $API_RESPONSE"
else
    echo "❌ Backend não está respondendo"
fi

echo ""
echo "4️⃣ Testando acesso via domínio..."

# Testar frontend
echo "🔍 Testando frontend (https://$DOMAIN):"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend acessível (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend não acessível (HTTP $FRONTEND_STATUS)"
fi

# Testar API via domínio
echo "🔍 Testando API via domínio (https://$DOMAIN/api/status):"
API_DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/status" 2>/dev/null)
if [ "$API_DOMAIN_STATUS" = "200" ]; then
    echo "✅ API via domínio acessível (HTTP $API_DOMAIN_STATUS)"
else
    echo "❌ API via domínio não acessível (HTTP $API_DOMAIN_STATUS)"
fi

echo ""
echo "5️⃣ Verificando configuração dinâmica..."

# Verificar se o build tem a configuração dinâmica
echo "🔍 Verificando build na VPS:"
ssh $VPS_USER@$VPS_HOST "grep -q 'fiodegalasystem.com.br' /var/www/pdv-app/assets/*.js 2>/dev/null && echo '✅ Configuração dinâmica encontrada' || echo '❌ Configuração dinâmica não encontrada'"

echo ""
echo "6️⃣ Verificando logs..."

# Verificar logs do Nginx
echo "📋 Últimas linhas do log do Nginx:"
ssh $VPS_USER@$VPS_HOST "tail -5 /var/log/nginx/pdv-app.access.log 2>/dev/null || echo 'Log não encontrado'"

echo ""
echo "📋 Últimas linhas do log de erro do Nginx:"
ssh $VPS_USER@$VPS_HOST "tail -5 /var/log/nginx/pdv-app.error.log 2>/dev/null || echo 'Log não encontrado'"

echo ""
echo "7️⃣ Resumo da verificação:"
echo "🌐 Domínio: https://$DOMAIN"
echo "🔧 Backend: https://$DOMAIN/api"
echo "📊 Status: $([ "$FRONTEND_STATUS" = "200" ] && echo "✅ Online" || echo "❌ Offline")"

echo ""
echo "💡 Próximos passos:"
echo "   1. Acesse https://$DOMAIN no navegador"
echo "   2. Abra o console (F12) e verifique os logs"
echo "   3. Teste a funcionalidade de produtos recentes no POS"
echo "   4. Verifique se não há erros de 'Failed to fetch'"

echo ""
echo "🎯 Configuração dinâmica ativa:"
echo "   - Sistema detecta automaticamente se está em localhost ou VPS"
echo "   - URLs do backend ajustadas dinamicamente"
echo "   - Funciona independentemente do servidor local"
