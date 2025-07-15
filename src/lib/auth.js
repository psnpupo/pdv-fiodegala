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
  SHARE_STOCK: 'share_stock'
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
    PERMISSIONS.SHARE_STOCK
  ],
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.APPLY_DISCOUNTS,
    PERMISSIONS.CANCEL_SALES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.PROCESS_SALES,
    PERMISSIONS.SHARE_STOCK
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

// Busca todos os usuários do Auth e suas roles (se houver)
export const getUsers = async () => {
  // 1. Busca todos os usuários do Auth
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Erro ao buscar usuários do Auth:', usersError);
    return [];
  }
  // 2. Busca todas as roles
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('*, stores (id, name, is_online_store)');
  if (rolesError) {
    console.error('Erro ao buscar roles:', rolesError);
    return [];
  }
  // 3. Junta os dados
  return usersData.users.map(u => {
    const roleObj = rolesData.find(r => r.user_id === u.id && r.active);
    return {
      id: u.id,
      username: u.email,
      name: u.user_metadata?.name || u.email.split('@')[0],
      role: roleObj ? roleObj.role : USER_ROLES.NONE,
      store_id: roleObj ? roleObj.store_id : null,
      active: roleObj ? roleObj.active : true,
      created_at: u.created_at,
      stores: roleObj ? roleObj.stores : null
    };
  });
};

// Permite login de qualquer usuário do Auth, role default = 'none'
export const authenticateUser = async (email, password) => {
  try {
    console.log('[AUTH] Iniciando signInWithPassword');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    console.log('[AUTH] Resultado do signInWithPassword:', signInData, signInError);

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