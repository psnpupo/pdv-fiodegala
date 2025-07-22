import { supabase } from './supabaseClient';
import { getCurrentUser, hasPermission, PERMISSIONS, getStores as getAllStoresAuth, USER_ROLES } from './auth';
import { addStockMovement } from './stockMovementsStorage';

export const getProducts = async (includeVariations = false) => {
  const user = getCurrentUser();
  let query = supabase
    .from('products')
    .select('*, stores(name, is_online_store)') 
    .eq('active', true)
    .order('name', { ascending: true });
  
  const { data, error } = await query; 
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  if (includeVariations && data) {
    for (let product of data) {
      if (product.product_type === 'variable') {
        const { data: variations, error: varError } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', product.id);
        if (varError) console.error(`Error fetching variations for product ${product.id}:`, varError);
        product.variations = variations || [];
      }
    }
  }
  return data;
};

export const getAllProducts = async (includeVariations = false) => {
  console.log('🔍 getAllProducts iniciado, includeVariations:', includeVariations);
  
  let query = supabase
    .from('products')
    .select('*, stores(name, is_online_store)')
    .order('name', { ascending: true });
  
  const { data, error } = await query;

  if (error) {
    console.error('❌ Erro ao buscar todos os produtos:', error);
    return [];
  }

  console.log('📋 Produtos encontrados:', data?.length || 0);
  
  if (includeVariations && data) {
    for (let product of data) {
      if (product.product_type === 'variable') {
        const { data: variations, error: varError } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', product.id);
        if (varError) console.error(`❌ Erro ao buscar variações do produto ${product.id}:`, varError);
        product.variations = variations || [];
      }
    }
  }
  
  console.log('✅ getAllProducts concluído');
  return data;
};

export const addProduct = async (productData) => {
  console.log('🔄 addProduct iniciado com dados:', productData);
  
  const user = getCurrentUser();
  console.log('👤 Usuário atual:', user);
  
  const { variations, ...mainProductData } = productData;
  let dataToInsert = { ...mainProductData };

  console.log('📦 Dados principais para inserção:', dataToInsert);

  if (!dataToInsert.store_id) {
    console.log('🏪 Buscando loja online...');
    const onlineStores = await getAllStoresAuth();
    console.log('🏪 Lojas disponíveis:', onlineStores);
    const onlineStore = onlineStores.find(s => s.is_online_store);
    if (onlineStore) {
      dataToInsert.store_id = onlineStore.id;
      console.log('✅ Loja online associada:', onlineStore.id);
    } else {
      console.error("❌ Loja online principal não encontrada para associar o produto.");
      throw new Error("Loja online principal não encontrada.");
    }
  }
  
  console.log('📝 Inserindo produto no Supabase...');
  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert([dataToInsert])
    .select('*, stores(name, is_online_store)')
    .single();

  if (productError) {
    console.error('❌ Erro ao inserir produto:', productError);
    throw productError;
  }

  console.log('✅ Produto inserido com sucesso:', newProduct);

  if (newProduct && newProduct.product_type === 'variable' && variations && variations.length > 0) {
    console.log('🔄 Inserindo variações...');
    const variationsToInsert = variations.map(v => ({
      ...v,
      product_id: newProduct.id,
    }));
    console.log('📦 Variações para inserir:', variationsToInsert);
    
    const { error: variationsError } = await supabase.from('product_variations').insert(variationsToInsert);
    if (variationsError) {
      console.error('❌ Erro ao inserir variações:', variationsError);
      await supabase.from('products').delete().eq('id', newProduct.id); // Rollback product
      throw variationsError;
    }
    console.log('✅ Variações inseridas com sucesso');
  }
  
  console.log('🎉 Produto criado completamente:', newProduct);
  return newProduct;
};

