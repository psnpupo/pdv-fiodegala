# Guia de Deploy Atualizado - PDV Fio de Gala

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Docker instalado na VPS
- Acesso SSH à VPS (31.97.86.88)
- Chave SSH configurada

## 🚀 Deploy Completo

### 1. Deploy Automático (Recomendado)

```bash
# Executar deploy completo
./deploy-complete.sh
```

Este script faz:
- ✅ Build do frontend com configuração dinâmica
- ✅ Verificação da configuração dinâmica no build
- ✅ Upload para VPS
- ✅ Build e restart do backend Docker
- ✅ Limpeza de cache
- ✅ Verificação de conectividade

### 2. Deploy Simples

```bash
# Deploy básico
./deploy.sh
```

### 3. Verificação Pós-Deploy

```bash
# Verificar se tudo está funcionando
./verify-deploy.sh
```

## 🔧 Configuração Dinâmica

### Como Funciona

O sistema agora detecta automaticamente o ambiente:

**Desenvolvimento Local:**
- Hostname: `localhost` ou `127.0.0.1`
- Backend: `http://localhost:4000/api`

**VPS (fiodegalasystem.com.br):**
- Hostname: `fiodegalasystem.com.br` ou `31.97.86.88`
- Backend: `/api` (URL relativa)

### Logs de Debug

No console do navegador, você verá:
```javascript
🔧 Configuração do backend: {
  hostname: "fiodegalasystem.com.br",
  backendUrl: "/api",
  isLocal: false,
  vpsInfo: {
    domain: "fiodegalasystem.com.br",
    ip: "31.97.86.88",
    currentHostname: "fiodegalasystem.com.br"
  }
}
```

## 📁 Estrutura dos Arquivos

```
pdv-fiodegala/
├── deploy-complete.sh      # Deploy completo com verificações
├── deploy.sh              # Deploy básico
├── verify-deploy.sh       # Verificação pós-deploy
├── nginx-https.conf       # Configuração Nginx
├── Dockerfile             # Docker do frontend
├── backend/               # Código do backend
├── src/                   # Código do frontend
└── dist/                  # Build de produção
```

## 🌐 URLs da VPS

### Domínio Principal
- **Frontend**: https://fiodegalasystem.com.br
- **Backend**: https://fiodegalasystem.com.br/api

### IP Direto
- **Frontend**: https://31.97.86.88
- **Backend**: https://31.97.86.88/api

## 🔍 Verificações Importantes

### 1. Verificar Build
```bash
# Verificar se o build foi gerado
ls -la dist/

# Verificar configuração dinâmica
grep -r "fiodegalasystem.com.br" dist/
```

### 2. Verificar VPS
```bash
# Conectividade
ping 31.97.86.88

# Serviços
ssh root@31.97.86.88 "systemctl status nginx"
ssh root@31.97.86.88 "docker ps | grep pdv-backend"
```

### 3. Verificar API
```bash
# API local na VPS
ssh root@31.97.86.88 "curl http://localhost:4000/api/status"

# API via domínio
curl https://fiodegalasystem.com.br/api/status
```

## 🛠️ Solução de Problemas

### Problema: "Failed to fetch"
**Causa:** Configuração dinâmica não está funcionando
**Solução:**
1. Verificar se o build tem a configuração dinâmica
2. Limpar cache do navegador (Ctrl+Shift+R)
3. Verificar logs no console do navegador

### Problema: Backend não responde
**Causa:** Container Docker parado
**Solução:**
```bash
ssh root@31.97.86.88 "docker restart pdv-backend"
```

### Problema: Nginx não carrega
**Causa:** Configuração incorreta
**Solução:**
```bash
ssh root@31.97.86.88 "systemctl restart nginx"
```

## 📊 Monitoramento

### Logs Importantes
```bash
# Logs do Nginx
ssh root@31.97.86.88 "tail -f /var/log/nginx/pdv-app.access.log"
ssh root@31.97.86.88 "tail -f /var/log/nginx/pdv-app.error.log"

# Logs do Docker
ssh root@31.97.86.88 "docker logs pdv-backend"
```

### Status dos Serviços
```bash
# Verificar todos os serviços
./verify-deploy.sh
```

## 🎯 Benefícios da Nova Configuração

1. **Independência**: VPS funciona sem servidor local
2. **Flexibilidade**: Funciona em qualquer ambiente
3. **Debug**: Logs detalhados para troubleshooting
4. **Manutenibilidade**: Configuração centralizada
5. **Performance**: URLs otimizadas para cada ambiente

## 📝 Checklist de Deploy

- [ ] Build do frontend gerado
- [ ] Configuração dinâmica detectada no build
- [ ] Arquivos enviados para VPS
- [ ] Backend Docker buildado e rodando
- [ ] Nginx recarregado
- [ ] Cache limpo
- [ ] API respondendo
- [ ] Frontend acessível
- [ ] Funcionalidades testadas

## 🚨 Comandos de Emergência

```bash
# Restart completo
ssh root@31.97.86.88 "systemctl restart nginx && docker restart pdv-backend"

# Rollback (se necessário)
git checkout HEAD~1
./deploy-complete.sh

# Limpar cache completo
ssh root@31.97.86.88 "rm -rf /var/www/pdv-app/* && systemctl reload nginx"
```

## 📞 Suporte

Se houver problemas:
1. Execute `./verify-deploy.sh`
2. Verifique os logs
3. Teste a conectividade
4. Verifique a configuração dinâmica no console do navegador
