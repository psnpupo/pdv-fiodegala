# 🚀 Guia de Instalação - PDV Fio de Gala

## ✅ **INSTALAÇÃO AUTOMATIZADA**

### **Opção 1: Instalação Automática (Recomendada)**

```bash
# 1. Baixar o projeto
git clone https://github.com/seu-usuario/pdv-fiodegala.git
cd pdv-fiodegala

# 2. Executar instalador automático
./install.sh
```

O script `install.sh` irá:
- ✅ Verificar dependências (Node.js, npm, Git)
- ✅ Instalar dependências automaticamente
- ✅ Configurar variáveis de ambiente
- ✅ Criar scripts de inicialização
- ✅ Gerar documentação local

---

## 🔧 **INSTALAÇÃO MANUAL**

### **Passo 1: Pré-requisitos**

#### **Sistema Operacional**
- ✅ **Windows 10/11** (com WSL2 recomendado)
- ✅ **macOS 10.15+**
- ✅ **Ubuntu 20.04+** / **Debian 11+**

#### **Dependências**
- ✅ **Node.js 18+**
- ✅ **npm 8+**
- ✅ **Git**

#### **Instalar Node.js**

**Windows:**
```bash
# Baixar do site oficial
https://nodejs.org/
```

**macOS:**
```bash
# Com Homebrew
brew install node

# Ou baixar do site oficial
https://nodejs.org/
```

**Linux (Ubuntu/Debian):**
```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt-get install -y nodejs
```

### **Passo 2: Baixar o Projeto**

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/pdv-fiodegala.git
cd pdv-fiodegala

# Ou baixar ZIP e extrair
```

### **Passo 3: Instalar Dependências**

```bash
# Instalar dependências do frontend
npm install

# Instalar dependências do backend
cd backend
npm install
cd ..
```

### **Passo 4: Configurar Banco de Dados**

#### **4.1 Criar Projeto no Supabase**
1. Acesse: https://supabase.com
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Anote as credenciais:
   - **URL do projeto**
   - **Chave anônima (anon key)**
   - **Chave de serviço (service role key)**

#### **4.2 Executar Scripts SQL**
No **SQL Editor** do Supabase, execute os scripts na ordem:

```sql
-- 1. Corrigir constraints de periféricos
-- Execute o conteúdo de: tools/fix-peripherals-tables.sql

-- 2. Criar tabelas fiscais
-- Execute o conteúdo de: tools/create-fiscal-tables.sql

-- 3. Criar tabela de logs de scanner
-- Execute o conteúdo de: tools/create-scan-logs-table.sql
```

### **Passo 5: Configurar Variáveis de Ambiente**

#### **5.1 Backend (.env)**
```bash
# Copiar arquivo de exemplo
cp backend/env.example backend/.env

# Editar arquivo .env
nano backend/.env
```

**Conteúdo do arquivo `backend/.env`:**
```env
# Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# Servidor
PORT=4000
NODE_ENV=development

# Logs
LOG_LEVEL=info
```

#### **5.2 Frontend (.env)**
```bash
# Se necessário, criar arquivo .env no frontend
cp .env.example .env
```

### **Passo 6: Iniciar o Sistema**

#### **Opção A: Iniciar Tudo Junto**
```bash
# Script automático
./start-all.sh
```

#### **Opção B: Iniciar Separadamente**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

### **Passo 7: Primeiro Acesso**

1. **Acesse:** `http://localhost:5173`
2. **Setup Wizard** aparecerá automaticamente
3. **Siga os passos:**
   - Dados da empresa
   - Configuração fiscal
   - Periféricos
   - Usuário administrador
   - Testes

---

## 🏪 **INSTALAÇÃO EM LOJA**

### **Requisitos da Loja**

#### **Hardware Mínimo**
- ✅ **Computador:** Windows 10/11 ou Linux
- ✅ **Processador:** Intel i3 ou AMD equivalente
- ✅ **Memória:** 8GB RAM
- ✅ **Armazenamento:** 256GB SSD
- ✅ **Rede:** Conexão com internet

#### **Periféricos Recomendados**
- ✅ **Impressora Térmica:** Epson TM-T20II, Star TSP100
- ✅ **Scanner:** Honeywell 1900, Symbol DS2208
- ✅ **Monitor:** 15" ou maior
- ✅ **Teclado:** Teclado numérico
- ✅ **Mouse:** Mouse óptico

### **Processo de Instalação**

#### **1. Preparação**
```bash
# 1. Baixar instalador
wget https://github.com/seu-usuario/pdv-fiodegala/releases/latest/download/install.sh

# 2. Executar instalação
chmod +x install.sh
./install.sh
```

#### **2. Configuração de Rede**
```bash
# Configurar IP fixo (recomendado)
sudo nano /etc/netplan/01-netcfg.yaml

# Exemplo de configuração
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

#### **3. Configurar Firewall**
```bash
# Permitir portas necessárias
sudo ufw allow 5173  # Frontend
sudo ufw allow 4000  # Backend
sudo ufw enable
```

#### **4. Configurar Inicialização Automática**
```bash
# Criar serviço systemd
sudo nano /etc/systemd/system/pdv-fiodegala.service
```

**Conteúdo do arquivo:**
```ini
[Unit]
Description=PDV Fio de Gala
After=network.target

