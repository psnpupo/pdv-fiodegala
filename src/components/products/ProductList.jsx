import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Edit, Trash2, Store, CornerDownRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductList = ({ products, onEdit, onDelete, stores, currentUser }) => {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os termos de busca ou crie seu primeiro produto.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStoreName = (storeId) => stores.find(s => s.id === storeId)?.name || 'Loja Desconhecida';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        let displayStock = product.stock; 
        let displayStockLabel = "Est. Online/Geral";

        if (currentUser && currentUser.store_id && !currentUser.stores?.is_online_store) {
            const physicalStoreStock = product.physicalStocks?.find(ps => ps.store_id === currentUser.store_id);
            if (physicalStoreStock) {
                displayStock = physicalStoreStock.quantity;
                displayStockLabel = `Est. ${currentUser.stores.name}`;
            } else {
                displayStock = 0; 
                displayStockLabel = `Est. ${currentUser.stores.name}`;
            }
        }

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-hover"
          >
            <Card className="glass-effect flex flex-col h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-10 h-10 object-cover rounded-md border"
                        onError={(e) => {
                          console.log('❌ Erro ao carregar imagem:', product.image_url, 'para produto:', product.name);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                        onLoad={() => {
                          console.log('✅ Imagem carregada com sucesso:', product.image_url, 'para produto:', product.name);
                        }}
                      />
                    ) : null}
                    <Package className={`w-5 h-5 text-primary ${product.image_url ? 'hidden' : 'block'}`} />
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Link to={`/products/${product.id}`}>
                        <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(product)} className="text-destructive hover:text-destructive" >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1">Cód: {product.barcode}</p>
                <p className="text-xs text-muted-foreground capitalize">Tipo: {product.product_type === 'variable' ? 'Variável' : 'Simples'}</p>
                {product.store_id && (
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Store className="w-3 h-3 mr-1" />
                        <span>Cadastrado em: {getStoreName(product.store_id)}</span>
                    </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3 flex-grow flex flex-col justify-between">
                <div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">Categoria:</p><p>{product.category || '-'}</p></div>
                  </div>
                  
                  {currentUser && (currentUser.stores?.is_online_store || currentUser.role === 'admin') && product.physicalStocks && product.physicalStocks.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-dashed">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Estoque nas Lojas Físicas:</p>
                        <div className="space-y-1 max-h-20 overflow-y-auto text-xs">
                            {product.physicalStocks.map(ps => (
                                <div key={ps.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                       <CornerDownRight className="w-3 h-3 mr-1 text-muted-foreground" /> 
                                       <span>{ps.stores?.name || getStoreName(ps.store_id)}:</span>
                                    </div>
                                    <span>{ps.quantity} un.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t mt-3">
                  <span className="text-xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${ displayStock <= product.min_stock ? 'text-orange-600' : 'text-green-600' }`}>
                      {displayStockLabel}: {displayStock}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Alerta Mín: {product.min_stock}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  );
};

export default ProductList;