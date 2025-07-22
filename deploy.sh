#!/bin/bash

# Script de Deploy Simplificado - PDV Fio de Gala
# Para executar na VPS Ubuntu 22.04

echo "🚀 Iniciando deploy do PDV Fio de Gala..."
echo "IP: 31.97.86.88"
echo "Domínio: fiodegalasystem.com.br"
echo ""

# Verificar se está como root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Este script deve ser executado como root (sudo)"
   exit 1
fi

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Adicionar usuário ao grupo docker
usermod -aG docker $SUDO_USER

# Instalar Docker Compose
echo "📋 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

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
echo "📁 Criando diretório do projeto..."
mkdir -p /opt/pdv-fiodegala
cd /opt/pdv-fiodegala

# Se os arquivos estiverem no diretório atual, copiar
if [ -f "docker-compose.yml" ]; then
    echo "📋 Arquivos do projeto encontrados, copiando..."
    cp -r ./* /opt/pdv-fiodegala/
else
    echo "❌ Arquivos do projeto não encontrados!"
    echo "Por favor, certifique-se de que os arquivos estão no diretório atual."
    exit 1
fi

# Criar diretório SSL
mkdir -p ssl

# Configurar variáveis de ambiente básicas
echo "⚙️ Configurando variáveis de ambiente..."
cat > .env << EOF
# Configurações do PDV Fio de Gala
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
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 30

# Verificar status
echo "📊 Status dos containers:"
docker compose ps

# Instalar certbot para SSL
echo "🔒 Instalando Certbot para SSL..."
apt install -y certbot python3-certbot-nginx

# Tentar configurar SSL
echo "🔐 Configurando SSL..."
if certbot certonly --webroot -w /opt/pdv-fiodegala/ssl -d fiodegalasystem.com.br -d www.fiodegalasystem.com.br --email admin@fiodegalasystem.com.br --agree-tos --non-interactive; then
    echo "✅ SSL configurado com sucesso!"
    cp /etc/letsencrypt/live/fiodegalasystem.com.br/fullchain.pem ssl/
    cp /etc/letsencrypt/live/fiodegalasystem.com.br/privkey.pem ssl/
    docker compose restart nginx-proxy
else
    echo "⚠️ Não foi possível configurar SSL automaticamente."
    echo "Configure manualmente depois."
fi

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "🌐 URLs de acesso:"
echo "  - PDV: https://fiodegalasystem.com.br"
echo "  - Portainer: https://fiodegalasystem.com.br/portainer"
echo "  - API: https://fiodegalasystem.com.br/api"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis do Supabase no arquivo .env"
echo "2. Acesse o Portainer para gerenciar os containers"
echo "3. Teste o sistema"
echo ""
echo "🛠️ Comandos úteis:"
echo "  - Ver logs: docker compose logs -f"
echo "  - Reiniciar: docker compose restart"
echo "  - Status: docker compose ps"
echo "" 