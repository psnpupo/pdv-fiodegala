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
import StockOverview from '@/components/StockOverview';

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
    try {
      const [productsData, movementsData, storesData] = await Promise.all([
        getProducts(), 
        getStockMovements(), 
        getAllStoresAuth() 
      ]);

      const productsWithFullStockInfo = await Promise.all(
        (productsData || []).map(async (p) => {
          const physicalStocks = await getProductStoreStock(p.id);
          return { ...p, physicalStocks: physicalStocks || [] };
        })
      );

      setProducts(productsWithFullStockInfo);
      setMovements(movementsData || []);
      setAllStores(storesData || []);

    } catch (error) {
      toast({ title: "Erro ao carregar dados de estoque", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.store_id]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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


  if (loading && products.length === 0 && movements.length === 0) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Visão Geral do Estoque</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-purple-900/60 to-background/80 p-4 flex items-center gap-3 shadow-sm">
          <Package className="w-7 h-7 text-purple-400" />
          <div>
            <p className="text-2xl font-bold text-white">{getTotalActiveProducts()}</p>
            <p className="text-xs text-muted-foreground">Produtos Ativos</p>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-red-900/60 to-background/80 p-4 flex items-center gap-3 shadow-sm">
          <TrendingUp className="w-7 h-7 text-red-400" />
          <div>
            <p className="text-2xl font-bold text-white">{getTotalOnlineStock()}</p>
            <p className="text-xs text-muted-foreground">Total Online</p>
          </div>
        </div>
        {/* Cards de estoque por loja física */}
        {physicalStoresForSelect.map((store) => (
          <div key={store.id} className="rounded-xl bg-gradient-to-br from-background/80 to-purple-900/60 p-4 flex items-center gap-3 shadow-sm">
            <TrendingUp className="w-7 h-7 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">{getTotalStockByStore(store.id)}</p>
              <p className="text-xs text-muted-foreground">{store.name}</p>
            </div>
          </div>
        ))}
        <div className="rounded-xl bg-background/60 border border-red-700/30 p-4 flex items-center gap-3 shadow-sm">
          <TrendingDown className="w-7 h-7 text-orange-400" />
          <div>
            <p className="text-2xl font-bold text-orange-300">{getLowStockCount()}</p>
            <p className="text-xs text-orange-200">Estoque Baixo</p>
          </div>
        </div>
        <div className="rounded-xl bg-background/60 border border-purple-700/30 p-4 flex items-center gap-3 shadow-sm">
          <History className="w-7 h-7 text-purple-400" />
          <div>
            <p className="text-2xl font-bold text-white">{movements.length}</p>
            <p className="text-xs text-muted-foreground">Movimentações</p>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produtos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background/70 border-none text-white placeholder:text-gray-400 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4 mt-8">
        {filteredProducts.map((product) => (
          <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="">
            <div className="rounded-xl bg-background/70 border border-white/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm hover:shadow-lg transition">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-white">{product.name}</span>
                  {product.stock <= product.min_stock && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-900/60 text-red-200">Baixo estoque</span>}
                </div>
                <p className="text-xs text-muted-foreground">{product.category} • {product.brand} • Cód: {product.barcode}</p>
                {/* Estoque detalhado por loja */}
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs text-white bg-purple-900/40 rounded px-2 py-0.5">Online: <b>{product.stock}</b> un.</span>
                  {physicalStoresForSelect.map(store => {
                    const stockObj = product.physicalStocks?.find(ps => ps.store_id === store.id);
                    return (
                      <span key={store.id} className="text-xs text-white bg-background/40 border border-white/10 rounded px-2 py-0.5">
                        {store.name}: <b>{stockObj ? stockObj.quantity : 0}</b> un.
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-1">
                <span className={`text-base font-semibold ${product.stock <= product.min_stock ? 'text-orange-400' : 'text-green-400'}`}>Online: {product.stock} un.</span>
                <span className="text-xs text-muted-foreground">Mín. Online: {product.min_stock}</span>
              </div>
              {(user?.stores?.is_online_store || user?.role === USER_ROLES.ADMIN) && (
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button variant="ghost" size="sm" className="rounded-lg border border-white/10 bg-white/5 text-white hover:bg-purple-900/40" onClick={() => openMovementDialog(product, MOVEMENT_TYPES.IN)}><Plus className="w-4 h-4 mr-1" />Entrada</Button>
                  <Button variant="ghost" size="sm" className="rounded-lg border border-white/10 bg-white/5 text-white hover:bg-red-900/40" onClick={() => openMovementDialog(product, MOVEMENT_TYPES.OUT)}><Minus className="w-4 h-4 mr-1" />Saída</Button>
                  <Button variant="ghost" size="sm" className="rounded-lg border border-white/10 bg-white/5 text-white hover:bg-purple-900/40" onClick={() => openMovementDialog(product, MOVEMENT_TYPES.ADJUSTMENT)}>Ajuste</Button>
                </div>
              )}
            </div>
            {product.physicalStocks && product.physicalStocks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {product.physicalStocks.map(ps => {
                  const storeDetails = allStores.find(s => s.id === ps.store_id);
                  if (!storeDetails) return null;
                  const canAdjustPhysicalStore = user?.role === USER_ROLES.ADMIN || user?.stores?.is_online_store || user?.store_id === ps.store_id;
                  return (
                    <div key={ps.id} className="rounded-lg bg-background/60 border border-white/10 px-3 py-1 flex items-center gap-2 text-xs text-white">
                      <span className="font-semibold">{storeDetails.name}:</span>
                      <span>{ps.quantity} un.</span>
                      {canAdjustPhysicalStore && (
                        <>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-400" onClick={() => openMovementDialog(product, MOVEMENT_TYPES.IN, storeDetails)}><Plus className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => openMovementDialog(product, MOVEMENT_TYPES.OUT, storeDetails)}><Minus className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-400" onClick={() => openMovementDialog(product, MOVEMENT_TYPES.ADJUSTMENT, storeDetails)}><Shuffle className="w-3 h-3" /></Button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {product.physicalStocks?.length === 0 && (user?.stores?.is_online_store || user?.role === USER_ROLES.ADMIN) && (
              <p className="text-xs text-muted-foreground text-center py-2">Este produto ainda não foi compartilhado com lojas físicas.</p>
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-10">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><History className="w-5 h-5 text-purple-400" />Histórico de Movimentações</h3>
        <div className="rounded-xl bg-background/70 border border-white/5 p-4 max-h-96 overflow-y-auto">
          {movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><History className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhuma movimentação registrada</p></div>
          ) : (
            <div className="space-y-3">
              {movements.slice(0, 20).map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-sm">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{m.productName || m.products?.name} ({m.products?.barcode})</h4>
                    <p className="text-muted-foreground">
                      {MOVEMENT_LABELS[m.type] || m.type} • {m.storeName} {m.stock_type === 'physical_store' && m.stores && !m.stores.is_online_store ? `(Loja Física)` : m.stock_type === 'online' ? `(Estoque Online)`: ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.userName} • {new Date(m.created_at).toLocaleString()} • {m.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${m.type === MOVEMENT_TYPES.IN || m.type === MOVEMENT_TYPES.TRANSFER_IN ? 'text-green-400' : (m.type === MOVEMENT_TYPES.OUT || m.type === MOVEMENT_TYPES.TRANSFER_OUT || m.type === MOVEMENT_TYPES.SALE_ONLINE || m.type === MOVEMENT_TYPES.SALE_PHYSICAL) ? 'text-red-400' : 'text-purple-400'}`}>
                      {m.type === MOVEMENT_TYPES.IN || m.type === MOVEMENT_TYPES.TRANSFER_IN ? '+' : (m.type === MOVEMENT_TYPES.OUT || m.type === MOVEMENT_TYPES.TRANSFER_OUT || m.type === MOVEMENT_TYPES.SALE_ONLINE || m.type === MOVEMENT_TYPES.SALE_PHYSICAL) ? '-' : '='}{m.quantity}
                    </p>
                    <p className="text-muted-foreground">{m.previous_stock} → {m.new_stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showMovementDialog} onOpenChange={(isOpen) => { 
          setShowMovementDialog(isOpen); 
          if(!isOpen) {
            setMovementForm({ type: '', quantity: '', reason: '', target_store_id: '' });
            setSelectedProduct(null);
            setSelectedStoreForMovement(null);
          }
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{movementForm.type && `${MOVEMENT_LABELS[movementForm.type] || movementForm.type} de Estoque`}</DialogTitle></DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div><Label>Produto</Label><Input value={selectedProduct.name} disabled /></div>
              
              {(user?.stores?.is_online_store || user?.role === USER_ROLES.ADMIN || selectedStoreForMovement) && (
                <div>
                    <Label htmlFor="target_store_id">Loja Alvo da Movimentação</Label>
                    <Select 
                        value={movementForm.target_store_id} 
                        onValueChange={(value) => setMovementForm({...movementForm, target_store_id: value})}
                        disabled={!!selectedStoreForMovement} 
                    >
                        <SelectTrigger><SelectValue placeholder="Selecione loja (ou deixe para Online)" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Estoque Online/Geral</SelectItem>
                            {physicalStoresForSelect.map(store => (
                                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                        {selectedStoreForMovement ? `Movimentando estoque de: ${selectedStoreForMovement.name}` : 
                         movementForm.target_store_id ? `Movimentando estoque de: ${getStoreNameById(movementForm.target_store_id)}` : 
                         "Movimentando Estoque Online/Geral."}
                    </p>
                </div>
              )}
              {!selectedStoreForMovement && !user?.stores?.is_online_store && user?.role !== USER_ROLES.ADMIN && (
                  <Input value={`Loja Atual: ${user?.stores.name}`} disabled />
              )}


              <div>
                <Label>Estoque Atual ({movementForm.target_store_id ? getStoreNameById(movementForm.target_store_id) : 'Online'})</Label>
                <Input value={`${movementForm.target_store_id ? (selectedProduct.physicalStocks.find(ps => ps.store_id === movementForm.target_store_id)?.quantity || 0) : selectedProduct.stock} unidades`} disabled />
              </div>
              <div>
                <Label htmlFor="quantity">{movementForm.type === MOVEMENT_TYPES.ADJUSTMENT ? 'Novo Estoque' : 'Quantidade da Movimentação'}</Label>
                <Input id="quantity" type="number" min="1" value={movementForm.quantity} onChange={(e) => setMovementForm({...movementForm, quantity: e.target.value})} required/>
              </div>
              <div>
                <Label htmlFor="reason">Motivo/Observação</Label>
                <Input id="reason" placeholder="Descreva o motivo da movimentação" value={movementForm.reason} onChange={(e) => setMovementForm({...movementForm, reason: e.target.value})} required/>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowMovementDialog(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading? 'Salvando...' : `Confirmar ${MOVEMENT_LABELS[movementForm.type] || movementForm.type}`}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stock;