# 🖨️ Guia de Implementação de Periféricos

## 📋 **Status Atual**

### ✅ **FASE 1 - INFRAESTRUTURA BASE (CONCLUÍDA)**
- [x] Backend com APIs para periféricos
- [x] Frontend com interface de configuração
- [x] Sistema de detecção de dispositivos
- [x] Configurações salvas no banco de dados
- [x] Logs de impressão

### 🔄 **FASE 2 - INTEGRAÇÃO REAL (EM ANDAMENTO)**
- [ ] Integração com impressoras térmicas
- [ ] Scanner de código de barras
- [ ] Sistema fiscal (NF-e/SAT)

---

## 🗄️ **BANCO DE DADOS**

### **1. Executar Script SQL**

Execute o script `tools/create-peripherals-tables.sql` no **SQL Editor do Supabase**:

```sql
-- Copie e cole todo o conteúdo do arquivo tools/create-peripherals-tables.sql
-- no SQL Editor do seu projeto Supabase
```

### **2. Tabelas Criadas**

| Tabela | Descrição |
|--------|-----------|
| `peripheral_configs` | Configurações de periféricos por loja |
| `print_logs` | Logs de impressão de recibos |
| `detected_devices` | Dispositivos detectados automaticamente |

---

## 🚀 **COMO TESTAR**

### **1. Acessar Interface**
1. Acesse: `http://localhost:5173/`
2. Faça login
3. Clique em **"Periféricos"** no menu lateral

### **2. Testar Funcionalidades**
1. **Detectar Dispositivos**: Clique em "Detectar Dispositivos"
2. **Configurar Impressora**: Configure tipo, interface e porta
3. **Testar Impressora**: Clique em "Testar Impressora"
4. **Salvar Configurações**: Clique em "Salvar Configurações"

### **3. Testar APIs**
```bash
# Obter configurações
curl http://localhost:4000/api/peripherals/config

# Detectar dispositivos
curl http://localhost:4000/api/peripherals/detect-devices

# Testar impressora
curl -X POST http://localhost:4000/api/peripherals/test-printer \
  -H "Content-Type: application/json" \
  -d '{"printerConfig":{"type":"epson","interface":"USB","port":"USB001"}}'
```

---

## 🔧 **CONFIGURAÇÕES SUPORTADAS**

### **Impressoras**
- **Tipos**: Epson, Star, Citizen, Bematech
- **Interfaces**: USB, Rede, Serial
- **Portas**: Configurável (ex: USB001, 192.168.1.100:9100)

### **Scanners**
- **Auto-detecção**: Sim
- **Escaneamento automático**: Configurável
- **ID do dispositivo**: Opcional

### **Sistema Fiscal**
- **NF-e**: Ativável/Desativável
- **SAT**: Ativável/Desativável
- **CNPJ**: Configurável
- **Inscrição Estadual**: Configurável

---

## 📁 **ARQUIVOS MODIFICADOS**

### **Backend**
- `backend/controllers/peripheralsController.js` - Controller principal
- `backend/routes/peripherals.js` - Rotas da API
- `backend/index.js` - Integração das rotas
- `backend/package.json` - Dependências

### **Frontend**
- `src/lib/peripheralsService.js` - Serviço de comunicação
- `src/components/settings/PeripheralSettings.jsx` - Interface
- `src/components/Layout.jsx` - Menu
- `src/App.jsx` - Rotas

### **Banco de Dados**
- `tools/create-peripherals-tables.sql` - Script SQL

---

## 🎯 **PRÓXIMOS PASSOS**

### **FASE 2A - Impressora Térmica Real**
1. Instalar bibliotecas de impressão
2. Implementar detecção real de impressoras
3. Testar com impressora física

### **FASE 2B - Scanner de Código de Barras**
1. Implementar detecção de scanners
2. Integrar com POS
3. Testar com scanner físico

### **FASE 2C - Sistema Fiscal**
1. Implementar NF-e
2. Implementar SAT
3. Testar com certificados

---

## ⚠️ **LIMITAÇÕES ATUAIS**

### **Browser vs Hardware**
- **Problema**: Browsers não podem acessar hardware diretamente
- **Solução**: Aplicação desktop (Electron) ou PWA

### **Deploy Remoto**
- **Problema**: Periféricos só funcionam localmente
- **Solução**: Aplicação híbrida (web + desktop local)

---

## 🔍 **TROUBLESHOOTING**

### **Erro: "Supabase não configurado"**
- Verifique as variáveis de ambiente no backend
- Confirme se o arquivo `.env` existe

### **Erro: "Cannot GET /api/peripherals/config"**
- Verifique se o backend está rodando
- Confirme se as rotas foram carregadas

### **Erro: "Erro ao salvar no banco"**
- Execute o script SQL no Supabase
- Verifique as permissões RLS

---

## 📞 **SUPORTE**

Para dúvidas ou problemas:
1. Verifique os logs do backend
2. Teste as APIs individualmente
3. Confirme se as tabelas foram criadas
4. Verifique as variáveis de ambiente

---

## 🎉 **RESULTADO ESPERADO**

Após seguir este guia, você terá:
- ✅ Interface completa para configurar periféricos
- ✅ APIs funcionais para comunicação
- ✅ Banco de dados configurado
- ✅ Sistema pronto para integração real

**Próximo passo**: Implementar integração real com hardware! 🚀 