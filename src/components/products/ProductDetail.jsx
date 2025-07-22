import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Ruler, Weight, Palette, Tag, ShoppingBag, Store, Layers, Image as ImageIcon, Barcode, Hash, Info, DollarSign, GalleryHorizontalEnd } from 'lucide-react';
import { getProductStoreStock } from '@/lib/productsStorage';
import { getStores } from '@/lib/auth';

const ProductDetail = () => {
  const { id: productId } = useParams();
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [physicalStocks, setPhysicalStocks] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const { toast } = useToast();

  const fetchProductDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Buscar imagens do produto - usar image_url do próprio produto
      const productImages = [];
      if (productData.image_url) {
        productImages.push({
          id: 'main',
          image_url: productData.image_url,
          is_featured: true
        });
      }
      setImages(productImages);
      console.log('🖼️ Imagens encontradas:', productImages);

      if (productData.product_type === 'variable') {
        const { data: variationsData, error: variationsError } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', productId);
        if (variationsError) throw variationsError;
        setVariations(variationsData || []);
        console.log('🔄 Variações encontradas:', variationsData);
      }
      const pssData = await getProductStoreStock(productId);
      setPhysicalStocks(pssData || []);
      const storesData = await getStores();
      setAllStores(storesData || []);
    } catch (error) {
      toast({ title: "Erro ao buscar detalhes do produto", description: error.message, variant: "destructive" });
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const getStoreName = (storeId) => allStores.find(s => s.id === storeId)?.name || 'Loja Desconhecida';

  const openImageModal = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="loading-spinner"></div></div>;
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6 text-center">
        <Package className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Produto não encontrado</h1>
        <p className="text-muted-foreground mb-6">O produto que você está procurando não existe ou foi removido.</p>
        <Button asChild variant="outline">
          <Link to="/products"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Produtos</Link>
        </Button>
      </div>
    );
  }
  
  const totalStock = product.product_type === 'variable' 
    ? variations.reduce((sum, v) => sum + v.stock, 0) 
    : product.stock;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link to="/products"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Produtos</Link>
        </Button>
        <h1 className="text-3xl font-bold text-center flex-grow">{product.name}</h1>
        <div className="w-24"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Galeria de imagens */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center"><GalleryHorizontalEnd className="mr-2 text-primary" /> Imagens do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              {images.length > 0 ? (
                <div>
                  <img 
                    src={images[0].image_url} 
                    alt="Destaque" 
                    className="w-full h-64 object-cover rounded-lg border mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openImageModal(images[0])}
                    onError={(e) => {
                      console.log('❌ Erro ao carregar imagem principal:', images[0].image_url);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    onLoad={() => {
                      console.log('✅ Imagem principal carregada:', images[0].image_url);
                    }}
                  />
                  <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center hidden">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {images.map((img, idx) => (
                      <img 
                        key={img.id} 
                        src={img.image_url} 
                        alt={`Imagem ${idx+1}`} 
                        className={`w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity ${idx===0 ? 'ring-2 ring-primary' : ''}`} 
                        title={img.is_featured ? 'Destaque' : ''}
                        onClick={() => openImageModal(img)}
                        onError={(e) => {
                          console.log('❌ Erro ao carregar miniatura:', img.image_url);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('✅ Miniatura carregada:', img.image_url);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader><CardTitle className="flex items-center"><Info className="mr-2 text-primary" /> Dados Principais</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Nome:</strong> {product.name}</p>
              <p><strong>Referência:</strong> {product.referencia || 'N/A'}</p>
              <p><strong>Categoria:</strong> {product.category || 'N/A'}</p>
              <p><strong>Código de Barras:</strong> {product.barcode}</p>
              <p><strong>Tipo:</strong> <span className="capitalize">{product.product_type === 'variable' ? 'Produto Variável' : 'Produto Simples'}</span></p>
              <p><strong>Status:</strong> {product.active ? 'Ativo' : 'Inativo'}</p>
              <p><strong>Data de Cadastro:</strong> {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader><CardTitle className="flex items-center"><DollarSign className="mr-2 text-primary" /> Preços</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Preço Principal:</strong> R$ {product.price?.toFixed(2)}</p>
              <p><strong>Preço Varejo:</strong> {product.price_varejo ? `R$ ${product.price_varejo.toFixed(2)}` : 'N/A'}</p>
              <p><strong>Preço Atacado:</strong> {product.price_atacado ? `R$ ${product.price_atacado.toFixed(2)}` : 'N/A'}</p>
              <p><strong>Preço Atacarejo:</strong> {product.price_atacarejo ? `R$ ${product.price_atacarejo.toFixed(2)}` : 'N/A'}</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader><CardTitle className="flex items-center"><Ruler className="mr-2 text-primary" /> Dimensões e Peso</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Peso:</strong> {product.weight ? `${product.weight} kg` : 'N/A'}</p>
              <p><strong>Comprimento:</strong> {product.length ? `${product.length} cm` : 'N/A'}</p>
              <p><strong>Altura:</strong> {product.height ? `${product.height} cm` : 'N/A'}</p>
              <p><strong>Largura:</strong> {product.width ? `${product.width} cm` : 'N/A'}</p>
            </CardContent>
          </Card>

          {product.medidas && (
            <Card className="glass-effect">
              <CardHeader><CardTitle className="flex items-center"><Ruler className="mr-2 text-primary" /> Medidas da Peça</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(product.medidas).map(([key, value]) => (
                  <p key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value || 'N/A'}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna 2: Estoques, variações, etc */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-effect">
            <CardHeader><CardTitle className="flex items-center"><ShoppingBag className="mr-2 text-primary" /> Estoque</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Estoque Mínimo Global:</strong> {product.min_stock} unidades</p>
              <p className={`font-semibold ${totalStock <= product.min_stock ? 'text-orange-500' : 'text-green-500'}`}>Estoque Online/Geral Total: {totalStock} unidades</p>
            </CardContent>
          </Card>

          {physicalStocks.length > 0 && (
            <Card className="glass-effect">
              <CardHeader><CardTitle className="flex items-center"><Store className="mr-2 text-primary" /> Estoque nas Lojas Físicas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {physicalStocks.map(ps => (
                  <div key={ps.id} className="flex justify-between items-center p-3 bg-background/30 rounded-md text-sm">
                    <p><strong>{getStoreName(ps.store_id)}:</strong></p>
                    <p>{ps.quantity} unidades {ps.variation_id ? `(Variação ID: ${ps.variation_id.substring(0,8)}...)` : '(Produto Simples/Agregado)'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {physicalStocks.length === 0 && (
            <Card className="glass-effect"><CardContent className="p-6 text-center text-muted-foreground">Este produto (ou suas variações) ainda não teve estoque compartilhado com lojas físicas.</CardContent></Card>
          )}

          {product.product_type === 'variable' && variations.length > 0 && (
            <Card className="glass-effect">
              <CardHeader><CardTitle className="flex items-center"><Layers className="mr-2 text-primary" /> Variações do Produto ({variations.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {variations.map((variation, index) => (
                  <Card key={variation.id || index} className="bg-background/30 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="md:col-span-1">
                        {variation.image_url ? (
                           <img 
                             src={variation.image_url} 
                             alt={`Variação ${index + 1}`} 
                             className="w-full h-auto object-cover rounded border aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                             onClick={() => openImageModal({ image_url: variation.image_url, id: variation.id })}
                             onError={(e) => {
                               console.log('❌ Erro ao carregar imagem da variação:', variation.image_url);
                               e.target.style.display = 'none';
                               e.target.nextSibling.style.display = 'flex';
                             }}
                             onLoad={() => {
                               console.log('✅ Imagem da variação carregada:', variation.image_url);
                             }}
                           />
                        ) : null}
                        <div className="w-full h-32 bg-muted rounded flex items-center justify-center" style={{ display: variation.image_url ? 'none' : 'flex' }}>
                          <ImageIcon className="w-10 h-10 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2 text-sm">
                        <p className="font-semibold text-base">
                            {variation.attributes?.map(attr => `${attr.name}: ${attr.value}`).join(' / ') || `Variação ${index + 1}`}
                        </p>
                        {variation.sku && <p><strong>SKU:</strong> {variation.sku}</p>}
                        {variation.barcode && <p><strong>Cód. Barras:</strong> {variation.barcode}</p>}
                        {variation.referencia && <p><strong>Referência:</strong> {variation.referencia}</p>}
                        <p><strong>Preço Específico:</strong> {variation.price ? `R$ ${variation.price.toFixed(2)}` : 'Usar preço principal'}</p>
                        <p><strong>Preço Varejo:</strong> {variation.price_varejo ? `R$ ${variation.price_varejo}` : 'N/A'}</p>
                        <p><strong>Preço Atacado:</strong> {variation.price_atacado ? `R$ ${variation.price_atacado}` : 'N/A'}</p>
                        <p><strong>Preço Atacarejo:</strong> {variation.price_atacarejo ? `R$ ${variation.price_atacarejo}` : 'N/A'}</p>
                        <p className="font-medium"><strong>Estoque da Variação:</strong> {variation.stock} unidades</p>
                        {variation.medidas && (
                          <div className="mt-2">
                            <span className="font-semibold">Medidas:</span>
                            <ul className="ml-4 list-disc">
                              {Object.entries(variation.medidas).map(([key, value]) => (
                                <li key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value || 'N/A'}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
          {product.product_type === 'variable' && variations.length === 0 && (
             <Card className="glass-effect"><CardContent className="p-6 text-center text-muted-foreground">Nenhuma variação cadastrada para este produto.</CardContent></Card>
          )}
        </div>
      </div>

      {/* Modal de Visualização de Imagem */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage.image_url}
              alt="Visualização"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;