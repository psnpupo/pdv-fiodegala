-- Criar tabela de categorias (versão simplificada)
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
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Inserir algumas categorias padrão
INSERT INTO categories (name, description, color, icon) VALUES
  ('Roupas', 'Vestuário em geral', '#3B82F6', 'shirt'),
  ('Calçados', 'Sapatos, tênis e sandálias', '#10B981', 'footprints'),
  ('Acessórios', 'Bolsas, cintos, bijuterias', '#F59E0B', 'watch'),
  ('Esportes', 'Roupas e equipamentos esportivos', '#EF4444', 'dumbbell'),
  ('Infantil', 'Roupas para crianças', '#8B5CF6', 'baby'),
  ('Casa', 'Produtos para casa', '#06B6D4', 'home')
ON CONFLICT (name, store_id) DO NOTHING; 