import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  getProducts, 
  updateProduct, 
  getProductStoreStock,
  recalculateOnlineStock
} from '@/lib/productsStorage'; // Atualizado
import { getStockMovements, addStockMovement } from '@/lib/stockMovementsStorage'; // Atualizado
import { getCurrentUser, getStores as getAllStoresAuth, USER_ROLES } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient'; 
import { Package, Plus, Minus, TrendingUp, TrendingDown, History, Search, Shuffle } from 'lucide-react';
// import StockOverview from '@/components/StockOverview'; // Temporariamente comentado

const MOVEMENT_TYPES = {
  IN: 'in', 
  OUT: 'out', 
  ADJUSTMENT: 'adjustment', 
  SALE_ONLINE: 'sale_online_physical_debit', 
  SALE_PHYSICAL: 'sale_physical_store', 
  TRANSFER_IN: 'transfer_in', 
  TRANSFER_OUT: 'transfer_out' 
};

const MOVEMENT_LABELS = {
  [MOVEMENT_TYPES.IN]: 'Entrada Manual',
  [MOVEMENT_TYPES.OUT]: 'Saída Manual',
  [MOVEMENT_TYPES.ADJUSTMENT]: 'Ajuste Manual',
  [MOVEMENT_TYPES.SALE_ONLINE]: 'Venda Online (Débito Físico)',
  [MOVEMENT_TYPES.SALE_PHYSICAL]: 'Venda Loja Física',
  [MOVEMENT_TYPES.TRANSFER_IN]: 'Transferência (Entrada Loja)',
  [MOVEMENT_TYPES.TRANSFER_OUT]: 'Transferência (Saída Online)',
};

