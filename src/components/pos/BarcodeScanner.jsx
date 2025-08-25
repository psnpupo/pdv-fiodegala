import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getProductByBarcode } from '@/lib/salesApi';
import { useRecentProducts } from '@/contexts/RecentProductsContext';

const BarcodeScanner = ({ onProductFound }) => {
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { recentProducts, loading, refreshRecentProducts } = useRecentProducts();
  const { toast } = useToast();

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim() || isLoading) return;

    setIsLoading(true);
    try {
      console.log('🔍 Buscando produto com código:', barcode);
      const result = await getProductByBarcode(barcode);
      
      if (result && result.product) {
        console.log('✅ Produto encontrado:', result.product.name);
        onProductFound(result.product);
        setBarcode('');
        toast({
          title: "Produto adicionado!",
          description: `${result.product.name} foi adicionado ao carrinho.`,
        });
      } else {
        console.log('❌ Produto não encontrado para código:', barcode);
        toast({
          title: "Produto não encontrado",
          description: `Código de barras: ${barcode}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar produto:', error);
      toast({
        title: "Erro ao buscar produto",
        description: error.message || "Erro desconhecido ao buscar produto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const quickAddProduct = async (productBarcode) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 Adicionando produto recente:', productBarcode);
      const result = await getProductByBarcode(productBarcode);
      
      if (result && result.product) {
        console.log('✅ Produto recente adicionado:', result.product.name);
        onProductFound(result.product);
        toast({
          title: "Produto adicionado!",
          description: `${result.product.name} foi adicionado ao carrinho.`,
        });
      } else {
        console.log('❌ Produto recente não encontrado:', productBarcode);
        toast({
          title: "Produto não encontrado",
          description: `Código: ${productBarcode}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar produto recente:', error);
      toast({
        title: "Erro ao adicionar produto",
        description: error.message || "Erro desconhecido ao adicionar produto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Scan className="w-5 h-5" />
          <span>Leitor de Código de Barras</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBarcodeSubmit} className="flex space-x-2">
          <Input
            placeholder="Escaneie ou digite o código de barras"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="flex-1 barcode-scanner"
            autoFocus
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-300">Produtos Recentes</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshRecentProducts}
              disabled={loading || isLoading}
              className="text-xs"
            >
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <Button 
                  key={product.id}
                  variant="outline" 
                  onClick={() => quickAddProduct(product.barcode)}
                  className="text-sm h-auto p-2 flex flex-col items-center"
                  disabled={loading || isLoading}
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-xs text-gray-400 mt-1">
                    R$ {product.price?.toFixed(2) || '0.00'}
                  </span>
                </Button>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-400 text-sm py-4">
                {loading ? 'Carregando produtos...' : 'Nenhum produto recente encontrado'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;