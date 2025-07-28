# 🏪 PDV Fio de Gala

**Sistema de Ponto de Venda completo e profissional para lojas de roupas**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 **Instalação Rápida**

### **Windows**
```powershell
# 1. Verificar pré-requisitos
git --version
node --version
npm --version

# 2. Baixar projeto
cd $env:USERPROFILE\Documents
git clone https://github.com/psnpupo/pdv-fiodegala.git
cd pdv-fiodegala

# 3. Instalar dependências
npm install
cd backend && npm install && cd ..

# 4. Configurar ambiente
copy backend\env.example backend\.env
# Editar backend\.env com suas credenciais do Supabase

# 5. Executar scripts SQL no Supabase
# - tools/fix-peripherals-tables.sql
# - tools/create-fiscal-tables.sql
# - tools/create-scan-logs-table.sql

# 6. Iniciar sistema
cd backend && npm start  # Terminal 1
npm run dev              # Terminal 2
```

### **Linux/macOS**
```bash
# 1. Instalação automatizada
curl -fsSL https://raw.githubusercontent.com/psnpupo/pdv-fiodegala/main/install.sh | bash

# 2. Ou instalação manual
git clone https://github.com/psnpupo/pdv-fiodegala.git
cd pdv-fiodegala
npm install
cd backend && npm install && cd ..
cp backend/env.example backend/.env
# Editar backend/.env com suas credenciais do Supabase
cd backend && npm start  # Terminal 1
npm run dev              # Terminal 2
```

### **Guias Detalhados**
- **Windows:** `INSTALACAO-WINDOWS.md`
- **Rápida:** `INSTALACAO-RAPIDA.md`
- **Completa:** `GUIA-INSTALACAO.md`

## ✨ **Funcionalidades**

### **🎯 Sistema Completo**
- ✅ **Gestão de Produtos** - CRUD completo com categorias
- ✅ **Sistema de Vendas (POS)** - Interface intuitiva
- ✅ **Controle de Estoque** - Entrada, saída, transferências
- ✅ **Gestão de Clientes** - Cadastro e histórico
- ✅ **Relatórios** - Vendas, produtos, performance
- ✅ **Gestão de Usuários** - Roles e permissões
- ✅ **Controle de Caixa** - Abertura e fechamento

### **🖨️ Periféricos Integrados**
- ✅ **Impressora Térmica** - Suporte a múltiplos modelos
- ✅ **Scanner de Código de Barras** - Leitura automática
- ✅ **Setup Wizard** - Configuração automática

### **🧾 Sistema Fiscal**
- ✅ **NF-e** - Nota Fiscal Eletrônica
- ✅ **SAT** - Sistema Autenticador e Transmissor
- ✅ **Documentos Fiscais** - Gestão completa

## 🎨 **Interface**

### **Design Moderno**
- 🎨 Interface responsiva (desktop e mobile)
- 🌙 Tema claro/escuro
- 📱 Otimizado para touch
- ⚡ Carregamento rápido

### **Setup Wizard**
- 🧭 Guia passo a passo
- ⚙️ Configuração automática
- 🧪 Testes integrados
- 📋 Documentação inline

## 🛠️ **Tecnologias**

### **Frontend**
- **React 18** - Interface moderna
- **Vite** - Build rápido
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones

### **Backend**
- **Node.js** - Servidor
- **Express** - API REST
- **Supabase** - Banco de dados
- **JWT** - Autenticação

### **Periféricos**
- **node-thermal-printer** - Impressora térmica
- **@zxing/library** - Scanner de código de barras

## 📋 **Requisitos**

### **Sistema**
- **Node.js** 18+
- **npm** 8+
- **Git**

### **Hardware**
- **Processador** Intel i3 ou equivalente
- **Memória** 8GB RAM
- **Armazenamento** 256GB SSD
- **Rede** Conexão com internet

### **Periféricos**
- **Impressora Térmica** (opcional)
- **Scanner de Código de Barras** (opcional)

## 🚀 **Primeiro Acesso**

1. **Execute o instalador:**
   ```bash
   ./install.sh
   ```

2. **Configure o banco de dados:**
   - Execute os scripts SQL no Supabase
   - Configure as variáveis de ambiente

3. **Inicie o sistema:**
   ```bash
   ./start-all.sh
   ```

4. **Acesse o Setup Wizard:**
   - Acesse: `http://localhost:5173`
   - Siga o guia passo a passo
   - Configure periféricos e fiscal

5. **Comece a usar:**
   - Cadastre produtos
   - Configure usuários
   - Teste uma venda

