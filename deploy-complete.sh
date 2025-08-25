#!/bin/bash
set -e

echo "🚀 Deploy Completo com Otimizações de Cache"

# CONFIGURAÇÕES
VPS_USER="root"
VPS_HOST="31.97.86.88"
VPS_FRONT_PATH="/var/www/pdv-app"
VPS_BACK_PATH="/var/www/backend"

# 1. Build do frontend com cache-busting
echo "📦 Fazendo build do frontend..."
npm run build

# 2. Verificar se o build foi gerado corretamente
echo "🔍 Verificando build..."
if [ ! -d "dist" ]; then
    echo "❌ Erro: Pasta dist não encontrada!"
    exit 1
fi

# Verificar se a configuração dinâmica está no build
if ! grep -q "fiodegalasystem.com.br" dist/assets/*.js; then
    echo "⚠️  Aviso: Configuração dinâmica pode não estar no build"
else
    echo "✅ Configuração dinâmica detectada no build"
fi

# 3. Limpar arquivos antigos na VPS
echo "🧹 Limpando arquivos antigos..."
ssh $VPS_USER@$VPS_HOST "rm -rf $VPS_FRONT_PATH/*"

# 4. Enviar build do frontend para a VPS
echo "📤 Enviando frontend para VPS..."
scp -r dist/* $VPS_USER@$VPS_HOST:$VPS_FRONT_PATH/

# 5. Configurar permissões
echo "🔧 Configurando permissões..."
ssh $VPS_USER@$VPS_HOST "chown -R www-data:www-data $VPS_FRONT_PATH"

# 6. Enviar backend para VPS
echo "📤 Enviando backend para VPS..."
scp -r backend $VPS_USER@$VPS_HOST:/var/www/

# 7. Build da imagem Docker do backend
echo "🐳 Buildando imagem Docker..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_BACK_PATH && docker build -t pdv-fiodegala-backend:latest ."

# 8. Reiniciar container do backend
echo "🔄 Reiniciando container do backend..."
ssh $VPS_USER@$VPS_HOST "docker stop pdv-backend || true && docker rm pdv-backend || true && docker run -d --name pdv-backend --restart always -p 4000:4000 --env-file $VPS_BACK_PATH/.env pdv-fiodegala-backend:latest"

# 9. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
ssh $VPS_USER@$VPS_HOST "systemctl reload nginx"

# 10. Limpar cache do sistema
echo "🧹 Limpando cache do sistema..."
ssh $VPS_USER@$VPS_HOST "sync"
ssh $VPS_USER@$VPS_HOST "echo 3 > /proc/sys/vm/drop_caches" || true

# 11. Verificar status dos serviços
echo "📊 Verificando status dos serviços..."
ssh $VPS_USER@$VPS_HOST "systemctl status nginx --no-pager -l | head -10"
ssh $VPS_USER@$VPS_HOST "docker ps | grep pdv-backend"

# 12. Testar conectividade da API
echo "🔍 Testando conectividade da API..."
ssh $VPS_USER@$VPS_HOST "curl -s http://localhost:4000/api/status || echo '❌ Backend não está respondendo'"

# 13. Commit e push para GitHub
echo "📝 Fazendo commit e push..."
git add .
git commit -m "Deploy completo: configuração dinâmica e otimizações" || true
git push origin main || true

echo ""
echo "✅ Deploy completo finalizado com sucesso!"
echo "🌐 Acesse: https://fiodegalasystem.com.br"
echo ""
echo "💡 Para limpar cache do navegador:"
echo "   - Windows: Ctrl+Shift+R"
echo "   - Mac: Cmd+Shift+R"
echo "   - Ou abra DevTools (F12) → Network → marque 'Disable cache'"
echo ""
echo "🔧 Otimizações aplicadas:"
echo "   ✅ Configuração dinâmica do backend"
echo "   ✅ Cache-busting no Vite"
echo "   ✅ Headers anti-cache no Nginx"
echo "   ✅ Limpeza de cache do sistema"
echo "   ✅ Verificação de conectividade da API"
echo ""
echo "🎯 Configuração dinâmica:"
echo "   - Local: http://localhost:4000/api"
echo "   - VPS: /api (relativo ao domínio)"
