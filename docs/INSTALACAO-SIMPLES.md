# 🚀 PDV Fio de Gala - Instalação Simples

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Git** (https://git-scm.com/downloads)
- **Node.js** (https://nodejs.org/) - Versão LTS

## 🎯 Instalação Automática (Recomendado)

### Windows:
```powershell
# Opção 1: PowerShell (Recomendado)
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/psnpupo/pdv-fiodegala/main/setup-pdv.ps1" -OutFile "setup-pdv.ps1"
.\setup-pdv.ps1

# Opção 2: Batch
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/psnpupo/pdv-fiodegala/main/setup-pdv.bat" -OutFile "setup-pdv.bat"
.\setup-pdv.bat
```

### Linux/macOS:
```bash
# Baixar e executar o instalador
curl -sSL https://raw.githubusercontent.com/psnpupo/pdv-fiodegala/main/setup-pdv.sh | bash
```

## 🔧 Instalação Manual

### 1. Baixar o projeto:
```bash
git clone https://github.com/psnpupo/pdv-fiodegala.git
cd pdv-fiodegala
```

### 2. Executar Setup Wizard:
```bash
node setup-wizard.js
```

### 3. Seguir as instruções do Setup Wizard:
- ✅ Instalar dependências
- ✅ Configurar Supabase Cloud
- ✅ Executar scripts SQL
- ✅ Testar conexão
- ✅ Criar scripts de inicialização

## 🌐 Configurar Supabase Cloud

### 1. Criar conta no Supabase:
- Acesse: https://supabase.com
- Clique em "Start your project"
- Crie uma conta gratuita

### 2. Criar projeto:
- Clique em "New Project"
- Escolha um nome (ex: "pdv-fiodegala")
- Escolha uma senha forte
- Clique em "Create new project"
- Aguarde a criação (2-3 minutos)

### 3. Obter credenciais:
- Vá em "Settings" > "API"
- Copie a "Project URL"
- Copie a "anon public" key

### 4. Executar scripts SQL:
- Vá em "SQL Editor"
- Execute os scripts na ordem:
  1. `tools/create-peripherals-tables.sql`
  2. `tools/create-fiscal-tables.sql`
  3. `tools/create-scan-logs-table.sql`
  4. `tools/fix-peripherals-tables.sql`

## 🚀 Iniciar o Sistema

### Windows:
```bash
iniciar-pdv.bat
```

### Linux/macOS:
```bash
./iniciar-pdv.sh
```

### Manual:
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
npm run dev
```

## 🌐 Acessar o Sistema

- **URL:** http://localhost:5173
- **Primeiro acesso:** Siga o Setup Wizard do sistema

## 📋 Setup Wizard do Sistema

Ao acessar pela primeira vez, você verá um Setup Wizard que irá:

1. **Dados da Empresa**
   - Nome da empresa
   - Endereço
   - Telefone
   - Email

2. **Configuração Fiscal**
   - CNPJ
   - Inscrição Estadual
   - Configurar NF-e e SAT

3. **Periféricos**
   - Impressora térmica
   - Scanner de código de barras
   - Testar dispositivos

4. **Usuário Administrador**
   - Criar conta de administrador
   - Definir senha

## 🔧 Configurações Importantes

### Impressora Térmica:
- Conecte a impressora via USB
- Configure a porta correta
- Teste a impressão

### Scanner de Código de Barras:
- Conecte o scanner via USB
- Configure para modo automático
- Teste a leitura

### Sistema Fiscal:
- Configure CNPJ válido
- Configure inscrição estadual
- Teste geração de documentos

## 🆘 Solução de Problemas

### Erro de conexão com banco:
1. Verifique as credenciais do Supabase
2. Confirme se os scripts SQL foram executados
3. Teste a conexão: `node test-connection.js`

### Erro de periféricos:
1. Verifique se os dispositivos estão conectados
2. Configure as portas corretas
3. Consulte: `GUIA-PERIFERICOS.md`

### Erro de sistema fiscal:
1. Configure CNPJ válido
2. Verifique certificados digitais
3. Consulte: `GUIA-SISTEMA-FISCAL.md`

## 📞 Suporte

- **Documentação completa:** `GUIA-COMPLETO-SISTEMA.md`
- **Guia de instalação:** `GUIA-INSTALACAO.md`
- **Guia de periféricos:** `GUIA-PERIFERICOS.md`
- **Guia fiscal:** `GUIA-SISTEMA-FISCAL.md`

## 🎉 Pronto!

Seu PDV Fio de Gala está configurado e pronto para uso!

---

**Desenvolvido por:** Danilo Pupo Messias  
**Versão:** 1.0.0  
**Data:** 2024 