# 🚀 **INSTALAÇÃO RÁPIDA - PDV FIO DE GALA**

## ⚡ **INSTALAÇÃO EM 5 MINUTOS**

### **1. PRÉ-REQUISITOS (2 min)**
```powershell
# Verificar se Git está instalado
git --version

# Se não estiver, baixe: https://git-scm.com/download/win

# Verificar se Node.js está instalado
node --version
npm --version

# Se não estiver, baixe: https://nodejs.org/
```

### **2. BAIXAR PROJETO (1 min)**
```powershell
# Navegar para documentos
cd $env:USERPROFILE\Documents

# Clonar projeto
git clone https://github.com/psnpupo/pdv-fiodegala.git

# Entrar na pasta
cd pdv-fiodegala
```

### **3. INSTALAR DEPENDÊNCIAS (2 min)**
```powershell
# Instalar frontend
npm install

# Instalar backend
cd backend
npm install
cd ..
```

### **4. CONFIGURAR BANCO (2 min)**
1. **Criar projeto no Supabase:**
   - https://supabase.com → Novo Projeto
   - Copie URL e Chave anônima

2. **Executar scripts SQL:**
   - SQL Editor → Cole e execute:
   ```sql
   -- Script 1: Fix Peripherals
   ALTER TABLE public.detected_devices
   ADD CONSTRAINT detected_devices_device_id_unique UNIQUE (device_id);
   
   -- Script 2: Fiscal Tables
   CREATE TABLE IF NOT EXISTS public.fiscal_configs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
       config JSONB NOT NULL DEFAULT '{}',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Script 3: Scan Logs
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

3. **Configurar .env:**
   ```powershell
   copy backend\env.example backend\.env
   notepad backend\.env
   ```
   
   **Conteúdo:**
   ```env
   SUPABASE_URL=sua_url_aqui
   SUPABASE_ANON_KEY=sua_chave_aqui
   PORT=4000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

### **5. INICIAR SISTEMA (1 min)**
```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (novo PowerShell)
npm run dev
```

### **6. ACESSAR E CONFIGURAR**
1. **Acesse:** `http://localhost:5173`
2. **Setup Wizard aparecerá automaticamente**
3. **Siga os passos:**
   - Dados da empresa
   - Configuração fiscal (CNPJ: 00.000.000/0001-00)
   - Periféricos (desativar para teste)
   - Usuário admin (admin@fiodegala.com / 123456)
   - Testes
   - Finalizar

---

## 🎯 **TESTES RÁPIDOS**

### **Login:**
- Email: `admin@fiodegala.com`
- Senha: `123456`

### **Cadastrar Produto:**
1. Vá em "Produtos"
2. "Novo Produto"
3. Preencha dados básicos
4. Salve

### **Fazer Venda:**
1. Vá em "PDV"
2. Adicione produto ao carrinho
3. Finalize venda

---

## 🔧 **PROBLEMAS COMUNS**

### **Git não reconhecido:**
- Reinicie PowerShell
- Ou: `$env:PATH += ";C:\Program Files\Git\bin"`

### **Node não reconhecido:**
- Reinicie PowerShell
- Reinstale Node.js

### **Erro de dependências:**
```powershell
rmdir /s node_modules
rmdir /s backend\node_modules
npm install
cd backend && npm install && cd ..
```

### **Erro Supabase:**
- Verifique credenciais no `.env`
- Execute scripts SQL novamente

---

## ✅ **CHECKLIST FINAL**

- [ ] Git instalado
- [ ] Node.js instalado
- [ ] Projeto clonado
- [ ] Dependências instaladas
- [ ] Supabase configurado
- [ ] Scripts SQL executados
- [ ] .env configurado
- [ ] Backend rodando
- [ ] Frontend rodando
- [ ] Setup Wizard acessível
- [ ] Login funcionando
- [ ] Produto cadastrado
- [ ] Venda realizada

---

## 🎉 **SUCESSO!**

Se chegou até aqui, o PDV está funcionando perfeitamente!

**Próximos passos:**
1. Configurar periféricos reais
2. Configurar dados fiscais reais
3. Cadastrar produtos da loja
4. Treinar funcionários

**Suporte:** Verifique `GUIA-COMPLETO-SISTEMA.md` 