#!/bin/bash

echo "🔄 Forçando atualização dos arquivos..."

# 1. Fazer novo build com cache-busting
npm run build

# 2. Enviar arquivos para VPS
echo "📤 Enviando arquivos para VPS..."
scp -r dist/* root@31.97.86.88:/var/www/pdv-app/

# 3. Configurar permissões
echo "🔧 Configurando permissões..."
ssh root@31.97.86.88 "chown -R www-data:www-data /var/www/pdv-app"

# 4. Reiniciar serviços
echo "🔄 Reiniciando serviços..."
ssh root@31.97.86.88 "systemctl reload nginx"
ssh root@31.97.86.88 "docker restart pdv-backend"

echo "✅ Atualização forçada concluída!"
echo "🌐 Acesse: https://fiodegalasystem.com.br"
echo ""
echo "💡 Para limpar cache do navegador:"
echo "   - Windows: Ctrl+Shift+R"
echo "   - Mac: Cmd+Shift+R"
echo "   - Ou abra DevTools (F12) → Network → marque 'Disable cache'"
