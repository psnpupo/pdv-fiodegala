#!/bin/bash
set -e

# CONFIGURAÇÕES
VPS_USER="root"
VPS_HOST="31.97.86.88"
VPS_FRONT_PATH="/var/www/pdv-app"
VPS_BACK_PATH="/var/www/backend"

echo "🧹 Limpando cache da VPS..."

# 1. Limpar cache do Nginx
ssh $VPS_USER@$VPS_HOST "systemctl reload nginx"
ssh $VPS_USER@$VPS_HOST "nginx -s reload" || true

# 2. Limpar cache do sistema
ssh $VPS_USER@$VPS_HOST "sync"
ssh $VPS_USER@$VPS_HOST "echo 3 > /proc/sys/vm/drop_caches" || true

# 3. Forçar atualização dos arquivos do frontend
ssh $VPS_USER@$VPS_HOST "rm -rf $VPS_FRONT_PATH/*"
scp -r dist/* $VPS_USER@$VPS_HOST:$VPS_FRONT_PATH/
ssh $VPS_USER@$VPS_HOST "chown -R www-data:www-data $VPS_FRONT_PATH"

# 4. Reiniciar o container do backend
ssh $VPS_USER@$VPS_HOST "docker restart pdv-backend"

# 5. Verificar status dos serviços
echo "📊 Verificando status dos serviços..."
ssh $VPS_USER@$VPS_HOST "systemctl status nginx --no-pager -l"
ssh $VPS_USER@$VPS_HOST "docker ps | grep pdv-backend"

# 6. Limpar cache do navegador (instruções)
echo ""
echo "🌐 Para limpar o cache do navegador:"
echo "   - Chrome/Edge: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)"
echo "   - Firefox: Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)"
echo "   - Ou abra as DevTools (F12) → Network → marque 'Disable cache'"

echo ""
echo "✅ Cache da VPS limpo com sucesso!"
echo "🌐 Acesse: https://fiodegalasystem.com.br"
