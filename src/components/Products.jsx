import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  getAllProducts, 
  getProductStoreStock
} from '@/lib/productsStorage'; // Atualizado
import { getCurrentUser, getStores } from '@/lib/auth'; // getStores importado de auth
import { Search, PackagePlus } from 'lucide-react';
import ProductList from '@/components/products/ProductList';
import ProductForm from '@/components/products/ProductForm';
import LowStockAlert from '@/components/products/LowStockAlert';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stores, setStoresData] = useState([]); // Renomeado para evitar conflito com import
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    name: '', category: '', brand: '', barcode: '',
    sizes: '', colors: '', price: '', stock: '', min_stock: '', active: true
  });

  const [filter, setFilter] = useState({ barcode: '', sku: '', referencia: '', name: '' });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const filteredProducts = products.filter(product =>
    (!filter.barcode || product.barcode?.toLowerCase().includes(filter.barcode.toLowerCase())) &&
    (!filter.sku || (product.sku?.toLowerCase().includes(filter.sku.toLowerCase()) || (product.variations && product.variations.some(v => v.sku?.toLowerCase().includes(filter.sku.toLowerCase()))))) &&
    (!filter.referencia || (product.referencia?.toLowerCase().includes(filter.referencia.toLowerCase()) || (product.variations && product.variations.some(v => v.referencia?.toLowerCase().includes(filter.referencia.toLowerCase()))))) &&
    (!filter.name || product.name?.toLowerCase().includes(filter.name.toLowerCase()))
  );

  const fetchProductsAndStoresData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, storesDataFromAuth] = await Promise.all([ // Renomeado storesDataFromAuth
          getProducts(), 
          getStores()    
      ]);
      
      const productsWithStoreStock = await Promise.all(
        (productsData || []).map(async (product) => {
          const physicalStocks = await getProductStoreStock(product.id);
          return { ...product, physicalStocks: physicalStocks || [] };
        })
      );

      setProducts(productsWithStoreStock);
      setStoresData(storesDataFromAuth || []); // Usando setStoresData

    } catch (error) {
      toast({ title: "Erro ao carregar produtos ou lojas", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, currentUser?.store_id, currentUser?.role]); 

  useEffect(() => {
    fetchProductsAndStoresData();
  }, [fetchProductsAndStoresData]);

  const resetForm = () => {
    setFormData({
      name: '', category: '', brand: '', barcode: '',
      sizes: '', colors: '', price: '', stock: '', min_stock: '', active: true
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (productData) => {
    console.log('🚀 Iniciando criação de produto...');
    console.log('📋 Dados recebidos:', productData);
    
    const processedProductData = {
      ...productData,
      price: parseFloat(productData.price) || 0,
      stock: parseInt(productData.stock) || 0, 
      min_stock: parseInt(productData.min_stock) || 0,
      sizes: productData.sizes ? productData.sizes.split(',').map(s => s.trim()).filter(s => s) : [],
      colors: productData.colors ? productData.colors.split(',').map(c => c.trim()).filter(c => c) : [],
    };

    console.log('📦 Dados processados:', processedProductData);

    if (!processedProductData.name || !processedProductData.barcode || !processedProductData.price || isNaN(processedProductData.stock)) {
      console.log('❌ Erro de validação:', { name: processedProductData.name, barcode: processedProductData.barcode, price: processedProductData.price, stock: processedProductData.stock });
      toast({ title: "Erro de Validação", description: "Nome, Código de Barras, Preço e Estoque Online são obrigatórios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      console.log('🏪 Verificando loja...');
      if (!editingProduct && !currentUser?.stores?.is_online_store) {
         const onlineStore = stores.find(s => s.is_online_store);
         console.log('🏪 Loja online encontrada:', onlineStore);
         if (onlineStore) {
           processedProductData.store_id = onlineStore.id; 
         } else {
           console.log('❌ Loja online não encontrada');
           toast({ title: "Erro", description: "Loja online principal não encontrada para cadastro.", variant: "destructive"});
           setLoading(false);
           return;
         }
      } else if (editingProduct) {
        processedProductData.store_id = editingProduct.store_id; 
      } else if (currentUser?.stores?.is_online_store) {
         processedProductData.store_id = currentUser.store_id;
      }

      console.log('📦 Dados finais antes de salvar:', processedProductData);

      if (editingProduct) {
        console.log('✏️ Atualizando produto...');
        await updateProduct(editingProduct.id, processedProductData);
        toast({ title: "Produto atualizado!", description: `${processedProductData.name} foi atualizado.` });
      } else {
        console.log('🔍 Verificando código de barras duplicado...');
        const allDbProducts = await getAllProducts(); 
        console.log('📋 Produtos existentes:', allDbProducts.length);
        
        if (allDbProducts.some(p => p.barcode === processedProductData.barcode)) {
            console.log('❌ Código de barras já existe:', processedProductData.barcode);
            toast({ title: "Erro de Validação", description: "Código de barras já existe.", variant: "destructive" });
            setLoading(false);
            return;
        }
        
        console.log('✅ Criando produto...');
        const newProduct = await addProduct(processedProductData);
        console.log('✅ Produto criado com sucesso:', newProduct);
        toast({ title: "Produto criado!", description: `${processedProductData.name} foi criado.` });
      }
      fetchProductsAndStoresData();
      setShowFormDialog(false);
      resetForm();
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      toast({ title: "Erro ao salvar produto", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category || '',
      brand: product.brand || '',
      barcode: product.barcode,
      sizes: product.sizes?.join(', ') || '',
      colors: product.colors?.join(', ') || '',
      price: product.price.toString(),
      stock: product.stock.toString(), 
      min_stock: product.min_stock.toString(),
      active: product.active
    });
    setShowFormDialog(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Tem certeza que deseja desativar este produto? Ele não será removido permanentemente.")) {
        return;
    }
    setLoading(true);
    try {
      await updateProduct(productId, { active: false });
      toast({ title: "Produto desativado!", description: "O produto foi marcado como inativo." });
      fetchProductsAndStoresData(); 
    } catch (error) {
      toast({ title: "Erro ao desativar produto", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.active && p.stock <= p.min_stock);
  };
  
  const handleStockShared = () => {
    fetchProductsAndStoresData(); 
  };

  if (loading && products.length === 0) {
     return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Buscar por Código de Barras"
            name="barcode"
            value={filter.barcode}
            onChange={handleFilterChange}
            className="w-44"
          />
          <Input
            placeholder="Buscar por SKU"
            name="sku"
            value={filter.sku}
            onChange={handleFilterChange}
            className="w-36"
          />
          <Input
            placeholder="Buscar por Referência"
            name="referencia"
            value={filter.referencia}
            onChange={handleFilterChange}
            className="w-32"
          />
          <Input
            placeholder="Buscar por Nome"
            name="name"
            value={filter.name}
            onChange={handleFilterChange}
            className="w-44"
          />
        </div>
        <ProductForm 
          open={showFormDialog}
          onOpenChange={setShowFormDialog}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          editingProduct={editingProduct}
          resetForm={resetForm}
          onStockShared={handleStockShared}
        />
      </div>

      <LowStockAlert products={getLowStockProducts()} />

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos por nome, categoria, marca ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {products.length > 0 ? (
        <ProductList 
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          stores={stores} // Passando a variável de estado 'stores'
          currentUser={currentUser}
        />
      ) : (
         <Card className="mt-6">
            <CardContent className="text-center py-12">
                <PackagePlus className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-6">
                    {searchTerm ? "Tente ajustar sua busca ou " : ""}
                    Clique em "Novo Produto" para começar a cadastrar.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Products;