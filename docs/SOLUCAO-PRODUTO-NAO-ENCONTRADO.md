# 🔍 Solução: Produto não encontrado no POS

## 🎯 **Problema:**
Ao tentar buscar um produto no POS (Frente de Caixa), aparece o erro:
- "Produto não encontrado"
- "Erro na comunicação com o backend"

## 🔍 **Causa:**
O banco de dados não possui produtos cadastrados ou os produtos não têm códigos de barras configurados.

## ✅ **Solução:**

### **1. Verificar se há produtos no banco:**

#### **Acessar o Supabase:**
1. Acesse: https://supabase.com
2. Entre no seu projeto
3. Vá em **SQL Editor**

#### **Executar consulta:**
```sql
SELECT 
    name,
    barcode,
    price,
    stock,
    active
FROM products 
WHERE active = true
ORDER BY name;
```

### **2. Se não há produtos - Criar produtos de teste:**

#### **Executar o script de produtos de teste:**
1. No **SQL Editor** do Supabase
2. Copie e cole o conteúdo do arquivo: `tools/create-test-products.sql`
3. Clique em **Run**

#### **Produtos que serão criados:**
- **Camiseta Básica** - Código: `7891234567890` - Preço: R$ 29,90
- **Calça Jeans** - Código: `7891234567891` - Preço: R$ 89,90
- **Tênis Esportivo** - Código: `7891234567892` - Preço: R$ 129,90
- **Vestido Casual** - Código: `7891234567893` - Preço: R$ 69,90
- **Jaqueta Jeans** - Código: `7891234567894` - Preço: R$ 149,90

### **3. Testar no POS:**

#### **Acessar o sistema:**
1. Abrir: `http://localhost:5173`
2. Fazer login
3. Ir para **Frente de Caixa**

#### **Testar busca de produtos:**
1. **Digitar código:** `7891234567890`
2. **Clicar em buscar** ou pressionar Enter
3. **Produto deve aparecer:** "Camiseta Básica"

#### **Testar botões rápidos:**
- Clicar em **"Camiseta Básica"**
- Clicar em **"Calça Jeans"**
- Clicar em **"Tênis Esportivo"**

### **4. Se ainda não funcionar:**

#### **Verificar backend:**
```bash
# Testar se o backend está funcionando
curl http://localhost:4000/api/status

# Testar busca de produto específico
curl http://localhost:4000/api/sales/products/barcode/7891234567890
```

#### **Verificar logs do backend:**
```bash
# No terminal do backend
cd backend && npm start
```

#### **Verificar logs do frontend:**
- Abrir **DevTools** (F12)
- Ir na aba **Console**
- Verificar se há erros

### **5. Cadastrar seus próprios produtos:**

#### **Via interface:**
1. Acessar: **Produtos**
2. Clicar em **"Adicionar Produto"**
3. Preencher:
   - **Nome:** Nome do produto
   - **Código de Barras:** Código único
   - **Preço:** Preço de venda
   - **Estoque:** Quantidade disponível
4. **Salvar**

#### **Via SQL (massa):**
```sql
-- Exemplo para adicionar um produto
INSERT INTO products (
    id,
    name,
    description,
    barcode,
    price,
    stock,
    active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Nome do Produto',
    'Descrição do produto',
    '1234567890123',
    99.90,
    50,
    true,
    NOW(),
    NOW()
);
```

## 🎯 **Resultado esperado:**

### **✅ Funcionando corretamente:**
- Produtos aparecem ao buscar por código de barras
- Botões rápidos funcionam
- Produtos são adicionados ao carrinho
- Preços são calculados corretamente

### **✅ Produtos de teste disponíveis:**
- **7891234567890** → Camiseta Básica (R$ 29,90)
- **7891234567891** → Calça Jeans (R$ 89,90)
- **7891234567892** → Tênis Esportivo (R$ 129,90)
- **7891234567893** → Vestido Casual (R$ 69,90)
- **7891234567894** → Jaqueta Jeans (R$ 149,90)

## 🚨 **Se ainda der erro:**

### **Verificar configurações:**
1. **Backend rodando:** `http://localhost:4000`
2. **Frontend rodando:** `http://localhost:5173`
3. **Proxy configurado:** Vite redirecionando `/api` para backend
4. **Banco conectado:** Supabase funcionando

### **Logs úteis:**
```bash
# Backend
cd backend && npm start

# Frontend
npm run dev
```

---

## 🎉 **Pronto!**

**Após seguir estes passos, o POS deve funcionar corretamente com busca de produtos!** 🚀 