import { supabase } from './supabaseClient';
import { getCurrentUser, hasPermission, PERMISSIONS, getStores as getAllStoresAuth, USER_ROLES } from './auth';

const applyStoreFilter = (queryBuilder, tableAlias = null, options = { specificStoreId: null }) => {
  const user = getCurrentUser();
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (options.specificStoreId) {
    return queryBuilder.eq(`${prefix}store_id`, options.specificStoreId);
  }

  if (user && user.store_id && !user.stores?.is_online_store && !hasPermission(user.role, PERMISSIONS.VIEW_ALL_STORES_DATA)) {
    return queryBuilder.eq(`${prefix}store_id`, user.store_id);
  }
  return queryBuilder;
};

export const getCashRegisterLogs = async () => {
  let query = supabase
    .from('cash_register_logs')
    .select('*, stores(name, is_online_store)')
    .order('created_at', { ascending: false });

  query = applyStoreFilter(query, 'cash_register_logs');
  
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cash register logs:', error);
    return [];
  }
  return data;
};

export const addCashRegisterLog = async (logData) => {
  const user = getCurrentUser();
  const dataToInsert = { ...logData };
  
  if (!dataToInsert.store_id) {
    dataToInsert.store_id = user?.store_id;
  }

  if (!dataToInsert.store_id && !hasPermission(user?.role, PERMISSIONS.VIEW_ALL_STORES_DATA)) {
      const onlineStores = await getAllStoresAuth();
      const onlineStore = onlineStores.find(s => s.is_online_store);
      if (user?.role === USER_ROLES.ADMIN && onlineStore) {
          dataToInsert.store_id = onlineStore.id; 
      } else {
        console.error("Error: store_id is required for this user to log cash register activity.");
        throw new Error("store_id é obrigatório para log de caixa.");
      }
  }

  const { data, error } = await supabase
    .from('cash_register_logs')
    .insert([dataToInsert])
    .select()
    .single();
  if (error) {
    console.error('Error adding cash register log:', error);
    throw error;
  }
  return data;
};

export const getCurrentCashRegisterState = async () => {
  const user = getCurrentUser();
  let query = supabase
    .from('cash_register_logs')
    .select('*, stores(name, is_online_store)') 
    .order('created_at', { ascending: false });
  
  let storeIdForQuery = null;

  if (user && user.store_id && !user.stores?.is_online_store && !hasPermission(user.role, PERMISSIONS.VIEW_ALL_STORES_DATA)) {
      storeIdForQuery = user.store_id;
  } else if (user && user.stores?.is_online_store) { 
      storeIdForQuery = user.store_id;
  } else if (user && user.role === USER_ROLES.ADMIN && !user.store_id) {
    const onlineStores = await getAllStoresAuth();
    const onlineStore = onlineStores.find(s => s.is_online_store);
    if (onlineStore) storeIdForQuery = onlineStore.id;
  }


  if (storeIdForQuery) {
    query = query.eq('store_id', storeIdForQuery);
  } else if (!hasPermission(user?.role, PERMISSIONS.VIEW_ALL_STORES_DATA)) {
     console.warn("Usuário sem loja definida e sem permissão para ver todos os caixas. Retornando caixa fechado.");
     return { isOpen: false, openingAmount: 0, currentAmount: 0, openedBy: null, openedAt: null, closedAt: null, id: null, store_id: null, store: null };
  }
  
  const { data, error } = await query.limit(1).maybeSingle();

  if (error) { 
    console.error('Error fetching current cash register state:', error);
    return { isOpen: false, openingAmount: 0, currentAmount: 0, openedBy: null, openedAt: null, closedAt: null, id: null, store_id: null, store: null };
  }
  
  if (!data) { 
    return { isOpen: false, openingAmount: 0, currentAmount: 0, openedBy: null, openedAt: null, closedAt: null, id: null, store_id: storeIdForQuery, store: user?.stores };
  }

  const isOpen = data.type !== 'close';

  return {
    id: data.id,
    isOpen: isOpen,
    openingAmount: data.type === 'open' ? data.initial_amount : (isOpen ? data.initial_amount : 0), 
    currentAmount: data.current_amount,
    openedBy: isOpen && data.type === 'open' ? data.user_id : (isOpen ? data.user_id : null), 
    openedAt: isOpen && data.type === 'open' ? data.created_at : (isOpen ? data.created_at : null),
    closedAt: data.type === 'close' ? data.created_at : null,
    store_id: data.store_id,
    store: data.stores 
  };
};