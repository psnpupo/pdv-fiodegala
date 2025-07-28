# 🚀 **INSTALAÇÃO PDV FIO DE GALA**

## ⚡ **INSTALAÇÃO RÁPIDA**

### **Método 1: Script Automatizado (Recomendado)**

#### **Windows:**
```powershell
# Baixar e executar script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/psnpupo/pdv-fiodegala/main/install-pdv.bat" -OutFile "install-pdv.bat"
.\install-pdv.bat
```

#### **Linux/macOS:**
```bash
# Baixar e executar script
curl -fsSL https://raw.githubusercontent.com/psnpupo/pdv-fiodegala/main/install-pdv.sh | bash
```

### **Método 2: Instalação Manual**

#### **1. Baixar Projeto**
```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/psnpupo/pdv-fiodegala.git
cd pdv-fiodegala
```

#### **2. Instalar Dependências**
```powershell
npm install
cd backend && npm install && cd ..
```

#### **3. Configurar Banco**
- Criar projeto no Supabase
- Executar scripts SQL
- Configurar .env

#### **4. Iniciar Sistema**
```powershell
cd backend && npm start  # Terminal 1
npm run dev              # Terminal 2
```

#### **5. Acessar**
- http://localhost:5173
- Seguir Setup Wizard

---

## 📋 **PRÉ-REQUISITOS**

### **Sistema Operacional**
- ✅ Windows 10 ou superior
- ✅ Linux (Ubuntu 18.04+)
- ✅ macOS 10.15+

### **Ferramentas Necessárias**
- ✅ **Git** (obrigatório)
- ✅ **Node.js** 18+ (obrigatório)
- ✅ **npm** (vem com Node.js)

---

## 🔧 **INSTALAÇÃO DAS FERRAMENTAS**

### **Windows**

#### **Git:**
1. Acesse: https://git-scm.com/download/win
2. Baixe e instale
3. Aceite as opções padrão

#### **Node.js:**
1. Acesse: https://nodejs.org/
2. Baixe a versão LTS
3. Instale

### **Linux (Ubuntu/Debian)**

