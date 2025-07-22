#!/bin/bash

echo "🚀 DEPLOY FIXED - PDV Fio de Gala"
echo "=================================="

# Configurações
VPS_IP="31.97.86.88"
DOMAIN="fiodegala.com.br"
BACKEND_PORT="4000"

echo "📦 Fazendo build da aplicação..."
npm run build

echo "🗜️ Criando arquivo de deploy..."
tar -czf pdv-deploy.tar.gz dist/ backend/ docker-compose.yml Dockerfile nginx.conf

echo "📤 Enviando para VPS..."
scp pdv-deploy.tar.gz root@$VPS_IP:/root/

echo "🔧 Executando deploy na VPS..."
ssh root@$VPS_IP << 'EOF'
echo "=== INICIANDO DEPLOY NA VPS ==="

# Parar containers existentes
echo "🛑 Parando containers..."
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker rmi $(docker images -q pdv-fiodegala-*) 2>/dev/null || true

# Extrair arquivo
echo "📂 Extraindo arquivos..."
cd /root
tar -xzf pdv-deploy.tar.gz

# NÃO ALTERAR MAIS O NGINX! Arquivo HTTPS fixo.
# echo "⚙️ Configurando nginx..."
# cat > /etc/nginx/sites-available/pdv-app << 'NGINX_EOF'
# (REMOVIDO)
# NGINX_EOF
# rm -f /etc/nginx/sites-enabled/*
# ln -sf /etc/nginx/sites-available/pdv-app /etc/nginx/sites-enabled/

# Criar diretório para frontend
mkdir -p /var/www/pdv-app

# Copiar arquivos do frontend
echo "📁 Copiando arquivos do frontend..."
cp -r dist/* /var/www/pdv-app/

# Configurar permissões
chown -R www-data:www-data /var/www/pdv-app
chmod -R 755 /var/www/pdv-app

# Testar e reiniciar nginx
echo "🔄 Reiniciando nginx..."
nginx -t && systemctl reload nginx

# Fazer build e iniciar containers
echo "🐳 Fazendo build dos containers..."
cd /root/backend
docker build -t pdv-fiodegala-backend .

cd /root
docker build -t pdv-fiodegala-frontend .

# Iniciar containers
echo "🚀 Iniciando containers..."
docker run -d --name pdv-backend -p 4000:4000 --restart unless-stopped pdv-fiodegala-backend
docker run -d --name pdv-frontend -p 3000:80 --restart unless-stopped pdv-fiodegala-frontend

# Verificar status
echo "✅ Verificando status..."
docker ps
echo "🌐 Testando aplicação..."
curl -I http://31.97.86.88 2>/dev/null || echo "Aplicação não responde ainda"

echo "=== DEPLOY CONCLUÍDO ==="
echo "🌐 Acesse: http://31.97.86.88"
echo "🔧 Backend: http://31.97.86.88:4000"
echo "📝 Logs: docker logs pdv-backend"
EOF

echo "✅ Deploy concluído!"
echo "🌐 Acesse: http://$VPS_IP"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "1. Corrija o DNS do fiodegala.com.br para apontar para $VPS_IP"
echo "2. Execute: ssh root@$VPS_IP 'certbot --nginx -d fiodegala.com.br'"
echo "3. Teste: https://fiodegala.com.br" 