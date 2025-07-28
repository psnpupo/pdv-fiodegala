# 🪟 **GUIA DE INSTALAÇÃO WINDOWS - PDV FIO DE GALA**

## 📋 **PRÉ-REQUISITOS**

### **1. Sistema Operacional**
- Windows 10 ou superior
- 4GB RAM mínimo (8GB recomendado)
- 2GB espaço livre em disco

### **2. Ferramentas Necessárias**
- **Git for Windows** (obrigatório)
- **Node.js** (obrigatório)
- **Visual Studio Code** (recomendado)

---

## 🚀 **PASSO A PASSO - INSTALAÇÃO COMPLETA**

### **PASSO 1: Instalar Git for Windows**

1. **Baixar Git:**
   - Acesse: https://git-scm.com/download/win
   - Clique em "Click here to download"
   - Baixe a versão para Windows

2. **Instalar Git:**
   - Execute o arquivo baixado
   - **IMPORTANTE:** Aceite todas as opções padrão
   - Marque "Git from the command line and also from 3rd-party software"
   - Complete a instalação

3. **Verificar instalação:**
   - Abra o **PowerShell** (não CMD)
   - Digite: `git --version`
   - Deve mostrar algo como: `git version 2.40.0.windows.1`

### **PASSO 2: Instalar Node.js**

1. **Baixar Node.js:**
   - Acesse: https://nodejs.org/
   - Baixe a versão **LTS** (18.x ou superior)
   - Execute o instalador

2. **Verificar instalação:**
   ```powershell
   node --version
   npm --version
   ```

### **PASSO 3: Instalar Visual Studio Code (Opcional)**

1. **Baixar VS Code:**
   - Acesse: https://code.visualstudio.com/
   - Baixe e instale

2. **Extensões recomendadas:**
   - Git Graph
   - GitLens
   - Node.js Extension Pack

---

## 📥 **BAIXAR E INSTALAR O PROJETO**

### **OPÇÃO 1: Usando Git (Recomendado)**

```powershell
# Abrir PowerShell como usuário normal (não administrador)

# Navegar para a pasta de documentos
cd $env:USERPROFILE\Documents

# Clonar o projeto
git clone https://github.com/psnpupo/pdv-fiodegala.git

# Entrar na pasta
cd pdv-fiodegala

# Verificar se os arquivos foram baixados
dir
```

### **OPÇÃO 2: Baixar ZIP (Se Git não funcionar)**

1. **Acessar o repositório:**
   - Vá para: https://github.com/psnpupo/pdv-fiodegala
   - Clique no botão verde "Code"
   - Selecione "Download ZIP"

2. **Extrair arquivo:**
   - Baixe o arquivo ZIP
   - Clique com botão direito → "Extrair tudo"
   - Extraia para: `C:\Users\[SeuUsuario]\Documents\`
   - Renomeie a pasta para: `pdv-fiodegala`

3. **Abrir PowerShell:**
   ```powershell
   cd $env:USERPROFILE\Documents\pdv-fiodegala
   dir
   ```

---

## ⚙️ **CONFIGURAR O PROJETO**

### **PASSO 4: Instalar Dependências**

```powershell
# Verificar se está na pasta correta
dir
# Deve mostrar: package.json, src/, backend/, etc.

# Instalar dependências do frontend
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..

# Verificar se tudo foi instalado
dir node_modules
dir backend\node_modules
```

### **PASSO 5: Configurar Banco de Dados (Supabase)**

1. **Criar conta no Supabase:**
   - Acesse: https://supabase.com
   - Crie uma conta gratuita
   - Crie um novo projeto

2. **Executar scripts SQL:**
   - No painel do Supabase, vá em "SQL Editor"
   - Execute os seguintes scripts em ordem:

   **Script 1 - Fix Peripherals:**
   ```sql
   -- Copie e cole o conteúdo do arquivo tools/fix-peripherals-tables.sql
   ```

   **Script 2 - Fiscal Tables:**
   ```sql
   -- Copie e cole o conteúdo do arquivo tools/create-fiscal-tables.sql
   ```

   **Script 3 - Scan Logs:**
   ```sql
   -- Copie e cole o conteúdo do arquivo tools/create-scan-logs-table.sql
   ```

3. **Obter credenciais:**
   - Vá em "Settings" → "API"
   - Copie:
     - Project URL
     - anon public key

### **PASSO 6: Configurar Variáveis de Ambiente**

```powershell
# Copiar arquivo de exemplo
copy backend\env.example backend\.env

