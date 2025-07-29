# 📦 Guia de Instalação via ZIP - PDV Fio de Gala

## 🎯 **Método Rápido para Instalação em Múltiplas Máquinas**

Este guia explica como instalar o sistema PDV em uma nova máquina usando um arquivo ZIP, mantendo o mesmo banco de dados.

---

## 📋 **Pré-requisitos**

### **Na máquina ORIGINAL (onde o sistema já funciona):**
- ✅ Sistema PDV funcionando
- ✅ Credenciais do Supabase em mãos
- ✅ Arquivo `backend/.env` configurado

### **Na máquina NOVA:**
- ✅ Node.js instalado (versão 16 ou superior)
- ✅ npm instalado
- ✅ Conexão com internet (apenas para instalar dependências)

---

## 🚀 **Passo a Passo**

### **1. Na máquina ORIGINAL - Criar o ZIP**

#### **Opção A: Usar o script automático**
```bash
# Na pasta do projeto
./criar-zip-instalacao.sh
```

#### **Opção B: Criar manualmente**
```bash
# Navegar para a pasta do projeto
cd /caminho/para/pdv-fiodegala

# Criar ZIP (macOS/Linux)
zip -r pdv-fiodegala-instalacao.zip . \
    -x "node_modules/*" \
    -x "backend/node_modules/*" \
    -x ".git/*" \
    -x "*.log" \
    -x ".DS_Store" \
    -x ".env" \
    -x "backend/.env"

# Windows (PowerShell)
Compress-Archive -Path . -DestinationPath pdv-fiodegala-instalacao.zip -Exclude "node_modules", "backend/node_modules", ".git", "*.log", ".env", "backend/.env"
```

### **2. Transferir o ZIP**

**Métodos de transferência:**
- 📁 **USB/Pendrive:** Copiar arquivo
- 🌐 **Rede local:** Compartilhar pasta
- 📧 **Email:** Enviar por email (se < 50MB)
- ☁️ **Cloud:** Google Drive, Dropbox, OneDrive

### **3. Na máquina NOVA - Extrair e instalar**

#### **Extrair o ZIP:**
```bash
# Extrair o arquivo
unzip pdv-fiodegala-instalacao.zip -d pdv-fiodegala
cd pdv-fiodegala
```

#### **Instalar dependências:**
```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### **4. Configurar ambiente**

#### **Copiar arquivo de exemplo:**
```bash
# Se não existir, copiar o exemplo
cp backend/env.example backend/.env
```

#### **Editar configurações:**
```bash
# Editar o arquivo .env
nano backend/.env
# ou
code backend/.env
```

#### **Configurar credenciais:**
```env
# backend/.env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
PORT=4000
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Use as MESMAS credenciais da máquina original!

### **5. Testar conexão**

#### **Iniciar apenas o backend:**
```bash
cd backend && npm start
```

**Verificar se aparece:**
```
✅ Supabase conectado para periféricos
✅ Supabase conectado para sistema fiscal
Backend rodando em http://localhost:4000
```

### **6. Iniciar sistema completo**

#### **Terminal 1 - Backend:**
```bash
cd backend && npm start
```

#### **Terminal 2 - Frontend:**
```bash
npm run dev
```

### **7. Acessar o sistema**

- 🌐 Abrir navegador: `http://localhost:5173`
- 🔐 Fazer login com as MESMAS credenciais de usuário

---

## 🎯 **Resultado**

### **✅ O que funciona automaticamente:**
- **Banco de dados:** Mesmo banco da máquina original
- **Produtos:** Todos os produtos cadastrados
- **Clientes:** Todos os clientes
- **Vendas:** Histórico completo
- **Estoque:** Dados sincronizados
- **Usuários:** Mesmos logins funcionam
- **Relatórios:** Dados em tempo real

