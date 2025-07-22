# Deploy do PDV Fio de Gala - VPS Ubuntu 22.04

Este documento contém as instruções completas para instalar e configurar o sistema PDV Fio de Gala em uma VPS Ubuntu 22.04.

## 📋 Pré-requisitos

- VPS Ubuntu 22.04 LTS
- IP público: `31.97.86.88`
- Domínio configurado: `fiodegalasystem.com.br`
- Acesso SSH como root
- Mínimo 2GB RAM e 20GB disco

## 🚀 Instalação Automática

### Passo 1: Conectar na VPS
```bash
ssh root@31.97.86.88
```

### Passo 2: Fazer upload dos arquivos
```bash
# No seu computador local, compactar o projeto
tar -czf pdv-fiodegala.tar.gz --exclude=node_modules --exclude=.git .

# Fazer upload para a VPS
scp pdv-fiodegala.tar.gz root@31.97.86.88:/tmp/

# Na VPS, extrair os arquivos
cd /tmp
tar -xzf pdv-fiodegala.tar.gz
```

### Passo 3: Executar instalação
```bash
cd /tmp/pdv-fiodegala
chmod +x install.sh
./install.sh
```

## 🔧 Instalação Manual (Passo a Passo)

### 1. Atualizar Sistema
```bash
apt update && apt upgrade -y
```

### 2. Instalar Dependências
```bash
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
```

### 3. Instalar Docker
```bash
# Adicionar repositório
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Configurar usuário
usermod -aG docker $USER

# Iniciar Docker
systemctl start docker
systemctl enable docker
```

### 4. Configurar Firewall
```bash
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9000/tcp
```

### 5. Preparar Projeto
```bash
mkdir -p /opt/pdv-fiodegala
cd /opt/pdv-fiodegala

# Copiar arquivos do projeto
cp -r /tmp/pdv-fiodegala/* .

# Criar diretório SSL
mkdir -p ssl
```

### 6. Configurar Variáveis de Ambiente
```bash
cat > .env << EOF
# Configurações do PDV Fio de Gala
NODE_ENV=production
DOMAIN=fiodegalasystem.com.br
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
EOF
```

### 7. Construir e Iniciar Containers
```bash
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d
```

### 8. Configurar SSL
```bash
# Aguardar containers iniciarem
sleep 30

# Configurar SSL com Let's Encrypt
certbot certonly --webroot \
    -w /opt/pdv-fiodegala/ssl \
    -d fiodegalasystem.com.br \
    -d www.fiodegalasystem.com.br \
    --email admin@fiodegalasystem.com.br \
    --agree-tos \
    --non-interactive

# Copiar certificados
cp /etc/letsencrypt/live/fiodegalasystem.com.br/fullchain.pem ssl/
cp /etc/letsencrypt/live/fiodegalasystem.com.br/privkey.pem ssl/

# Reiniciar nginx-proxy
docker compose restart nginx-proxy
```

## 🌐 URLs de Acesso

Após a instalação, você terá acesso aos seguintes serviços:

- **PDV Principal**: https://fiodegalasystem.com.br
- **Portainer**: https://fiodegalasystem.com.br/portainer
- **API Backend**: https://fiodegalasystem.com.br/api

## 🛠️ Comandos Úteis

### Gerenciar Containers
```bash
# Ver status
docker compose ps

# Ver logs
docker compose logs -f

# Reiniciar todos
docker compose restart

# Parar todos
docker compose down

# Reconstruir e iniciar
docker compose up -d --build
```

### Backup e Restore
```bash
# Fazer backup
/opt/pdv-fiodegala/backup.sh

# Verificar monitoramento
/opt/pdv-fiodegala/monitor.sh
```

### Logs Específicos
```bash
# Logs do frontend
docker compose logs frontend

# Logs do backend
docker compose logs backend

# Logs do nginx
docker compose logs nginx-proxy

# Logs do portainer
docker compose logs portainer
```

## 🔒 Segurança

### Firewall Configurado
- Porta 22 (SSH): Aberta
- Porta 80 (HTTP): Aberta
- Porta 443 (HTTPS): Aberta
- Porta 9000 (Portainer): Aberta
- Todas as outras portas: Fechadas

### SSL/TLS
- Certificado Let's Encrypt configurado
- Renovação automática configurada
- Headers de segurança implementados

## 📊 Monitoramento

### Scripts Automáticos
- **Monitoramento**: Executado a cada 5 minutos
- **Backup**: Configurado para execução manual
- **SSL Renewal**: Executado diariamente às 12h

### Verificações
- Status dos containers
- Uso de disco e memória
- Disponibilidade dos serviços

## 🔧 Configurações Avançadas

### Variáveis de Ambiente
Edite o arquivo `.env` para configurar:
- URL do Supabase
- Chave anônima do Supabase
- Configurações de produção

### Nginx
O nginx está configurado como reverse proxy com:
- Compressão gzip
- Cache para arquivos estáticos
- Headers de segurança
- Redirecionamento HTTP para HTTPS

### Docker
- Containers configurados com restart automático
- Volumes persistentes para dados
- Rede isolada para comunicação entre serviços

## 🚨 Troubleshooting

### Problemas Comuns

1. **Containers não iniciam**
   ```bash
   docker compose logs
   docker compose down
   docker compose up -d
   ```

2. **SSL não funciona**
   ```bash
   certbot renew
   cp /etc/letsencrypt/live/fiodegalasystem.com.br/fullchain.pem ssl/
   cp /etc/letsencrypt/live/fiodegalasystem.com.br/privkey.pem ssl/
   docker compose restart nginx-proxy
   ```

3. **Portainer não acessível**
   ```bash
   docker compose logs portainer
   docker compose restart portainer
   ```

4. **Problemas de permissão**
   ```bash
   chown -R $USER:$USER /opt/pdv-fiodegala
   chmod +x /opt/pdv-fiodegala/*.sh
   ```

### Logs Importantes
- **Sistema**: `journalctl -u docker`
- **Nginx**: `/var/log/nginx/`
- **Docker**: `docker compose logs`

## 📞 Suporte

Para suporte técnico:
1. Verifique os logs primeiro
2. Execute o script de monitoramento
3. Consulte a documentação do Docker
4. Entre em contato com o administrador do sistema

## 📝 Notas

- O sistema é configurado para reiniciar automaticamente em caso de falha
- Backups devem ser feitos regularmente
- Monitore o uso de recursos da VPS
- Mantenha o sistema atualizado regularmente 