[Service]
Type=simple
User=pdv
WorkingDirectory=/home/pdv/pdv-fiodegala
ExecStart=/home/pdv/pdv-fiodegala/start-all.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar serviço
sudo systemctl enable pdv-fiodegala
sudo systemctl start pdv-fiodegala
```

---

## 🔧 **CONFIGURAÇÃO DE PERIFÉRICOS**

### **Impressora Térmica**

#### **Windows**
1. **Instalar Driver:**
   - Baixar driver da fabricante
   - Instalar como impressora local
   - Configurar porta USB

2. **Testar Impressão:**
   - Painel de Controle > Dispositivos
   - Imprimir página de teste

#### **Linux**
```bash
# Instalar CUPS
sudo apt-get install cups

# Adicionar impressora
sudo lpadmin -p "Termal" -E -v usb://EPSON/TM-T20II -m "drv:///sample.drv/generic.ppd"

# Habilitar impressora
sudo cupsenable Termal
sudo cupsaccept Termal
```

### **Scanner de Código de Barras**

#### **Configuração Automática**
1. **Conectar via USB**
2. **Aguardar detecção automática**
3. **Testar no Setup Wizard**

#### **Configuração Manual**
```bash
# Verificar dispositivos USB
lsusb

# Testar scanner
sudo apt-get install evtest
sudo evtest /dev/input/eventX
```

---

## 🧪 **TESTES PÓS-INSTALAÇÃO**

### **Teste 1: Sistema Básico**
```bash
# 1. Acessar frontend
curl http://localhost:5173

# 2. Acessar backend
curl http://localhost:4000/api/status

# 3. Verificar logs
tail -f backend/server.log
```

### **Teste 2: Banco de Dados**
```bash
# Testar conexão Supabase
curl -X GET "http://localhost:4000/api/status" | jq .
```

### **Teste 3: Periféricos**
1. **Impressora:**
   - Configurar no Setup Wizard
   - Imprimir recibo de teste

2. **Scanner:**
   - Configurar no Setup Wizard
   - Escanear código de teste

### **Teste 4: Sistema Fiscal**
1. **Configurar NF-e/SAT**
2. **Gerar documento de teste**
3. **Verificar XML gerado**

---

## 🚨 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **Erro: "Backend não conectado"**
```bash
# Verificar se backend está rodando
ps aux | grep node

# Verificar porta
netstat -tlnp | grep 4000

# Reiniciar backend
cd backend && npm start
```

#### **Erro: "Banco de dados não conectado"**
```bash
# Verificar variáveis de ambiente
cat backend/.env

# Testar conexão Supabase
curl -X GET "http://localhost:4000/api/status"
```

#### **Erro: "Impressora não encontrada"**
```bash
# Verificar dispositivos USB
lsusb

# Verificar permissões
sudo usermod -a -G lp $USER

# Reiniciar serviço CUPS
sudo systemctl restart cups
```

#### **Erro: "Scanner não funciona"**
```bash
# Verificar dispositivos de entrada
ls /dev/input/

# Testar scanner
sudo evtest /dev/input/eventX
```

### **Logs e Debug**
```bash
# Logs do backend
tail -f backend/server.log

# Logs do frontend
# Verificar console do navegador

# Logs do sistema
sudo journalctl -u pdv-fiodegala -f
```

---

## 📞 **SUPORTE**

### **Documentação**
- 📄 `GUIA-COMPLETO-SISTEMA.md` - Guia principal
- 📄 `GUIA-IMPRESSORA.md` - Configuração de impressora
- 📄 `GUIA-SCANNER-CODIGO-BARRAS.md` - Configuração de scanner
- 📄 `GUIA-SISTEMA-FISCAL.md` - Sistema fiscal

### **Contato**
- **Email:** suporte@fiodegala.com
- **WhatsApp:** (11) 99999-9999
- **Telefone:** (11) 3333-3333

### **Comunidade**
- **GitHub:** https://github.com/seu-usuario/pdv-fiodegala
- **Issues:** Reportar problemas
- **Wiki:** Documentação adicional

---

## 🎯 **PRÓXIMOS PASSOS**

### **Após Instalação**
1. ✅ **Configurar periféricos** reais
2. ✅ **Cadastrar produtos** da loja
3. ✅ **Configurar usuários** e permissões
4. ✅ **Testar vendas** completas
5. ✅ **Configurar backup** automático
6. ✅ **Treinar funcionários**

### **Melhorias Futuras**
- 🔮 **App mobile** para vendedores
- 🔮 **Integração com ERP**
- 🔮 **Sistema de delivery**
- 🔮 **Gateway de pagamento**
- 🔮 **Relatórios avançados**

---

## 🎉 **CONCLUSÃO**

**Sistema PDV Fio de Gala instalado com sucesso!**

### **Benefícios Alcançados**
- ✅ **Instalação automatizada** e simples
- ✅ **Setup Wizard** intuitivo
- ✅ **Configuração rápida** de periféricos
- ✅ **Sistema fiscal** integrado
- ✅ **Documentação completa**
- ✅ **Suporte técnico** disponível

**Sistema pronto para uso em produção!** 🚀

---

*Guia de Instalação - Versão 1.0.0*
*Última atualização: Julho 2025* 