### **🔧 O que configurar localmente:**
- **Impressora:** Configurar porta específica da nova máquina
- **Scanner:** Configurar dispositivo específico
- **Periféricos:** Configurar em `/peripherals`

---

## 📱 **Casos de Uso**

### **Loja com múltiplos PDVs:**
```
PDV 1 (Original) ←→ Supabase ←→ PDV 2 (Nova máquina)
     ↓                    ↑                    ↓
Caixa principal    Banco compartilhado   Caixa secundário
```

### **Loja com estoque separado:**
```
PDV Vendas ←→ Supabase ←→ PDV Estoque
    ↓              ↑              ↓
Finalização    Dados sincronizados   Controle entrada/saída
```

### **Loja com atendimento:**
```
PDV Principal ←→ Supabase ←→ PDV Atendimento
      ↓               ↑               ↓
   Vendas         Dados compartilhados   Consulta produtos
```

---

## ⚙️ **Configurações Específicas**

### **Periféricos por máquina:**

#### **Configurar impressora:**
1. Acessar: `http://localhost:5173/peripherals`
2. Selecionar tipo: Epson, Star, etc.
3. Configurar interface: USB, Serial, etc.
4. Configurar porta: USB001, COM1, etc.
5. Testar impressão

#### **Configurar scanner:**
1. Acessar: `http://localhost:5173/peripherals`
2. Habilitar scanner
3. Configurar dispositivo (se necessário)
4. Testar leitura

### **Configurações de rede:**

#### **Mesma rede local:**
- ✅ Funciona perfeitamente
- ✅ Baixa latência
- ✅ Sincronização rápida

#### **Redes diferentes:**
- ✅ Funciona via internet
- ✅ Depende da conexão
- ✅ Pode ter latência

---

## 🔍 **Verificação e Testes**

### **Testar sincronização:**

#### **1. Cadastrar produto na máquina original:**
- Acessar: `http://localhost:5173/products`
- Cadastrar novo produto
- Verificar se aparece na máquina nova

#### **2. Fazer venda na máquina nova:**
- Acessar: `http://localhost:5173/pos`
- Fazer uma venda
- Verificar se aparece na máquina original

#### **3. Verificar relatórios:**
- Acessar: `http://localhost:5173/reports`
- Verificar se dados estão sincronizados

### **Testar periféricos:**

#### **Impressora:**
- Configurar em `/peripherals`
- Fazer teste de impressão
- Verificar se imprime corretamente

#### **Scanner:**
- Configurar em `/peripherals`
- Fazer teste de leitura
- Verificar se lê códigos de barras

---

## 🚨 **Solução de Problemas**

### **Erro: "Cannot find module"**
```bash
# Reinstalar dependências
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install && cd ..
```

### **Erro: "Supabase não conectado"**
```bash
# Verificar arquivo .env
cat backend/.env

# Verificar credenciais no Supabase
# Acessar: https://supabase.com
```

### **Erro: "Porta já em uso"**
```bash
# Mudar porta no backend/.env
PORT=4001

# Ou matar processo na porta
lsof -ti:4000 | xargs kill -9
```

### **Erro: "Permissão negada"**
```bash
# Dar permissão de execução
chmod +x criar-zip-instalacao.sh

# Ou executar com sudo (se necessário)
sudo npm install
```

---

## 📞 **Suporte**

### **Se algo não funcionar:**
1. Verificar logs do backend
2. Verificar logs do frontend
3. Verificar conexão com Supabase
4. Verificar arquivo `.env`

### **Logs úteis:**
```bash
# Backend
cd backend && npm start

# Frontend
npm run dev
```

---

## 🎉 **Pronto!**

**Agora você tem um sistema distribuído funcionando!**

- ✅ **Múltiplas máquinas** conectadas
- ✅ **Banco compartilhado** em tempo real
- ✅ **Dados sincronizados** automaticamente
- ✅ **Configurações locais** por máquina

**É como ter uma "rede" de PDVs funcionando juntos!** 🚀 