# Editar o arquivo .env
notepad backend\.env
```

**Conteúdo do arquivo `.env`:**
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

### **PASSO 7: Iniciar Backend e Frontend**

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

**Terminal 2 - Frontend (novo PowerShell):**
```powershell
npm run dev
```

### **PASSO 8: Acessar o Sistema**

1. **Abrir navegador**
2. **Acessar:** `http://localhost:5173`
3. **O Setup Wizard aparecerá automaticamente**

---

## 🎯 **SETUP WIZARD - CONFIGURAÇÃO INICIAL**

### **Passo 1: Boas-vindas**
- Clique em "Começar"

### **Passo 2: Dados da Empresa**
- Nome da empresa: `Fio de Gala`
- Endereço: `Seu endereço`
- Telefone: `Seu telefone`
- Email: `seu@email.com`

### **Passo 3: Configuração Fiscal**
- **CNPJ:** `00.000.000/0001-00` (para teste)
- **Inscrição Estadual:** `000000000`
- **Ambiente:** Homologação
- **NF-e:** Ativado
- **SAT:** Ativado

### **Passo 4: Periféricos**
- **Impressora:** Desativar (para teste)
- **Scanner:** Desativar (para teste)

### **Passo 5: Usuário Administrador**
- **Nome:** `Administrador`
- **Email:** `admin@fiodegala.com`
- **Senha:** `123456`
- **Confirmação:** `123456`

### **Passo 6: Testes**
- Clique em "Executar Testes"
- Aguarde os testes completarem

### **Passo 7: Conclusão**
- Clique em "Finalizar"
- Faça login com as credenciais criadas

---

## 🧪 **TESTES INICIAIS**

### **1. Testar Login**
- Email: `admin@fiodegala.com`
- Senha: `123456`

### **2. Testar Cadastro de Produto**
- Vá em "Produtos"
- Clique em "Novo Produto"
- Preencha os dados básicos
- Salve

### **3. Testar Venda**
- Vá em "PDV"
- Adicione um produto ao carrinho
- Finalize a venda

### **4. Testar Relatórios**
- Vá em "Relatórios"
- Verifique se os dados aparecem

---

## 🔧 **RESOLUÇÃO DE PROBLEMAS**

### **Erro: "git não é reconhecido"**
```powershell
# Reiniciar PowerShell
# Ou adicionar Git ao PATH manualmente
$env:PATH += ";C:\Program Files\Git\bin"
```

### **Erro: "node não é reconhecido"**
```powershell
# Reiniciar PowerShell
# Ou reinstalar Node.js
```

### **Erro: "npm não é reconhecido"**
```powershell
# Node.js e npm vêm juntos
# Reinstalar Node.js
```

### **Erro: "EACCES: permission denied"**
```powershell
# Executar PowerShell como Administrador
# Ou usar:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
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

## 🎉 **SUCESSO!**

Se você chegou até aqui, o PDV está funcionando perfeitamente!

### **Próximos passos:**
1. **Configurar periféricos reais** (impressora, scanner)
2. **Configurar dados fiscais reais**
3. **Cadastrar produtos da loja**
4. **Treinar funcionários**
5. **Iniciar operação**

### **Suporte:**
- **Documentação:** `GUIA-COMPLETO-SISTEMA.md`
- **Problemas:** Verifique os logs no console
- **GitHub:** https://github.com/psnpupo/pdv-fiodegala

---

## 🚨 **IMPORTANTE**

- **Nunca execute como Administrador** (exceto quando necessário)
- **Sempre use PowerShell** (não CMD)
- **Mantenha o sistema atualizado**
- **Faça backup regular dos dados**
- **Teste antes de usar em produção**

**Boa sorte com o PDV Fio de Gala! 🎯** 