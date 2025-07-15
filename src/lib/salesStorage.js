import { supabase } from './supabaseClient';
import { getCurrentUser, hasPermission, PERMISSIONS, getStores as getAllStoresAuth, USER_ROLES } from './auth';
import { addStockMovement } from './stockMovementsStorage';
import { recalculateOnlineStock } from './productsStorage';

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

export const getSales = async () => {
  let query = supabase
    .from('sales')
    .select('*, customers(name), stores(name, is_online_store)')
    .order('created_at', { ascending: false });
  
  query = applyStoreFilter(query, 'sales');

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
  return data;
};


export const addSale = async (saleData) => {
  const user = getCurrentUser();
  const { items, payments, customerId, cashier, total, discount, subtotal, cashierId } = saleData;
  
  let saleStoreId = user?.store_id;
  if (!saleStoreId && (user?.role === USER_ROLES.ADMIN || user?.stores?.is_online_store)) {
      const onlineStores = await getAllStoresAuth();
      const onlineStore = onlineStores.find(s => s.is_online_store);
      if (onlineStore) saleStoreId = onlineStore.id;
      else throw new Error("Loja online principal não encontrada para venda online.");
  } else if (!saleStoreId) {
      throw new Error("Usuário sem loja definida para realizar venda.");
  }

  const saleToInsert = {
    customer_id: customerId,
    cashier_name: cashier,
    total_amount: total,
    discount_amount: discount,
    subtotal_amount: subtotal,
    status: 'completed',
    payment_details: payments,
    store_id: saleStoreId
  };

  const { data: newSale, error: saleError } = await supabase
    .from('sales')
    .insert([saleToInsert])
    .select()
    .single();

  if (saleError) throw saleError;

  if (newSale && items && items.length > 0) {
    const saleItemsToInsert = items.map(item => ({
      sale_id: newSale.id,
      product_id: item.productId || item.id, 
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
    if (itemsError) {
      await supabase.from('sales').delete().eq('id', newSale.id); 
      throw itemsError;
    }

    for (const item of items) {
      const productOnlineDetails = await supabase.from('products').select('id, stock, stores(id, name, is_online_store)').eq('id', item.productId).single();

      if (!productOnlineDetails.data) {
        console.error(`Produto com ID ${item.productId} não encontrado para baixa de estoque.`);
        continue;
      }

      let previousStockForMovement;
      let newStockForMovement;
      let productStoreStockIdForMovement = null;

      const isEffectivelyOnlineSale = user?.stores?.is_online_store || (user?.role === USER_ROLES.ADMIN && saleStoreId === productOnlineDetails.data.stores?.id);

      if (isEffectivelyOnlineSale) { 
        const { data: physicalStocks, error: psError } = await supabase
            .from('product_store_stock')
            .select('id, store_id, quantity, stores(name)')
            .eq('product_id', item.productId)
            .gt('quantity',0) 
            .order('quantity', { ascending: false });

        if (psError || !physicalStocks || physicalStocks.length === 0) {
            console.warn(`Venda online: Produto ${item.name} sem estoque físico distribuído. Verifique a lógica.`);
            await supabase.from('sales').delete().eq('id', newSale.id); 
            throw new Error(`Produto ${item.name} sem estoque físico distribuído para venda online.`);
        }
        
        const storeToDebit = physicalStocks.find(s => s.quantity >= item.quantity) || physicalStocks[0]; 
        
        if (storeToDebit.quantity < item.quantity) {
           await supabase.from('sales').delete().eq('id', newSale.id); 
           throw new Error(`Estoque insuficiente para ${item.name} na loja ${storeToDebit.stores.name} para cobrir venda online.`);
        }

        previousStockForMovement = storeToDebit.quantity;
        newStockForMovement = storeToDebit.quantity - item.quantity;
        productStoreStockIdForMovement = storeToDebit.id;
        
        await supabase.from('product_store_stock').update({ quantity: newStockForMovement }).eq('id', storeToDebit.id);
        await addStockMovement({
          product_id: item.productId,
          user_id: cashierId,
          type: 'sale_online_physical_debit', 
          quantity: item.quantity,
          previous_stock: previousStockForMovement,
          new_stock: newStockForMovement,
          reason: `Venda Online #${newSale.id} debitada da loja ${storeToDebit.stores.name}`,
          related_sale_id: newSale.id,
          store_id: storeToDebit.store_id, 
          stock_type: 'physical_store',
          product_store_stock_id: productStoreStockIdForMovement
        });

      } else { 
        const { data: storeStock, error: ssError } = await supabase
          .from('product_store_stock')
          .select('id, quantity')
          .eq('product_id', item.productId)
          .eq('store_id', saleStoreId)
          .single();

        if (ssError || !storeStock) {
          await supabase.from('sales').delete().eq('id', newSale.id); 
          throw new Error(`Estoque não encontrado para ${item.name} na loja (ID: ${saleStoreId}).`);
        }
        
        previousStockForMovement = storeStock.quantity;
        newStockForMovement = storeStock.quantity - item.quantity;
        productStoreStockIdForMovement = storeStock.id;

        if (newStockForMovement < 0) {
             await supabase.from('sales').delete().eq('id', newSale.id); 
             throw new Error(`Estoque insuficiente para ${item.name} na loja.`);
        }
        
        await supabase.from('product_store_stock').update({ quantity: newStockForMovement }).eq('id', storeStock.id);
        await addStockMovement({
          product_id: item.productId,
          user_id: cashierId,
          type: 'sale_physical_store',
          quantity: item.quantity,
          previous_stock: previousStockForMovement,
          new_stock: newStockForMovement,
          reason: `Venda #${newSale.id}`,
          related_sale_id: newSale.id,
          store_id: saleStoreId,
          stock_type: 'physical_store',
          product_store_stock_id: productStoreStockIdForMovement
        });
      }
      await recalculateOnlineStock(item.productId);
    }
  }
  
  const { data: fullSaleData, error: fullSaleError } = await supabase
    .from('sales')
    .select(`*, sale_items ( *, products (name)), stores (name, is_online_store)`)
    .eq('id', newSale.id)
    .single();

  if (fullSaleError) {
      console.error('Error fetching full sale data:', fullSaleError);
      return newSale; 
  }
  return fullSaleData;
};