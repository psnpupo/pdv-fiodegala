# 🚀 Guia de Deploy - PDV Fio de Gala

## 📋 Informações da VPS
- **IP**: 31.97.86.88
- **Sistema**: Ubuntu 22.04 LTS
- **Domínio**: fiodegalasystem.com.br

## 🎯 Método Rápido (Recomendado)

### Passo 1: Preparar arquivos localmente
```bash
# No seu computador, compactar o projeto
tar -czf pdv-fiodegala.tar.gz --exclude=node_modules --exclude=.git .
```

### Passo 2: Fazer upload para a VPS
```bash
# Upload do arquivo compactado
scp pdv-fiodegala.tar.gz root@31.97.86.88:/tmp/
```

### Passo 3: Conectar na VPS e executar
```bash
# Conectar na VPS
ssh root@31.97.86.88

# Extrair arquivos
cd /tmp
tar -xzf pdv-fiodegala.tar.gz
cd pdv-fiodegala

# Executar deploy
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Método Manual (Passo a Passo)

### 1. Conectar na VPS
```bash
ssh root@31.97.86.88
```

### 2. Atualizar sistema
```bash
apt update && apt upgrade -y
```

### 3. Instalar Docker
```bash
# Instalar dependências
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar repositório Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Configurar usuário
usermod -aG docker $USER

# Iniciar Docker
systemctl start docker
systemctl enable docker
```

### 4. Configurar firewall
```bash
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9000/tcp
```

### 5. Preparar projeto
```bash
# Criar diretório
mkdir -p /opt/pdv-fiodegala
cd /opt/pdv-fiodegala

# Copiar arquivos (se estiverem em /tmp)
cp -r /tmp/pdv-fiodegala/* .

# Criar diretório SSL
mkdir -p ssl
```

### 6. Configurar variáveis de ambiente
```bash
# Editar arquivo .env
nano .env
```

Conteúdo do arquivo `.env`:
```env
# Configurações do PDV Fio de Gala
NODE_ENV=production
DOMAIN=fiodegalasystem.com.br
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 7. Construir e iniciar containers
```bash
# Construir containers
docker compose build --no-cache

# Iniciar containers
docker compose up -d

# Verificar status
docker compose ps
```

### 8. Configurar SSL
```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Configurar SSL
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

# Reiniciar nginx
docker compose restart nginx-proxy
```

## 🌐 URLs de Acesso

Após o deploy, você terá acesso a:

- **PDV Principal**: https://fiodegalasystem.com.br
- **Portainer**: https://fiodegalasystem.com.br/portainer
- **API Backend**: https://fiodegalasystem.com.br/api

## 🛠️ Comandos de Gerenciamento

### Ver status dos containers
```bash
cd /opt/pdv-fiodegala
docker compose ps
```

### Ver logs
```bash
# Todos os logs
docker compose logs -f

# Logs específicos
docker compose logs frontend
docker compose logs backend
docker compose logs nginx-proxy
```

### Reiniciar serviços
```bash
# Reiniciar todos
docker compose restart

# Reiniciar específico
docker compose restart backend
```

### Parar/Iniciar
```bash
# Parar todos
docker compose down

# Iniciar todos
docker compose up -d
```

### Backup
```bash
# Executar backup
/opt/pdv-fiodegala/backup.sh

# Verificar monitoramento
/opt/pdv-fiodegala/monitor.sh
```

## 🔧 Configurações Importantes

### 1. Variáveis do Supabase
Edite o arquivo `.env` e configure:
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase

### 2. Configurações do Backend
Edite o arquivo `backend/.env`:
```env
NODE_ENV=production
PORT=4000
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
CORS_ORIGIN=https://fiodegalasystem.com.br
```

### 3. Renovação automática do SSL
O SSL será renovado automaticamente, mas você pode verificar:
```bash
certbot renew --dry-run
```

## 🚨 Troubleshooting

### Problema: Containers não iniciam
```bash
# Ver logs de erro
docker compose logs

# Reconstruir containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Problema: SSL não funciona
```bash
# Verificar certificados
ls -la /etc/letsencrypt/live/fiodegalasystem.com.br/

# Renovar certificados
certbot renew

# Copiar certificados novamente
cp /etc/letsencrypt/live/fiodegalasystem.com.br/fullchain.pem ssl/
cp /etc/letsencrypt/live/fiodegalasystem.com.br/privkey.pem ssl/

# Reiniciar nginx
docker compose restart nginx-proxy
```

### Problema: Portainer não acessível
```bash
# Verificar logs do portainer
docker compose logs portainer

# Reiniciar portainer
docker compose restart portainer
```

### Problema: API não responde
```bash
# Verificar logs do backend
docker compose logs backend

# Verificar se as variáveis estão corretas
cat .env
cat backend/.env
```

## 📊 Monitoramento

### Verificar uso de recursos
```bash
# Uso de disco
df -h

# Uso de memória
free -h

# Status dos containers
docker stats
```

### Logs do sistema
```bash
# Logs do Docker
journalctl -u docker

# Logs do nginx
docker compose logs nginx-proxy
```

## 🔒 Segurança

### Firewall configurado
- ✅ SSH (porta 22)
- ✅ HTTP (porta 80)
- ✅ HTTPS (porta 443)
- ✅ Portainer (porta 9000)
- ❌ Todas as outras portas fechadas

### SSL/TLS
- ✅ Certificado Let's Encrypt
- ✅ Renovação automática
- ✅ Headers de segurança

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs primeiro**
2. **Execute o script de monitoramento**
3. **Consulte a documentação do Docker**
4. **Entre em contato com o administrador**

## 🎉 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Configure as variáveis do Supabase
2. ✅ Teste o sistema no navegador
3. ✅ Configure usuários no sistema
4. ✅ Faça backup inicial
5. ✅ Configure monitoramento contínuo

---

**🎯 Sistema pronto para uso!** 