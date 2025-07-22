import { supabase } from './supabaseClient';

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STOCK: 'stock',
  SALESPERSON: 'salesperson',
  NONE: 'none', // novo: usuário sem role
};

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_STOCK: 'manage_stock',
  APPLY_DISCOUNTS: 'apply_discounts',
  CANCEL_SALES: 'cancel_sales',
  VIEW_REPORTS: 'view_reports',
  PROCESS_SALES: 'process_sales',
  VIEW_ALL_STORES_DATA: 'view_all_stores_data',
  SHARE_STOCK: 'share_stock',
  CASH_REGISTER_MANAGEMENT: 'cash_register_management',
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.APPLY_DISCOUNTS,
    PERMISSIONS.CANCEL_SALES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.PROCESS_SALES,
    PERMISSIONS.VIEW_ALL_STORES_DATA,
    PERMISSIONS.SHARE_STOCK,
    PERMISSIONS.CASH_REGISTER_MANAGEMENT
  ],
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.APPLY_DISCOUNTS,
    PERMISSIONS.CANCEL_SALES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.PROCESS_SALES,
    PERMISSIONS.SHARE_STOCK,
    PERMISSIONS.CASH_REGISTER_MANAGEMENT
  ],
  [USER_ROLES.CASHIER]: [
    PERMISSIONS.PROCESS_SALES
  ],
  [USER_ROLES.STOCK]: [
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.SHARE_STOCK
  ],
  [USER_ROLES.SALESPERSON]: [
    PERMISSIONS.PROCESS_SALES,
  ],
  [USER_ROLES.NONE]: [] // sem permissão
};

export const hasPermission = (userRole, permission) => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  if (!user) return null;
  return JSON.parse(user);
};

export const setCurrentUser = (user) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

// Busca todos os usuários via backend
export const getUsers = async () => {
  try {
    console.log('🔄 Buscando usuários...');
    
    // Buscar usuários do backend
    const response = await fetch('/api/usuarios', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuários');
    }

    const usersData = await response.json();
    console.log('👥 Usuários do backend:', usersData.users.length);

    // Buscar roles do Supabase
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Erro ao buscar roles:', rolesError);
      return [];
    }

    console.log('🏪 Roles encontradas:', rolesData.length);
    console.log('🏪 Detalhes das roles:', rolesData);

    // Buscar stores
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('*');

    if (storesError) {
      console.error('Erro ao buscar stores:', storesError);
      return [];
    }

    console.log('🏪 Stores encontradas:', storesData.length);

    // Criar mapa de stores
    const storesMap = {};
    storesData.forEach(store => {
      storesMap[store.id] = store;
    });

    // Processar usuários
    const processedUsers = usersData.users.map((u) => {
      console.log('🔍 Processando usuário:', u.id, 'Nome:', u.user_metadata?.name || u.email.split('@')[0]);
      
      // Buscar role do usuário
      const userRole = rolesData.find(r => r.user_id === u.id);
      console.log('🔍 Role encontrada para usuário:', u.id, ':', userRole);
      
      // Buscar store associada
      const storeData = userRole?.store_id ? storesMap[userRole.store_id] : null;
      console.log('🔍 Store encontrada para usuário:', u.id, 'store_id:', userRole?.store_id, 'store:', storeData);
      
      const userData = {
        id: u.id,
        username: u.email,
        name: u.user_metadata?.name || u.email.split('@')[0],
        role: userRole ? userRole.role : 'none',
        store_id: userRole ? userRole.store_id : null,
        active: userRole ? userRole.active : true,
        created_at: u.created_at,
        stores: storeData
      };
      
      console.log('👤 Usuário processado:', userData.name, 'Role:', userData.role, 'Loja:', userData.stores?.name || 'Não definida', 'Ativo:', userData.active);
      return userData;
    });

    return processedUsers;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

// Permite login de qualquer usuário do Auth, role default = 'none'
export const authenticateUser = async (email, password) => {
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !signInData?.user) {
      console.error('[AUTH] Erro ao autenticar:', signInError);
      return null;
    }

    // Sem consulta à tabela user_roles
    let role = 'none';
    if (signInData.user.email === 'admin@server.com') {
      role = 'admin';
    }

    return {
      id: signInData.user.id,
      email: signInData.user.email,
      name: signInData.user.user_metadata?.name || email.split('@')[0],
      role,
      store_id: null,
      active: true,
      created_at: signInData.user.created_at,
      stores: null
    };
  } catch (error) {
    console.error('[AUTH] Erro inesperado:', error);
    return null;
  }
};

export const addUser = async (userData) => {
  // Cria usuário no Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: userData.username,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      name: userData.name
    }
  });
  if (authError) throw new Error(authError.message);
  return {
    id: authUser.user.id,
    username: authUser.user.email,
    name: userData.name,
    role: USER_ROLES.NONE,
    store_id: null,
    active: true,
    created_at: authUser.user.created_at,
    stores: null
  };
};

export const updateUserRole = async (userId, newRole, storeId = null) => {
  // Remove roles antigas
  await supabase.from('user_roles').update({ active: false }).eq('user_id', userId);
  // Cria nova role
  const { data, error } = await supabase.from('user_roles').insert([{
    user_id: userId,
    role: newRole,
    store_id: storeId,
    active: true
  }]);
  if (error) throw new Error(error.message);
  return data;
};

export const updateUserViaBackend = async (userId, userData) => {
  try {
    const response = await fetch(`/api/usuarios/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        role: userData.role,
        store_id: userData.store_id,
        password: userData.password || undefined
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro do backend (update):', errorData);
      throw new Error(errorData.error || 'Erro ao atualizar usuário');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Erro na comunicação (update):', error);
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

export const deleteUserViaBackend = async (userId) => {
  try {
    const response = await fetch(`/api/usuarios/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao deletar usuário');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

export const getStores = async (excludeOnline = false) => {
  let query = supabase
    .from('stores')
    .select('*')
    .order('name', { ascending: true });
  if (excludeOnline) {
    query = query.eq('is_online_store', false);
  }
  const { data, error } = await query;
  if (error) {
    return [];
  }
  return data;
};

export const toggleUserActive = async (userId, active) => {
  try {
    const response = await fetch(`/api/usuarios/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        active: active
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro do backend:', errorData);
      throw new Error(errorData.error || 'Erro ao alterar status do usuário');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Erro na comunicação:', error);
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Função para criar role automaticamente para usuários sem role
export const createUserRole = async (userId, role = USER_ROLES.NONE, storeId = null) => {
  try {
    const response = await fetch(`/api/usuarios/${userId}/default-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: role,
        store_id: storeId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar role para o usuário');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Erro ao criar role via backend:', error);
    throw error;
  }
};