# Solução para Dependência do Localhost na VPS

## Problema
O sistema parava de funcionar na VPS quando o servidor local era fechado, porque havia URLs hardcoded para `localhost:4000`.

## Causa Raiz
Vários arquivos tinham URLs do backend hardcoded como `http://localhost:4000/api`, fazendo com que o sistema sempre tentasse se conectar ao servidor local, mesmo quando rodando na VPS.

## Solução Implementada

### 1. Configuração Dinâmica
Criado arquivo `src/lib/config.js` que detecta automaticamente o ambiente:

```javascript
const getBackendUrl = () => {
  // Se estamos em desenvolvimento local (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000/api';
  }
  
  // Se estamos na VPS ou produção, usar a URL relativa
  // Isso funciona para qualquer domínio/IP, incluindo:
  // - fiodegalasystem.com.br
  // - 31.97.86.88
  // - Qualquer outro domínio/IP da VPS
  return '/api';
};
```

### 2. Arquivos Atualizados
- ✅ `src/lib/salesApi.js` - Usa configuração dinâmica
- ✅ `src/lib/cashRegisterApi.js` - Usa configuração dinâmica
- ✅ `src/lib/auth.js` - Já usava URLs relativas
- ✅ `src/lib/peripheralsService.js` - Já usava URLs relativas
- ✅ `src/lib/fiscalService.js` - Já usava URLs relativas

### 3. Comportamento por Ambiente

#### Desenvolvimento Local
- **Hostname**: `localhost` ou `127.0.0.1`
- **URL do Backend**: `http://localhost:4000/api`
- **Proxy do Vite**: Ativo (redireciona `/api` para `localhost:4000`)

#### Produção/VPS (fiodegalasystem.com.br)
- **Hostname**: `fiodegalasystem.com.br`, `31.97.86.88`, ou qualquer subdomínio
- **URL do Backend**: `/api` (URL relativa)
- **Proxy**: Não aplicável (requisições vão para o mesmo domínio)

## Como Funciona

### Em Desenvolvimento
```
Frontend (localhost:5173) → Proxy Vite → Backend (localhost:4000)
```

### Em Produção/VPS
```
Frontend (fiodegalasystem.com.br) → Backend (fiodegalasystem.com.br/api)
Frontend (31.97.86.88) → Backend (31.97.86.88/api)
```

## Testes Realizados

### ✅ Configuração Específica da VPS
```bash
node test-vps-config.js
```

Resultado:
- localhost → http://localhost:4000/api ✅
- 127.0.0.1 → http://localhost:4000/api ✅
- fiodegalasystem.com.br → /api ✅
- 31.97.86.88 → /api ✅
- www.fiodegalasystem.com.br → /api ✅
- teste.fiodegalasystem.com.br → /api ✅

### ✅ Build de Produção
```bash
npm run build
```

O build gerado usa a configuração dinâmica corretamente.

## Benefícios

1. **Independência**: VPS funciona independentemente do servidor local
2. **Flexibilidade**: Sistema funciona em qualquer ambiente
3. **Manutenibilidade**: Configuração centralizada
4. **Debug**: Logs mostram qual configuração está sendo usada
5. **Compatibilidade**: Funciona tanto com domínio quanto com IP

## Logs de Debug

O sistema agora mostra no console:
```
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

## Deploy

Para aplicar as mudanças na VPS:

1. **Fazer build de produção**:
   ```bash
   npm run build
   ```

2. **Subir arquivos da pasta `dist/`** para a VPS

3. **Verificar se o backend está rodando** na VPS na porta correta

4. **Testar funcionalidades** que usam APIs do backend

## Verificação

Para verificar se está funcionando:

1. **Abrir console do browser** (F12)
2. **Verificar logs** de configuração do backend
3. **Testar funcionalidades** como produtos recentes no POS
4. **Confirmar** que não há erros de "Failed to fetch"

## URLs da VPS

### Domínio Principal
- **Frontend**: https://fiodegalasystem.com.br
- **Backend**: https://fiodegalasystem.com.br/api

### IP Direto
- **Frontend**: https://31.97.86.88
- **Backend**: https://31.97.86.88/api

### Subdomínios (se configurados)
- **www.fiodegalasystem.com.br** → /api
- **teste.fiodegalasystem.com.br** → /api
- **Qualquer subdomínio** → /api

## Conclusão

O problema foi resolvido implementando uma configuração dinâmica que detecta automaticamente o ambiente e usa a URL apropriada do backend. Agora o sistema funciona independentemente em desenvolvimento local e produção/VPS, funcionando perfeitamente com o domínio `fiodegalasystem.com.br` e IP `31.97.86.88`.
