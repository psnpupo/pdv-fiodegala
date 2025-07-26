-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
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

-- Criar trigger para atualizar updated_at
CREATE TRIGGER set_timestamp_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Adicionar RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias (versão simplificada)
CREATE POLICY "Usuários podem ver categorias" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir categorias" ON categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar categorias" ON categories
  FOR UPDATE USING (true);

CREATE POLICY "Usuários podem deletar categorias" ON categories
  FOR DELETE USING (true);

-- Inserir algumas categorias padrão
INSERT INTO categories (name, description, color, icon) VALUES
  ('Roupas', 'Vestuário em geral', '#3B82F6', 'shirt'),
  ('Calçados', 'Sapatos, tênis e sandálias', '#10B981', 'footprints'),
  ('Acessórios', 'Bolsas, cintos, bijuterias', '#F59E0B', 'watch'),
  ('Esportes', 'Roupas e equipamentos esportivos', '#EF4444', 'dumbbell'),
  ('Infantil', 'Roupas para crianças', '#8B5CF6', 'baby'),
  ('Casa', 'Produtos para casa', '#06B6D4', 'home')
ON CONFLICT (name, store_id) DO NOTHING; 