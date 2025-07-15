import { supabase } from './supabaseClient';
import { getCurrentUser, hasPermission, PERMISSIONS, getStores as getAllStoresAuth, USER_ROLES } from './auth';

export const getStockMovements = async () => {
  const user = getCurrentUser();
  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      products (name, barcode),
      stores (name, is_online_store),
      product_store_stock (id)
    `)
    .order('created_at', { ascending: false });
  
  if (user && user.store_id && !user.stores?.is_online_store && !hasPermission(user.role, PERMISSIONS.VIEW_ALL_STORES_DATA)) {
      query = query.or(`store_id.eq.${user.store_id},stock_type.eq.online`);
  }
  
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching stock movements:', error);
    return [];
  }
  return data.map(m => ({
    ...m,
    productName: m.products?.name || 'Produto Desconhecido',
    userName: 'Usuário do Sistema', // Removido referência à tabela users
    storeName: m.stores?.name || (m.stock_type === 'online' ? 'Estoque Online' : 'Loja Desconhecida')
  }));
};

export const addStockMovement = async (movementData) => {
  const user = getCurrentUser();
  let dataToInsert = { ...movementData };
  
  dataToInsert.user_id = dataToInsert.user_id || user?.id;

  if (!dataToInsert.store_id && dataToInsert.stock_type !== 'online') { 
    dataToInsert.store_id = user?.store_id;
  } else if (dataToInsert.stock_type === 'online') {
    const onlineStores = await getAllStoresAuth();
    const onlineStore = onlineStores.find(s => s.is_online_store);
    if (onlineStore) dataToInsert.store_id = onlineStore.id;
  }
  
  if (!dataToInsert.store_id && dataToInsert.stock_type === 'physical_store' && !hasPermission(user?.role, PERMISSIONS.VIEW_ALL_STORES_DATA)) {
      console.error("Error: store_id is required for this user to add stock movement for a physical store.");
      throw new Error("store_id é obrigatório para movimentação em loja física.");
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert([dataToInsert])
    .select()
    .single();
  if (error) {
    console.error('Error adding stock movement:', error);
    throw error;
  }
  return data;
};