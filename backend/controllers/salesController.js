const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Criar venda
exports.createSale = async (req, res) => {
  try {
    const { 
      items, 
      payments, 
      customerId, 
      cashier, 
      total, 
      discount, 
      subtotal, 
      cashierId,
      store_id,
      modalidade,
      vendedor_id,
      tipo_venda
    } = req.body;

    // Validações básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Itens da venda são obrigatórios.' });
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'Forma de pagamento é obrigatória.' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: 'Total da venda deve ser maior que zero.' });
    }

    // Verificar estoque antes de criar a venda
    for (const item of items) {
      const productId = item.productId || item.id;
      
      // Buscar produto e estoque
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock, name, barcode')
        .eq('id', productId)
        .single();

      if (productError) {
        return res.status(400).json({ error: `Produto ${productId} não encontrado.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Estoque insuficiente para ${product.name} (${product.barcode}). Disponível: ${product.stock}, Solicitado: ${item.quantity}` 
        });
      }
    }

    // Criar a venda
    const saleToInsert = {
      customer_id: customerId || null,
      cashier_name: cashier,
      total_amount: total,
      discount_amount: discount || 0,
      subtotal_amount: subtotal,
      status: 'completed',
      payment_details: payments,
      store_id: store_id,
      modalidade: modalidade || 'varejo',
      vendedor_id: vendedor_id || null,
      tipo_venda: tipo_venda || 'normal'
    };

    const { data: newSale, error: saleError } = await supabase
      .from('sales')
      .insert([saleToInsert])
      .select()
      .single();

    if (saleError) {
      console.error('Erro ao criar venda:', saleError);
      return res.status(500).json({ error: 'Erro ao criar venda.' });
    }

    // Criar itens da venda
    if (newSale && items && items.length > 0) {
      const saleItemsToInsert = items.map(item => ({
        sale_id: newSale.id,
        product_id: item.productId || item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsToInsert);

      if (itemsError) {
        // Rollback: deletar venda se falhar ao criar itens
        await supabase.from('sales').delete().eq('id', newSale.id);
        console.error('Erro ao criar itens da venda:', itemsError);
        return res.status(500).json({ error: 'Erro ao criar itens da venda.' });
      }

      // Debitar estoque para cada item
      for (const item of items) {
        try {
          await debitStockFromSale(item, newSale.id, store_id);
        } catch (stockError) {
          console.error(`Erro ao debitar estoque do item ${item.name}:`, stockError);
          // Rollback: deletar venda se falhar ao debitar estoque
          await supabase.from('sales').delete().eq('id', newSale.id);
          return res.status(500).json({ 
            error: `Erro ao debitar estoque: ${stockError.message}` 
          });
        }
      }
    }

    // Buscar venda completa com relacionamentos
    const { data: fullSaleData, error: fullSaleError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (name, barcode)
        ),
        stores (name, is_online_store),
        customers (name)
      `)
      .eq('id', newSale.id)
      .single();

    if (fullSaleError) {
      console.error('Erro ao buscar dados completos da venda:', fullSaleError);
      return res.json({
        message: 'Venda criada com sucesso!',
        sale: newSale
      });
    }

    res.status(201).json({
      message: 'Venda criada com sucesso!',
      sale: fullSaleData
    });

  } catch (err) {
    console.error('Erro ao criar venda:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Listar vendas
exports.getSales = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      store_id, 
      date_from, 
      date_to,
      status 
    } = req.query;

    let query = supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (name, barcode)
        ),
        stores (name, is_online_store),
        customers (name)
      `)
      .order('created_at', { ascending: false });

    // Filtros
    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar vendas:', error);
      return res.status(500).json({ error: 'Erro ao buscar vendas.' });
    }

    res.json({
      sales: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0
      }
    });

  } catch (err) {
    console.error('Erro ao buscar vendas:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Buscar venda por ID
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (name, barcode)
        ),
        stores (name, is_online_store),
        customers (name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Venda não encontrada.' });
      }
      console.error('Erro ao buscar venda:', error);
      return res.status(500).json({ error: 'Erro ao buscar venda.' });
    }

    res.json({ sale: data });

  } catch (err) {
    console.error('Erro ao buscar venda:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Atualizar venda
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar se a venda existe
    const { data: existingSale, error: checkError } = await supabase
      .from('sales')
      .select('id, status')
      .eq('id', id)
      .single();

    if (checkError || !existingSale) {
      return res.status(404).json({ error: 'Venda não encontrada.' });
    }

    // Não permitir alterar vendas finalizadas
    if (existingSale.status === 'completed') {
      return res.status(400).json({ error: 'Não é possível alterar uma venda finalizada.' });
    }

    const { data, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar venda:', error);
      return res.status(500).json({ error: 'Erro ao atualizar venda.' });
    }

    res.json({
      message: 'Venda atualizada com sucesso!',
      sale: data
    });

  } catch (err) {
    console.error('Erro ao atualizar venda:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Deletar/Cancelar venda
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a venda existe
    const { data: existingSale, error: checkError } = await supabase
      .from('sales')
      .select('id, status, sale_items(*)')
      .eq('id', id)
      .single();

    if (checkError || !existingSale) {
      return res.status(404).json({ error: 'Venda não encontrada.' });
    }

    // Estornar estoque se a venda foi finalizada
    if (existingSale.status === 'completed' && existingSale.sale_items) {
      for (const item of existingSale.sale_items) {
        try {
          await creditStockFromCancellation(item, id);
        } catch (stockError) {
          console.error(`Erro ao estornar estoque do item:`, stockError);
        }
      }
    }

    // Deletar itens da venda
    await supabase.from('sale_items').delete().eq('sale_id', id);

    // Deletar a venda
    const { error } = await supabase.from('sales').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar venda:', error);
      return res.status(500).json({ error: 'Erro ao deletar venda.' });
    }

    res.json({ message: 'Venda cancelada com sucesso!' });

  } catch (err) {
    console.error('Erro ao deletar venda:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Buscar produto por código de barras
exports.getProductByBarcode = async (req, res) => {
  try {
    const { code } = req.params;
    const { store_id, modalidade } = req.query; // Para filtrar por loja e modalidade

    // Buscar produto com estoque
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        stores (name, is_online_store),
        product_store_stock (
          quantity,
          stores (name, id)
        )
      `)
      .eq('barcode', code)
      .eq('active', true)
      .single();

    if (productError) {
      if (productError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }
      console.error('Erro ao buscar produto:', productError);
      return res.status(500).json({ error: 'Erro ao buscar produto.' });
    }

    // Calcular preço por modalidade
    let precoFinal = product.price;
    if (modalidade === 'varejo' && product.price_varejo != null) {
      precoFinal = product.price_varejo;
    } else if (modalidade === 'atacado' && product.price_atacado != null) {
      precoFinal = product.price_atacado;
    } else if (modalidade === 'atacarejo' && product.price_atacarejo != null) {
      precoFinal = product.price_atacarejo;
    }

    // Calcular estoque disponível
    let estoqueDisponivel = product.stock || 0;
    let isPhysicalStoreStock = false;

    if (store_id) {
      // Se especificou loja, buscar estoque da loja física
      const storeStock = product.product_store_stock?.find(s => s.stores.id === store_id);
      if (storeStock) {
        estoqueDisponivel = storeStock.quantity;
        isPhysicalStoreStock = true;
      }
    }

    // Adicionar informações calculadas ao produto
    const productWithCalculations = {
      ...product,
      price: precoFinal, // Preço calculado por modalidade
      stock: estoqueDisponivel, // Estoque disponível
      is_physical_store_stock: isPhysicalStoreStock,
      modalidade: modalidade || 'varejo'
    };

    res.json({ product: productWithCalculations });

  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Debitar estoque
exports.debitStock = async (req, res) => {
  try {
    const { productId, quantity, storeId } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'ID do produto e quantidade são obrigatórios.' });
    }

    const result = await debitStockFromSale(
      { productId, quantity },
      null,
      storeId
    );

    res.json({
      message: 'Estoque debitado com sucesso!',
      result
    });

  } catch (err) {
    console.error('Erro ao debitar estoque:', err);
    res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
  }
};

// Funções auxiliares

// Debitar estoque de uma venda
async function debitStockFromSale(item, saleId, storeId) {
  const { productId, quantity } = item;

  // Buscar detalhes do produto
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, stock, stores(id, name, is_online_store)')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    throw new Error(`Produto com ID ${productId} não encontrado.`);
  }

  let previousStock, newStock, productStoreStockId;

  // Verificar se é venda online ou física
  const isOnlineSale = !storeId || product.stores?.is_online_store;

  if (isOnlineSale) {
    // Venda online - debitar do estoque físico com maior quantidade
    const { data: physicalStocks, error: psError } = await supabase
      .from('product_store_stock')
      .select('id, store_id, quantity, stores(name)')
      .eq('product_id', productId)
      .gt('quantity', 0)
      .order('quantity', { ascending: false });

    if (psError || !physicalStocks || physicalStocks.length === 0) {
      throw new Error(`Produto sem estoque físico disponível.`);
    }

    const storeToDebit = physicalStocks.find(s => s.quantity >= quantity) || physicalStocks[0];

    if (storeToDebit.quantity < quantity) {
      throw new Error(`Estoque insuficiente na loja ${storeToDebit.stores.name}.`);
    }

    previousStock = storeToDebit.quantity;
    newStock = storeToDebit.quantity - quantity;
    productStoreStockId = storeToDebit.id;

    // Atualizar estoque físico
    const { error: updateError } = await supabase
      .from('product_store_stock')
      .update({ quantity: newStock })
      .eq('id', storeToDebit.id);

    if (updateError) {
      throw new Error('Erro ao atualizar estoque físico.');
    }

    // Registrar movimentação
    await addStockMovement({
      product_id: productId,
      type: 'sale_online_physical_debit',
      quantity: quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason: `Venda Online #${saleId} debitada da loja ${storeToDebit.stores.name}`,
      related_sale_id: saleId,
      store_id: storeToDebit.store_id,
      stock_type: 'physical_store',
      product_store_stock_id: productStoreStockId
    });

  } else {
    // Venda física - debitar do estoque da loja específica
    const { data: storeStock, error: ssError } = await supabase
      .from('product_store_stock')
      .select('id, quantity')
      .eq('product_id', productId)
      .eq('store_id', storeId)
      .single();

    if (ssError || !storeStock) {
      throw new Error(`Estoque não encontrado para a loja.`);
    }

    if (storeStock.quantity < quantity) {
      throw new Error(`Estoque insuficiente na loja.`);
    }

    previousStock = storeStock.quantity;
    newStock = storeStock.quantity - quantity;
    productStoreStockId = storeStock.id;

    // Atualizar estoque da loja
    const { error: updateError } = await supabase
      .from('product_store_stock')
      .update({ quantity: newStock })
      .eq('id', storeStock.id);

    if (updateError) {
      throw new Error('Erro ao atualizar estoque da loja.');
    }

    // Registrar movimentação
    await addStockMovement({
      product_id: productId,
      type: 'sale_physical_store',
      quantity: quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason: `Venda #${saleId}`,
      related_sale_id: saleId,
      store_id: storeId,
      stock_type: 'physical_store',
      product_store_stock_id: productStoreStockId
    });
  }

  // Recalcular estoque online
  await recalculateOnlineStock(productId);

  return {
    productId,
    quantity,
    previousStock,
    newStock,
    storeId: isOnlineSale ? null : storeId
  };
}

// Estornar estoque de cancelamento
async function creditStockFromCancellation(item, saleId) {
  const { product_id, quantity } = item;

  // Buscar movimentação original da venda
  const { data: movement, error: movementError } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('related_sale_id', saleId)
    .eq('product_id', product_id)
    .single();

  if (movementError || !movement) {
    console.warn(`Movimentação não encontrada para estorno da venda ${saleId}`);
    return;
  }

  // Estornar estoque
  if (movement.stock_type === 'physical_store' && movement.product_store_stock_id) {
    const { data: storeStock, error: ssError } = await supabase
      .from('product_store_stock')
      .select('quantity')
      .eq('id', movement.product_store_stock_id)
      .single();

    if (!ssError && storeStock) {
      const newQuantity = storeStock.quantity + quantity;
      await supabase
        .from('product_store_stock')
        .update({ quantity: newQuantity })
        .eq('id', movement.product_store_stock_id);

      // Registrar movimentação de estorno
      await addStockMovement({
        product_id: product_id,
        type: 'sale_cancellation_credit',
        quantity: quantity,
        previous_stock: storeStock.quantity,
        new_stock: newQuantity,
        reason: `Estorno da venda #${saleId}`,
        related_sale_id: saleId,
        store_id: movement.store_id,
        stock_type: 'physical_store',
        product_store_stock_id: movement.product_store_stock_id
      });
    }
  }

  // Recalcular estoque online
  await recalculateOnlineStock(product_id);
}

// Adicionar movimentação de estoque
async function addStockMovement(movementData) {
  const { data, error } = await supabase
    .from('stock_movements')
    .insert([movementData])
    .select()
    .single();

  if (error) {
    console.error('Erro ao registrar movimentação:', error);
    throw new Error('Erro ao registrar movimentação de estoque.');
  }

  return data;
}

// Recalcular estoque online
async function recalculateOnlineStock(productId) {
  try {
    // Somar todo o estoque físico
    const { data: physicalStocks, error: psError } = await supabase
      .from('product_store_stock')
      .select('quantity')
      .eq('product_id', productId);

    if (psError) {
      console.error('Erro ao buscar estoques físicos:', psError);
      return;
    }

    const totalPhysicalStock = physicalStocks.reduce((sum, stock) => sum + stock.quantity, 0);

    // Atualizar estoque online
    await supabase
      .from('products')
      .update({ stock: totalPhysicalStock })
      .eq('id', productId);

  } catch (error) {
    console.error('Erro ao recalcular estoque online:', error);
  }
} 