const Stock = () => {
  const [products, setProducts] = useState([]); 
  const [movements, setMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [selectedStoreForMovement, setSelectedStoreForMovement] = useState(null); 
  const [allStores, setAllStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const user = getCurrentUser();

  const [movementForm, setMovementForm] = useState({
    type: '',
    quantity: '',
    reason: '',
    target_store_id: '', 
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[STOCK] Iniciando carregamento de dados...');
      
      const [productsData, movementsData, storesData] = await Promise.all([
        getProducts(), 
        getStockMovements(), 
        getAllStoresAuth() 
      ]);

      console.log('[STOCK] Dados carregados:', {
        products: productsData?.length || 0,
        movements: movementsData?.length || 0,
        stores: storesData?.length || 0
      });

      const productsWithFullStockInfo = await Promise.all(
        (productsData || []).map(async (p) => {
          try {
            const physicalStocks = await getProductStoreStock(p.id);
            return { ...p, physicalStocks: physicalStocks || [] };
          } catch (err) {
            console.error('[STOCK] Erro ao carregar estoque físico para produto:', p.id, err);
            return { ...p, physicalStocks: [] };
          }
        })
      );

      setProducts(productsWithFullStockInfo);
      setMovements(movementsData || []);
      setAllStores(storesData || []);

      console.log('[STOCK] Dados processados com sucesso');

    } catch (error) {
      console.error('[STOCK] Erro ao carregar dados:', error);
      setError(error.message);
      toast({ 
        title: "Erro ao carregar dados de estoque", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.store_id]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Se há erro, mostrar mensagem de erro
  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Erro ao Carregar Estoque</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="loading-spinner w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Carregando Estoque...</h1>
            <p className="text-muted-foreground">Aguarde enquanto carregamos os dados</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(product =>
    product.active && (
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    )
  );

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !movementForm.type || !movementForm.quantity) {
      toast({ title: "Erro", description: "Produto, tipo e quantidade são obrigatórios.", variant: "destructive" });
      return;
    }

    const quantity = parseInt(movementForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
        toast({ title: "Erro", description: "Quantidade deve ser um número positivo.", variant: "destructive" });
        return;
    }
    
    setLoading(true);
    try {
        let previousStockValue;
        let newStockValue;
        let movementStoreId = movementForm.target_store_id || selectedProduct.store_id; 
        let stockType = 'online'; 
        let productStoreStockIdForMovement = null;

        if (movementForm.target_store_id) { 
            stockType = 'physical_store';
            const physicalStock = selectedProduct.physicalStocks.find(ps => ps.store_id === movementForm.target_store_id);
            previousStockValue = physicalStock ? physicalStock.quantity : 0;
            productStoreStockIdForMovement = physicalStock ? physicalStock.id : null;

            if (movementForm.type === MOVEMENT_TYPES.IN) newStockValue = previousStockValue + quantity;
            else if (movementForm.type === MOVEMENT_TYPES.OUT) newStockValue = previousStockValue - quantity;
            else if (movementForm.type === MOVEMENT_TYPES.ADJUSTMENT) newStockValue = quantity;
            
            if (newStockValue < 0 && movementForm.type !== MOVEMENT_TYPES.ADJUSTMENT) {
                toast({ title: "Erro", description: "Estoque da loja física não pode ficar negativo.", variant: "destructive" });
                setLoading(false); return;
            }
            if (movementForm.type === MOVEMENT_TYPES.ADJUSTMENT && newStockValue < 0) newStockValue = 0;
            
            if (physicalStock) {
                await supabase.from('product_store_stock').update({ quantity: newStockValue }).eq('id', physicalStock.id);
            } else { 
                const {data: newPssEntry} = await supabase.from('product_store_stock').insert({ product_id: selectedProduct.id, store_id: movementForm.target_store_id, quantity: newStockValue }).select("id").single();
                productStoreStockIdForMovement = newPssEntry?.id;
            }
            await recalculateOnlineStock(selectedProduct.id); 

        } else { 
            if (!user?.stores?.is_online_store && user?.role !== USER_ROLES.ADMIN) {
                 toast({ title: "Ação não permitida", description: "Selecione uma loja física para esta movimentação ou realize no estoque Online (se admin/online).", variant: "destructive" });
                 setLoading(false); return;
            }
             movementStoreId = selectedProduct.store_id; 
            previousStockValue = selectedProduct.stock; 
            if (movementForm.type === MOVEMENT_TYPES.IN) newStockValue = previousStockValue + quantity;
            else if (movementForm.type === MOVEMENT_TYPES.OUT) newStockValue = previousStockValue - quantity;
            else if (movementForm.type === MOVEMENT_TYPES.ADJUSTMENT) newStockValue = quantity;

            if (newStockValue < 0 && movementForm.type !== MOVEMENT_TYPES.ADJUSTMENT) {
                toast({ title: "Erro", description: "Estoque online/geral não pode ficar negativo.", variant: "destructive" });
                setLoading(false); return;
            }
            if (movementForm.type === MOVEMENT_TYPES.ADJUSTMENT && newStockValue < 0) newStockValue = 0;
            
            await updateProduct(selectedProduct.id, { stock: newStockValue });
        }

      await addStockMovement({
        product_id: selectedProduct.id,
        type: movementForm.type,
        quantity: quantity,
        previous_stock: previousStockValue,
        new_stock: newStockValue,
        reason: movementForm.reason,
        user_id: user?.id,
        store_id: movementStoreId, 
        stock_type: stockType,
        product_store_stock_id: stockType === 'physical_store' ? productStoreStockIdForMovement : null
      });

      toast({ title: "Movimentação registrada!", description: `${MOVEMENT_LABELS[movementForm.type]} de ${quantity} unidades para ${selectedProduct.name}.` });
      fetchData();
      setShowMovementDialog(false);
      setMovementForm({ type: '', quantity: '', reason: '', target_store_id: '' });
      setSelectedProduct(null);
      setSelectedStoreForMovement(null);
    } catch (error) {
      toast({ title: "Erro ao registrar movimentação", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openMovementDialog = (product, movementType, store = null) => {
    setSelectedProduct(product);
    setSelectedStoreForMovement(store); 
    setMovementForm({ 
        ...movementForm, 
        type: movementType, 
        target_store_id: store ? store.id : (user?.stores?.is_online_store || user?.role === USER_ROLES.ADMIN ? '' : user?.store_id) 
    });
    setShowMovementDialog(true);
  };
  
  const getStoreNameById = (id) => allStores.find(s => s.id === id)?.name || 'N/A';

  const getLowStockCount = () => products.filter(p => p.active && p.stock <= p.min_stock).length; 
  const getTotalActiveProducts = () => products.filter(p => p.active).length;
  const getTotalOnlineStock = () => products.filter(p => p.active).reduce((sum, p) => sum + p.stock, 0); 

  // Função utilitária para calcular o estoque total de uma loja física
  const getTotalStockByStore = (storeId) => {
    return products.reduce((sum, p) => {
      const stockObj = p.physicalStocks?.find(ps => ps.store_id === storeId);
      return sum + (stockObj ? stockObj.quantity : 0);
    }, 0);
  };

  const physicalStoresForSelect = allStores.filter(s => !s.is_online_store);


  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie o estoque dos seus produtos</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3 shadow-sm">
            <Package className="w-7 h-7 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{getTotalActiveProducts()}</p>
              <p className="text-xs text-muted-foreground">Produtos Ativos</p>
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3 shadow-sm">
            <TrendingUp className="w-7 h-7 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{getTotalOnlineStock()}</p>
              <p className="text-xs text-muted-foreground">Estoque Online</p>
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3 shadow-sm">
            <TrendingDown className="w-7 h-7 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{getLowStockCount()}</p>
              <p className="text-xs text-muted-foreground">Estoque Baixo</p>
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3 shadow-sm">
            <History className="w-7 h-7 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{movements.length}</p>
              <p className="text-xs text-muted-foreground">Movimentações</p>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="mt-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar produtos..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </div>

        {/* Lista de produtos */}
        <div className="space-y-4 mt-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <motion.div 
                key={product.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="rounded-xl bg-card border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm hover:shadow-lg transition"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-foreground">{product.name}</span>
                    {product.stock <= product.min_stock && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Baixo estoque
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.category} • {product.barcode}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-xs text-foreground bg-muted rounded px-2 py-0.5">
                      Online: <b>{product.stock}</b> un.
                    </span>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-1">
                  <span className={`text-base font-semibold ${
                    product.stock <= product.min_stock ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    Online: {product.stock} un.
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Mín. Online: {product.min_stock}
                  </span>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openMovementDialog(product, MOVEMENT_TYPES.IN)}
                  >
                    <Plus className="w-4 h-4 mr-1" />Entrada
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openMovementDialog(product, MOVEMENT_TYPES.OUT)}
                  >
                    <Minus className="w-4 h-4 mr-1" />Saída
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openMovementDialog(product, MOVEMENT_TYPES.ADJUSTMENT)}
                  >
                    Ajuste
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Histórico de movimentações */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            Histórico de Movimentações
          </h3>
          <div className="rounded-xl bg-card border border-border p-4 max-h-96 overflow-y-auto">
            {movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma movimentação registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movements.slice(0, 20).map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition text-sm">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {m.productName || m.products?.name} ({m.products?.barcode})
                      </h4>
                      <p className="text-muted-foreground">
                        {MOVEMENT_LABELS[m.type] || m.type} • {m.storeName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.userName} • {new Date(m.created_at).toLocaleString()} • {m.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        m.type === MOVEMENT_TYPES.IN || m.type === MOVEMENT_TYPES.TRANSFER_IN 
                          ? 'text-green-600 dark:text-green-400' 
                          : (m.type === MOVEMENT_TYPES.OUT || m.type === MOVEMENT_TYPES.TRANSFER_OUT || m.type === MOVEMENT_TYPES.SALE_ONLINE || m.type === MOVEMENT_TYPES.SALE_PHYSICAL) 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-purple-600 dark:text-purple-400'
                      }`}>
                        {m.type === MOVEMENT_TYPES.IN || m.type === MOVEMENT_TYPES.TRANSFER_IN ? '+' : 
                         (m.type === MOVEMENT_TYPES.OUT || m.type === MOVEMENT_TYPES.TRANSFER_OUT || m.type === MOVEMENT_TYPES.SALE_ONLINE || m.type === MOVEMENT_TYPES.SALE_PHYSICAL) ? '-' : '='}
                        {m.quantity}
                      </p>
                      <p className="text-muted-foreground">{m.previous_stock} → {m.new_stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dialog de movimentação */}
        <Dialog 
          open={showMovementDialog} 
          onOpenChange={(isOpen) => { 
            setShowMovementDialog(isOpen); 
            if(!isOpen) {
              setMovementForm({ type: '', quantity: '', reason: '', target_store_id: '' });
              setSelectedProduct(null);
              setSelectedStoreForMovement(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {movementForm.type && `${MOVEMENT_LABELS[movementForm.type] || movementForm.type} de Estoque`}
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <form onSubmit={handleMovementSubmit} className="space-y-4">
                <div>
                  <Label>Produto</Label>
                  <Input value={selectedProduct.name} disabled />
                </div>
                
                <div>
                  <Label>Estoque Atual</Label>
                  <Input value={`${selectedProduct.stock} unidades`} disabled />
                </div>
                
                <div>
                  <Label htmlFor="quantity">
                    {movementForm.type === MOVEMENT_TYPES.ADJUSTMENT ? 'Novo Estoque' : 'Quantidade da Movimentação'}
                  </Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1" 
                    value={movementForm.quantity} 
                    onChange={(e) => setMovementForm({...movementForm, quantity: e.target.value})} 
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="reason">Motivo/Observação</Label>
                  <Input 
                    id="reason" 
                    placeholder="Descreva o motivo da movimentação" 
                    value={movementForm.reason} 
                    onChange={(e) => setMovementForm({...movementForm, reason: e.target.value})} 
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowMovementDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : `Confirmar ${MOVEMENT_LABELS[movementForm.type] || movementForm.type}`}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Stock;