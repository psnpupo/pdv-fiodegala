const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.createUsuario = async (req, res) => {
  try {
    console.log('Body recebido:', req.body);
    const { email, password, name, role, store_id } = req.body;

    // Validações básicas
    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        error: 'E-mail, senha, nome e role são obrigatórios.' 
      });
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Criar registro na tabela user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role,
        store_id: store_id || null,
        active: true
      });

    if (roleError) {
      // Se falhar ao criar role, deletar o usuário do Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Erro ao criar role do usuário.' });
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role,
        store_id
      }
    });

  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

exports.listUsuarios = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao listar usuários.' });
  }
}; 

exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, store_id, password, active } = req.body;

    console.log('🔄 Atualizando usuário:', id, 'com dados:', { name, role, store_id, password: password ? '***' : undefined, active });

    // Atualizar dados do usuário no Auth primeiro
    const updateData = {};
    if (name) updateData.user_metadata = { name };
    if (password) updateData.password = password;

    if (Object.keys(updateData).length > 0) {
      const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(id, updateData);
      if (authError) {
        console.error('Erro ao atualizar usuário no Auth:', authError);
        return res.status(500).json({ error: 'Erro ao atualizar dados do usuário.' });
      }
      console.log('✅ Usuário atualizado no Auth');
    }

    // Verificar se o usuário tem role na tabela user_roles
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', id);

    console.log('🔍 Roles existentes para usuário:', id, ':', existingRoles);

    // Se não tem role, criar uma role padrão
    if (!existingRoles || existingRoles.length === 0) {
      console.log('⚠️ Usuário sem role, criando role padrão');
      const newRoleData = {
        user_id: id,
        role: role || 'none',
        store_id: store_id || null,
        active: active !== undefined ? active : true
      };
      console.log('📝 Dados da nova role:', newRoleData);
      
      const { data: createdRole, error: createRoleError } = await supabase
        .from('user_roles')
        .insert(newRoleData)
        .select()
        .single();

      if (createRoleError) {
        console.error('Erro ao criar role padrão:', createRoleError);
        return res.status(500).json({ error: 'Erro ao criar role padrão para o usuário.' });
      }
      console.log('✅ Role padrão criada com sucesso:', createdRole);
    } else {
      console.log('✅ Usuário já tem roles:', existingRoles.length, 'roles encontradas');
      
      // Atualizar role existente
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({
          role: role || existingRoles[0].role,
          store_id: store_id !== undefined ? store_id : existingRoles[0].store_id,
          active: active !== undefined ? active : existingRoles[0].active
        })
        .eq('user_id', id);

      if (updateError) {
        console.error('Erro ao atualizar role:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar role do usuário.' });
      }
      console.log('✅ Role atualizada com sucesso');
    }

    res.json({ 
      message: 'Usuário atualizado com sucesso!', 
      user: { id, name, role, store_id } 
    });
  } catch (err) {
    console.error('Erro geral:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Deletar usuário do Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Deletar roles da tabela user_roles
    await supabase.from('user_roles').delete().eq('user_id', id);

    res.json({ message: 'Usuário deletado com sucesso!' });

  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Atribuir role a usuário
exports.assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, store_id } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role é obrigatória.' });
    }

    // Desativar roles antigas
    await supabase
      .from('user_roles')
      .update({ active: false })
      .eq('user_id', id);

    // Criar nova role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: id,
        role: role,
        store_id: store_id || null,
        active: true
      }]);

    if (roleError) {
      console.error('Erro ao atribuir role:', roleError);
      return res.status(500).json({ error: 'Erro ao atribuir role ao usuário.' });
    }

    res.json({ message: 'Role atribuída com sucesso!' });

  } catch (err) {
    console.error('Erro ao atribuir role:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Criar role padrão para usuário sem role
exports.createDefaultRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role = 'none', store_id = null } = req.body;

    // Verificar se já existe uma role ativa
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', id)
      .eq('active', true)
      .single();

    if (existingRole) {
      return res.json({ message: 'Usuário já tem role ativa.', role: existingRole });
    }

    // Criar nova role
    const { data: newRole, error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: id,
        role: role,
        store_id: store_id,
        active: true
      }])
      .select()
      .single();

    if (roleError) {
      console.error('❌ Erro ao criar role:', roleError);
      return res.status(500).json({ error: 'Erro ao criar role para o usuário.' });
    }

    res.json({ message: 'Role criada com sucesso!', role: newRole });

  } catch (err) {
    console.error('Erro ao criar role padrão:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}; 