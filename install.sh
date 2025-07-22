#!/bin/bash

# Script de instalação do PDV Fio de Gala na VPS Ubuntu 22.04
# Autor: Sistema PDV
# Data: $(date)

set -e

echo "=========================================="
echo "  INSTALAÇÃO DO PDV FIO DE GALA"
echo "  VPS Ubuntu 22.04 - $(hostname)"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root (sudo)"
fi

# Atualizar sistema
log "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
log "Instalando dependências básicas..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    unzip \
    wget \
    git \
    ufw \
    certbot \
    python3-certbot-nginx

# Adicionar repositório oficial do Docker
log "Adicionando repositório do Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
log "Instalando Docker..."
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
usermod -aG docker $SUDO_USER

# Iniciar e habilitar Docker
systemctl start docker
systemctl enable docker

# Verificar instalação do Docker
log "Verificando instalação do Docker..."
docker --version
docker compose version

# Configurar firewall
log "Configurando firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9000/tcp

# Criar diretório para o projeto
log "Criando diretório do projeto..."
mkdir -p /opt/pdv-fiodegala
cd /opt/pdv-fiodegala

# Clonar ou copiar o projeto (assumindo que está no diretório atual)
log "Copiando arquivos do projeto..."
if [ -d "/tmp/pdv-fiodegala" ]; then
    cp -r /tmp/pdv-fiodegala/* .
else
    # Se não estiver no /tmp, assumir que está no diretório atual
    cp -r ./* .
fi

# Criar diretório para SSL
mkdir -p ssl

# Configurar variáveis de ambiente
log "Configurando variáveis de ambiente..."
cat > .env << EOF
# Configurações do PDV Fio de Gala
NODE_ENV=production
DOMAIN=fiodegalasystem.com.br
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
EOF

# Dar permissões corretas
chown -R $SUDO_USER:$SUDO_USER /opt/pdv-fiodegala
chmod +x install.sh

# Construir e iniciar containers
log "Construindo e iniciando containers..."
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

# Aguardar containers iniciarem
log "Aguardando containers iniciarem..."
sleep 30

# Verificar status dos containers
log "Verificando status dos containers..."
docker compose ps

# Configurar SSL com Let's Encrypt (apenas se o domínio estiver apontado)
log "Configurando SSL com Let's Encrypt..."
if certbot certonly --webroot -w /opt/pdv-fiodegala/ssl -d fiodegalasystem.com.br -d www.fiodegalasystem.com.br --email admin@fiodegalasystem.com.br --agree-tos --non-interactive; then
    log "SSL configurado com sucesso!"
    
    # Copiar certificados para o diretório correto
    cp /etc/letsencrypt/live/fiodegalasystem.com.br/fullchain.pem ssl/
    cp /etc/letsencrypt/live/fiodegalasystem.com.br/privkey.pem ssl/
    
    # Reiniciar nginx-proxy
    docker compose restart nginx-proxy
else
    warn "Não foi possível configurar SSL automaticamente. Configure manualmente depois."
fi

# Configurar renovação automática do SSL
log "Configurando renovação automática do SSL..."
cat > /etc/cron.d/ssl-renewal << EOF
0 12 * * * root certbot renew --quiet && cp /etc/letsencrypt/live/fiodegalasystem.com.br/fullchain.pem /opt/pdv-fiodegala/ssl/ && cp /etc/letsencrypt/live/fiodegalasystem.com.br/privkey.pem /opt/pdv-fiodegala/ssl/ && docker compose -f /opt/pdv-fiodegala/docker-compose.yml restart nginx-proxy
EOF

# Criar script de backup
log "Criando script de backup..."
cat > /opt/pdv-fiodegala/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/pdv"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup dos volumes do Docker
docker run --rm -v pdv-fiodegala_portainer_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/portainer_data_$DATE.tar.gz -C /data .

# Backup dos logs
tar czf $BACKUP_DIR/logs_$DATE.tar.gz /var/log/nginx/ /opt/pdv-fiodegala/server.log

echo "Backup criado: $BACKUP_DIR/backup_$DATE.tar.gz"
EOF

chmod +x /opt/pdv-fiodegala/backup.sh

# Criar script de monitoramento
log "Criando script de monitoramento..."
cat > /opt/pdv-fiodegala/monitor.sh << 'EOF'
#!/bin/bash
# Verificar se os containers estão rodando
if ! docker compose ps | grep -q "Up"; then
    echo "ALERTA: Containers não estão rodando!"
    docker compose up -d
fi

# Verificar uso de disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "ALERTA: Uso de disco acima de 80%: ${DISK_USAGE}%"
fi

# Verificar uso de memória
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    echo "ALERTA: Uso de memória acima de 80%: ${MEM_USAGE}%"
fi
EOF

chmod +x /opt/pdv-fiodegala/monitor.sh

# Configurar cron para monitoramento
echo "*/5 * * * * root /opt/pdv-fiodegala/monitor.sh" >> /etc/cron.d/pdv-monitoring

# Mostrar informações finais
echo ""
echo "=========================================="
echo "  INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=========================================="
echo ""
echo "URLs de acesso:"
echo "  - PDV Principal: https://fiodegalasystem.com.br"
echo "  - Portainer: https://fiodegalasystem.com.br/portainer"
echo "  - API Backend: https://fiodegalasystem.com.br/api"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs: docker compose logs -f"
echo "  - Reiniciar: docker compose restart"
echo "  - Parar: docker compose down"
echo "  - Backup: /opt/pdv-fiodegala/backup.sh"
echo ""
echo "Próximos passos:"
echo "1. Configure as variáveis de ambiente no arquivo .env"
echo "2. Acesse o Portainer para gerenciar os containers"
echo "3. Configure o backup automático se necessário"
echo "4. Monitore os logs regularmente"
echo ""
echo "Logs importantes:"
echo "  - Docker: docker compose logs"
echo "  - Nginx: docker compose logs nginx-proxy"
echo "  - Sistema: journalctl -u docker"
echo ""

log "Instalação concluída! O sistema está pronto para uso." 