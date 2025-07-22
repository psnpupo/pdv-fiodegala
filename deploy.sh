#!/bin/bash
set -e

# CONFIGURAÇÕES
VPS_USER="root"
VPS_HOST="31.97.86.88"
VPS_FRONT_PATH="/var/www/pdv-app"
VPS_BACK_PATH="/var/www/backend"
REPO_PATH="$(pwd)"

# 1. Build do frontend
npm run build

# 2. Envia build do frontend para a VPS
ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_FRONT_PATH"
scp -r dist/* $VPS_USER@$VPS_HOST:$VPS_FRONT_PATH/
ssh $VPS_USER@$VPS_HOST "chown -R www-data:www-data $VPS_FRONT_PATH"

# 3. Envia backend para a VPS
scp -r backend $VPS_USER@$VPS_HOST:/var/www/

# 4. Builda imagem Docker do backend na VPS
ssh $VPS_USER@$VPS_HOST "cd $VPS_BACK_PATH && docker build -t pdv-fiodegala-backend:latest ."

# 5. Reinicia o container do backend
ssh $VPS_USER@$VPS_HOST "docker stop pdv-backend || true && docker rm pdv-backend || true && docker run -d --name pdv-backend --restart always -p 4000:4000 --env-file $VPS_BACK_PATH/.env pdv-fiodegala-backend:latest"

# 6. Commit e push para o GitHub
cd "$REPO_PATH"
git add .
git commit -m "Deploy automático: frontend e backend atualizados"
git push origin main

# 7. Mensagem final

echo "\n\033[1;32mDeploy finalizado com sucesso!\033[0m"
echo "Acesse: https://fiodegalasystem.com.br" 