export const updateProduct = async (productId, productData) => {
  const { variations, ...mainProductData } = productData;

  const { data: updatedProduct, error: productError } = await supabase
    .from('products')
    .update(mainProductData)
    .eq('id', productId)
    .select('*, stores(name, is_online_store)')
    .single();

  if (productError) {
    console.error('Error updating product:', productError);
    throw productError;
  }

  if (updatedProduct && updatedProduct.product_type === 'variable') {
    // Delete existing variations for simplicity, then re-add. More complex logic could update/insert/delete individually.
    await supabase.from('product_variations').delete().eq('product_id', productId);
    if (variations && variations.length > 0) {
      const variationsToInsert = variations.map(v => ({
        ...v,
        product_id: productId,
        id: undefined // Ensure new IDs are generated if they were passed from frontend state
      }));
      const { error: variationsError } = await supabase.from('product_variations').insert(variationsToInsert);
      if (variationsError) {
        console.error('Error updating product variations:', variationsError);
        throw variationsError; 
      }
    }
  } else if (updatedProduct && updatedProduct.product_type === 'simple') {
    // If product type changed to simple, delete all variations
    await supabase.from('product_variations').delete().eq('product_id', productId);
  }
  return updatedProduct;
};

export const getProductByBarcode = async (barcode) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, stores(name, is_online_store)')
    .eq('barcode', barcode)
    .eq('active', true)
    .single();

  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching product by barcode:', error);
    return null;
  }
  return data;
};

export const getProductStoreStock = async (productId, storeId = null, variationId = null) => {
  let query = supabase
    .from('product_store_stock')
    .select('*, stores(name, is_online_store), product_variations(id, attributes)')
    .eq('product_id', productId);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  if (variationId) {
    query = query.eq('variation_id', variationId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching product store stock:', error);
    if (storeId && variationId) return null; // specific query
    return []; // general query
  }
  if (storeId && variationId) return data[0] || null;
  return data; 
};

export const shareProductStockWithStore = async (productId, storeId, quantity, variationId = null) => {
  const existingStock = await getProductStoreStock(productId, storeId, variationId);
  let newQuantityInStore;
  let newPssEntryId = existingStock?.id;

  if (existingStock) {
    newQuantityInStore = existingStock.quantity + quantity;
    const { error } = await supabase
      .from('product_store_stock')
      .update({ quantity: newQuantityInStore })
      .eq('id', existingStock.id);
    if (error) throw error;
  } else {
    newQuantityInStore = quantity;
    const { data: newEntry, error } = await supabase
      .from('product_store_stock')
      .insert({ product_id: productId, store_id: storeId, variation_id: variationId, quantity: newQuantityInStore })
      .select('id')
      .single();
    if (error) throw error;
    newPssEntryId = newEntry?.id;
  }

  await recalculateOnlineStock(productId);
  
  await addStockMovement({
    product_id: productId,
    variation_id: variationId,
    store_id: storeId, 
    type: 'transfer_in', 
    quantity: quantity,
    previous_stock: existingStock ? existingStock.quantity : 0,
    new_stock: newQuantityInStore,
    reason: `Compartilhamento de estoque para loja física.`,
    stock_type: 'physical_store',
    product_store_stock_id: newPssEntryId
  });

  return { success: true };
};

export const recalculateOnlineStock = async (productId) => {
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('product_type, stock')
        .eq('id', productId)
        .single();

    if (productError || !product) {
        console.error("Error fetching product for stock recalculation:", productError);
        return;
    }

    let totalStock = 0;
    if (product.product_type === 'variable') {
        const { data: variations, error: varError } = await supabase
            .from('product_variations')
            .select('stock')
            .eq('product_id', productId);
        if (varError) {
            console.error("Error fetching variations for stock recalculation:", varError);
            return;
        }
        totalStock = variations.reduce((sum, v) => sum + v.stock, 0);
    } else {
        // For simple products, the 'stock' field is directly managed.
        // This function might be called after a physical store stock update for a simple product.
        // The 'products.stock' for simple products should reflect its own inventory,
        // not an aggregation of physical stores.
        // However, if the business rule is that 'products.stock' is ALWAYS an aggregation
        // of 'product_store_stock' for that product (even if simple), then this logic needs adjustment.
        // For now, assuming 'products.stock' for simple products is its direct stock.
        // If 'products.stock' should be sum of 'product_store_stock' for simple products:
        const { data: physicalStocks, error: psError } = await supabase
            .from('product_store_stock')
            .select('quantity')
            .eq('product_id', productId)
            .is('variation_id', null); // Only for simple product entries in product_store_stock
        if (psError) {
            console.error("Error fetching physical stocks for simple product:", psError);
            return;
        }
        totalStock = physicalStocks.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    if (product.stock !== totalStock) {
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: totalStock }) 
            .eq('id', productId);

        if (updateError) {
            console.error("Error updating online/general stock:", updateError);
        }
    }
};