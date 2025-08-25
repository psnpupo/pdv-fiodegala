#!/bin/bash

echo "🔧 Atualizando configuração do Nginx..."

# 1. Enviar nova configuração para VPS
echo "📤 Enviando configuração do Nginx..."
scp nginx-no-cache.conf root@31.97.86.88:/etc/nginx/sites-available/fiodegalasystem.com.br

# 2. Testar configuração
echo "🧪 Testando configuração..."
ssh root@31.97.86.88 "nginx -t"

# 3. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
ssh root@31.97.86.88 "systemctl reload nginx"

# 4. Verificar status
echo "📊 Verificando status..."
ssh root@31.97.86.88 "systemctl status nginx --no-pager -l"

echo "✅ Configuração do Nginx atualizada!"
echo "🌐 Acesse: https://fiodegalasystem.com.br"
echo ""
echo "💡 Agora o servidor irá forçar a atualização dos arquivos!"
