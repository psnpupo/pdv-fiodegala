# Guia de Implementação - Sistema de Categorias

## Visão Geral

Este guia descreve a implementação do sistema de categorias para o PDV Fio de Gala, que permite organizar produtos em categorias personalizáveis.

## Funcionalidades Implementadas

### 1. Gerenciamento de Categorias
- ✅ Criar novas categorias
- ✅ Editar categorias existentes
- ✅ Deletar categorias (com validação de uso)
- ✅ Ativar/desativar categorias
- ✅ Buscar categorias
- ✅ Visualizar categorias em cards organizados

### 2. Campos da Categoria
- **Nome**: Nome da categoria (obrigatório)
- **Descrição**: Descrição opcional da categoria
- **Cor**: Cor personalizada para identificação visual
- **Ícone**: Ícone representativo da categoria
- **Status**: Ativa/Inativa
- **Loja**: Associação com loja específica (para multi-loja)

### 3. Integração com Produtos
- ✅ Formulário de produtos atualizado para usar categorias do banco
- ✅ Validação para evitar exclusão de categorias em uso
- ✅ Filtros por categoria nos produtos

## Estrutura do Banco de Dados

### Tabela `categories`
```sql
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NULL,
  color text NULL DEFAULT '#3B82F6',
  icon text NULL,
  active boolean NOT NULL DEFAULT true,
  store_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT categories_name_store_id_key UNIQUE (name, store_id)
);
```

### Segurança
- A filtragem por loja é feita no código JavaScript
- Admins têm acesso a todas as categorias
- Usuários normais só veem categorias da sua loja ou categorias globais (sem loja específica)

## Arquivos Criados/Modificados

### Novos Arquivos
- `tools/create-categories-table.sql` - Script SQL completo (com RLS)
- `tools/create-categories-table-simple.sql` - Script SQL simplificado (recomendado)
- `src/lib/categoriesStorage.js` - Funções de acesso ao banco
- `src/components/Categories.jsx` - Componente principal
- `src/components/categories/CategoryList.jsx` - Lista de categorias
- `src/components/categories/CategoryForm.jsx` - Formulário de categoria
- `src/components/ui/badge.jsx` - Componente Badge
- `src/components/ui/textarea.jsx` - Componente Textarea
- `src/components/ui/switch.jsx` - Componente Switch

### Arquivos Modificados
- `src/lib/auth.js` - Adicionada permissão MANAGE_CATEGORIES
- `src/components/Layout.jsx` - Adicionado item de menu
- `src/App.jsx` - Adicionada rota para categorias
- `src/components/products/ProductForm.jsx` - Integração com categorias
- `src/components/products/ProductFormFields.jsx` - Campo de categoria dinâmico

## Permissões

### Nova Permissão
- `MANAGE_CATEGORIES`: Permite gerenciar categorias

### Roles com Acesso
- **Admin**: Acesso completo a todas as categorias
- **Manager**: Pode gerenciar categorias da sua loja
- **Stock**: Pode gerenciar categorias da sua loja

## Como Usar

### 1. Executar o Script SQL
Execute o arquivo `tools/create-categories-table-simple.sql` no seu banco Supabase para criar a tabela. Este script não inclui RLS para evitar problemas de compatibilidade.

### 2. Acessar o Sistema
- Faça login com um usuário que tenha permissão `MANAGE_CATEGORIES`
- Acesse o menu "Categorias" na barra lateral

### 3. Criar Categorias
- Clique em "Nova Categoria"
- Preencha os campos obrigatórios (nome)
- Configure cor, ícone e descrição opcional
- Salve a categoria

### 4. Usar em Produtos
- Ao criar/editar produtos, o campo categoria agora mostrará as categorias do banco
- As categorias são filtradas por loja (exceto para admins)

## Categorias Padrão

O sistema inclui algumas categorias padrão:
- Roupas (Azul, ícone: shirt)
- Calçados (Verde, ícone: footprints)
- Acessórios (Amarelo, ícone: watch)
- Esportes (Vermelho, ícone: dumbbell)
- Infantil (Roxo, ícone: baby)
- Casa (Ciano, ícone: home)

## Validações

### Exclusão de Categorias
- Não é possível deletar categorias que estão sendo usadas por produtos
- O sistema verifica se há produtos associados antes de permitir a exclusão

### Nomes Únicos
- Nomes de categorias devem ser únicos por loja
- Admins podem ter categorias com o mesmo nome em lojas diferentes

## Próximos Passos

### Melhorias Sugeridas
1. **Filtros Avançados**: Adicionar filtros por status, data de criação, etc.
2. **Bulk Operations**: Operações em lote (ativar/desativar múltiplas categorias)
3. **Importação/Exportação**: Importar categorias de CSV/Excel
4. **Categorias Aninhadas**: Suporte a subcategorias
5. **Estatísticas**: Mostrar quantos produtos estão em cada categoria

### Integrações Futuras
1. **Relatórios**: Incluir categorias nos relatórios de vendas
2. **Dashboard**: Gráficos de produtos por categoria
3. **API**: Endpoints para integração com outros sistemas

## Troubleshooting

### Problemas Comuns

1. **Categoria não aparece no formulário de produtos**
   - Verifique se a categoria está ativa
   - Verifique se o usuário tem acesso à loja da categoria

2. **Erro ao deletar categoria**
   - Verifique se há produtos usando essa categoria
   - Remova a associação dos produtos primeiro

3. **Permissão negada**
   - Verifique se o usuário tem a permissão `MANAGE_CATEGORIES`
   - Verifique se o usuário está associado à loja correta

### Logs
Os erros são logados no console do navegador com prefixos específicos:
- `[CATEGORIES]` para operações de categorias
- `[PRODUCTS]` para operações de produtos relacionadas a categorias 