```bash
# Instalar Git
sudo apt-get update
sudo apt-get install git

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### **macOS**

```bash
# Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Git e Node.js
brew install git node
```

---

## 🗄️ **CONFIGURAÇÃO DO BANCO DE DADOS**

### **1. Criar Projeto no Supabase**

1. **Acessar Supabase:**
   - Vá para: https://supabase.com
   - Crie uma conta gratuita
   - Clique em "New Project"

2. **Configurar Projeto:**
   - Nome: `PDV Fio de Gala`
   - Senha: (escolha uma senha forte)
   - Região: (escolha a mais próxima)
   - Clique em "Create new project"

### **2. Executar Scripts SQL**

1. **Acessar SQL Editor:**
   - No painel do Supabase, vá em "SQL Editor"

2. **Executar Scripts:**
   - Cole e execute cada script em ordem:

   **Script 1 - Fix Peripherals:**
   ```sql
   ALTER TABLE public.detected_devices
   ADD CONSTRAINT detected_devices_device_id_unique UNIQUE (device_id);
   ```

   **Script 2 - Fiscal Tables:**
   ```sql
   CREATE TABLE IF NOT EXISTS public.fiscal_configs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
       config JSONB NOT NULL DEFAULT '{}',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

   **Script 3 - Scan Logs:**
   ```sql
   CREATE TABLE IF NOT EXISTS public.scan_logs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
       user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
       barcode TEXT NOT NULL,
       format TEXT,
       scanner_config JSONB,
       scan_status TEXT NOT NULL CHECK (scan_status IN ('success', 'error', 'pending')),
       error_message TEXT,
       timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### **3. Obter Credenciais**

1. **Acessar Configurações:**
   - Vá em "Settings" → "API"

2. **Copiar Credenciais:**
   - **Project URL** (ex: `https://abc123.supabase.co`)
   - **anon public key** (ex: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

---

## ⚙️ **CONFIGURAÇÃO DO SISTEMA**

### **1. Configurar Variáveis de Ambiente**

```powershell
# Copiar arquivo de exemplo
copy backend\env.example backend\.env

# Editar o arquivo
notepad backend\.env
```

### **2. Conteúdo do Arquivo .env**

```env
# Supabase Configuration
SUPABASE_URL=sua_project_url_aqui
SUPABASE_ANON_KEY=sua_anon_key_aqui

# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## 🚀 **INICIAR O SISTEMA**

### **Terminal 1 - Backend**
```powershell
cd backend
npm start
```

**Deve mostrar:**
```
Backend rodando em http://localhost:4000
```

### **Terminal 2 - Frontend**
```powershell
npm run dev
```

**Deve mostrar:**
```
VITE v4.5.14  ready in 343 ms
➜  Local:   http://localhost:5173/
```

---

## 🎯 **PRIMEIRO ACESSO**

### **1. Acessar o Sistema**
- Abra o navegador
- Acesse: `http://localhost:5173`
- O **Setup Wizard** aparecerá automaticamente

### **2. Setup Wizard - Passo a Passo**

#### **Passo 1: Boas-vindas**
- Clique em "Começar"

#### **Passo 2: Dados da Empresa**
- Nome da empresa: `Sua Loja`
- Endereço: `Seu endereço`
- Telefone: `Seu telefone`
- Email: `seu@email.com`

#### **Passo 3: Configuração Fiscal**
- **CNPJ:** `00.000.000/0001-00` (para teste)
- **Inscrição Estadual:** `000000000`
- **Ambiente:** Homologação
- **NF-e:** Ativado
- **SAT:** Ativado

#### **Passo 4: Periféricos**
- **Impressora:** Desativar (para teste)
- **Scanner:** Desativar (para teste)

#### **Passo 5: Usuário Administrador**
- **Nome:** `Administrador`
- **Email:** `admin@sualoja.com`
- **Senha:** `123456`
- **Confirmação:** `123456`

#### **Passo 6: Testes**
- Clique em "Executar Testes"
- Aguarde os testes completarem

#### **Passo 7: Conclusão**
- Clique em "Finalizar"
- Faça login com as credenciais criadas

---

## 🧪 **TESTES INICIAIS**

### **1. Testar Login**
- Email: `admin@sualoja.com`
- Senha: `123456`

### **2. Testar Cadastro de Produto**
1. Vá em "Produtos"
2. Clique em "Novo Produto"
3. Preencha os dados básicos
4. Salve

### **3. Testar Venda**
1. Vá em "PDV"
2. Adicione um produto ao carrinho
3. Finalize a venda

### **4. Testar Relatórios**
1. Vá em "Relatórios"
2. Verifique se os dados aparecem

---

## 🔧 **RESOLUÇÃO DE PROBLEMAS**

### **Erro: "git não é reconhecido"**
```powershell
# Reiniciar PowerShell
# Ou adicionar Git ao PATH
$env:PATH += ";C:\Program Files\Git\bin"
```

### **Erro: "node não é reconhecido"**
```powershell
# Reiniciar PowerShell
# Ou reinstalar Node.js
```

### **Erro: "Cannot find module"**
```powershell
# Reinstalar dependências
rmdir /s node_modules
rmdir /s backend\node_modules
npm install
cd backend && npm install && cd ..
```

### **Erro: "Supabase connection failed"**
- Verificar credenciais no arquivo `.env`
- Verificar se o projeto Supabase está ativo
- Verificar se os scripts SQL foram executados

### **Erro: "Backend não está rodando"**
```powershell
# Verificar se o backend está rodando
cd backend
npm start
```

---

## 📋 **CHECKLIST DE INSTALAÇÃO**

- [ ] **Git instalado** (`git --version`)
- [ ] **Node.js instalado** (`node --version`)
- [ ] **npm instalado** (`npm --version`)
- [ ] **Projeto baixado** (`dir` mostra arquivos)
- [ ] **Dependências instaladas** (`npm install`)
- [ ] **Supabase configurado** (scripts SQL executados)
- [ ] **Variáveis de ambiente** configuradas
- [ ] **Backend rodando** (`npm start`)
- [ ] **Frontend rodando** (`npm run dev`)
- [ ] **Setup Wizard** acessível
- [ ] **Login funcionando**
- [ ] **Cadastro de produto** funcionando
- [ ] **Venda** funcionando

---

## 🔄 **ATUALIZAÇÕES**

### **Atualizar Sistema**
```powershell
cd pdv-fiodegala
git pull origin main
npm install
cd backend && npm install && cd ..
```

---

## 📞 **SUPORTE**

### **Documentação Completa**
- `GUIA-COMPLETO-SISTEMA.md` - Documentação completa
- `GUIA-SUPABASE.md` - Configuração do banco
- `GUIA-PERIFERICOS.md` - Configuração de periféricos

### **Canais de Suporte**
- **GitHub Issues:** https://github.com/psnpupo/pdv-fiodegala/issues
- **Email:** suporte@fiodegala.com
- **WhatsApp:** (11) 99999-9999

---

## 🎉 **SUCESSO!**

Se você chegou até aqui, o PDV está funcionando perfeitamente!

### **Próximos passos:**
1. **Configurar periféricos reais** (impressora, scanner)
2. **Configurar dados fiscais reais**
3. **Cadastrar produtos da loja**
4. **Treinar funcionários**
5. **Iniciar operação**

**Boa sorte com o PDV Fio de Gala! 🎯** 