## 📚 **Documentação**

### **Guias Principais**
- 📄 [Guia Completo](GUIA-COMPLETO-SISTEMA.md) - Documentação principal
- 📄 [Guia de Instalação](GUIA-INSTALACAO.md) - Instalação detalhada
- 📄 [Guia da Impressora](GUIA-IMPRESSORA.md) - Configuração de periféricos
- 📄 [Guia do Scanner](GUIA-SCANNER-CODIGO-BARRAS.md) - Scanner de código de barras
- 📄 [Guia Fiscal](GUIA-SISTEMA-FISCAL.md) - Sistema fiscal

### **Scripts SQL**
- 🔧 [Corrigir Periféricos](tools/fix-peripherals-tables.sql)
- 🔧 [Tabelas Fiscais](tools/create-fiscal-tables.sql)
- 🔧 [Logs de Scanner](tools/create-scan-logs-table.sql)

## 🏪 **Instalação em Loja**

### **Processo Simplificado**
1. **Baixar instalador:**
   ```bash
   wget https://github.com/seu-usuario/pdv-fiodegala/releases/latest/download/install.sh
   ```

2. **Executar instalação:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Configurar inicialização automática:**
   ```bash
   sudo systemctl enable pdv-fiodegala
   ```

### **Configuração de Rede**
- IP fixo recomendado
- Firewall configurado
- Backup automático

## 🧪 **Testes**

### **Testes Automáticos**
```bash
# Testar sistema básico
curl http://localhost:4000/api/status

# Testar frontend
curl http://localhost:5173

# Testar periféricos
# Use o Setup Wizard
```

### **Testes Manuais**
- ✅ Login e autenticação
- ✅ CRUD de produtos
- ✅ Sistema de vendas
- ✅ Controle de estoque
- ✅ Impressora térmica
- ✅ Scanner de código de barras
- ✅ Sistema fiscal

## 🚨 **Suporte**

### **Problemas Comuns**
- **Backend não conectado** - Verificar porta 4000
- **Banco não conectado** - Verificar variáveis de ambiente
- **Impressora não funciona** - Verificar drivers USB
- **Scanner não lê** - Verificar permissões

### **Contato**
- 📧 **Email:** suporte@fiodegala.com
- 📱 **WhatsApp:** (11) 99999-9999
- 📞 **Telefone:** (11) 3333-3333

### **Comunidade**
- 🐙 **GitHub:** [Issues](https://github.com/seu-usuario/pdv-fiodegala/issues)
- 📖 **Wiki:** Documentação adicional
- 💬 **Discord:** Comunidade de usuários

## 🎯 **Roadmap**

### **Versão Atual (1.0.0)**
- ✅ Sistema completo de PDV
- ✅ Periféricos integrados
- ✅ Sistema fiscal
- ✅ Setup Wizard

### **Próximas Versões**
- 🔮 **App mobile** para vendedores
- 🔮 **Integração com ERP**
- 🔮 **Sistema de delivery**
- 🔮 **Gateway de pagamento**
- 🔮 **Relatórios avançados**

## 📄 **Licença**

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 **Contribuição**

Contribuições são bem-vindas! Por favor, leia o [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e o processo para enviar pull requests.

## 🙏 **Agradecimentos**

- **Supabase** - Banco de dados e autenticação
- **React** - Framework frontend
- **Node.js** - Runtime JavaScript
- **Tailwind CSS** - Framework CSS
- **Comunidade open source** - Bibliotecas e ferramentas

---

## 🎉 **Resultado Final**

**Sistema PDV completo e profissional!**

### **Benefícios**
- ✅ **Instalação automatizada** com Setup Wizard
- ✅ **Interface moderna** e responsiva
- ✅ **Periféricos integrados** (impressora + scanner)
- ✅ **Sistema fiscal** completo (NF-e + SAT)
- ✅ **Documentação completa** e detalhada
- ✅ **Suporte técnico** disponível

### **Fluxo Completo**
1. **Escaneamento** → Scanner lê código do produto
2. **Busca** → Sistema encontra produto no banco
3. **Adição** → Produto adicionado ao carrinho
4. **Venda** → Finalização da venda
5. **Impressão** → Recibo impresso automaticamente
6. **Fiscal** → Documento fiscal gerado automaticamente
7. **Estoque** → Estoque atualizado automaticamente

**Sistema pronto para uso em produção!** 🚀

---

*PDV Fio de Gala - Versão 1.0.0*
*Última atualização: Julho 2025* 