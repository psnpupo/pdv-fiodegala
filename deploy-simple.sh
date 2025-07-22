#!/bin/bash

echo "🚀 DEPLOY SIMPLIFICADO - PDV FIO DE GALA"
echo "=========================================="

# Verificar se está como root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Execute como root: sudo $0"
   exit 1
fi

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências
echo "🔧 Instalando dependências..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    ufw \
    certbot \
    python3-certbot-nginx

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Adicionar usuário ao grupo docker
usermod -aG docker $SUDO_USER

# Iniciar Docker
systemctl start docker
systemctl enable docker

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9000/tcp

# Criar diretório do projeto
echo "📁 Preparando projeto..."
mkdir -p /opt/pdv-fiodegala
cd /opt/pdv-fiodegala

# Se estamos no /tmp, copiar arquivos
if [ -f "/tmp/docker-compose.yml" ]; then
    echo "📋 Copiando arquivos do projeto..."
    cp -r /tmp/* .
    rm -rf /tmp/pdv-fiodegala.tar.gz
fi

# Criar diretório SSL
mkdir -p ssl

# Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis..."
cat > .env << EOF
NODE_ENV=production
DOMAIN=fiodegalasystem.com.br
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
EOF

# Dar permissões
chown -R $SUDO_USER:$SUDO_USER /opt/pdv-fiodegala
chmod +x *.sh

# Construir e iniciar containers
echo "🔨 Construindo containers..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# Aguardar containers
echo "⏳ Aguardando containers..."
sleep 30

# Verificar status
echo "📊 Status dos containers:"
docker compose ps

# Configurar SSL
echo "🔐 Configurando SSL..."
if certbot certonly --webroot -w /opt/pdv-fiodegala/ssl -d fiodegalasystem.com.br -d www.fiodegalasystem.com.br --email admin@fiodegalasystem.com.br --agree-tos --non-interactive; then
    echo "✅ SSL configurado!"
    cp /etc/letsencrypt/live/fiodegalasystem.com.br/fullchain.pem ssl/
    cp /etc/letsencrypt/live/fiodegalasystem.com.br/privkey.pem ssl/
    docker compose restart nginx-proxy
else
    echo "⚠️ SSL não configurado automaticamente"
fi

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "🌐 URLs:"
echo "  - PDV: https://fiodegalasystem.com.br"
echo "  - Portainer: https://fiodegalasystem.com.br/portainer"
echo ""
echo "🛠️ Comandos:"
echo "  - Logs: docker compose logs -f"
echo "  - Status: docker compose ps"
echo "  - Reiniciar: docker compose restart"
echo "" 