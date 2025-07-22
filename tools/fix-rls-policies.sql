-- CORRIGIR POLÍTICAS RLS: Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas existentes
SELECT 'Políticas existentes:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- 2. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Enable read access for all users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_roles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_roles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_roles;

-- 3. Criar políticas corretas
-- Política para SELECT (ler todas as roles)
CREATE POLICY "Enable read access for all users" ON user_roles
FOR SELECT USING (true);

-- Política para INSERT (apenas usuários autenticados)
CREATE POLICY "Enable insert for authenticated users only" ON user_roles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE (apenas usuários autenticados)
CREATE POLICY "Enable update for authenticated users only" ON user_roles
FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE (apenas usuários autenticados)
CREATE POLICY "Enable delete for authenticated users only" ON user_roles
FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Verificar se RLS está habilitado
SELECT 'RLS habilitado:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_roles';

-- 5. Habilitar RLS se não estiver
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Verificar resultado
SELECT 'Políticas criadas:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_roles'; 