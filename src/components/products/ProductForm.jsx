import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Share2, CornerDownRight } from 'lucide-react';
import { getStores, hasPermission, PERMISSIONS, getCurrentUser } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import { shareProductStockWithStore, getProductStoreStock } from '@/lib/productsStorage';
import { getActiveCategories } from '@/lib/categoriesStorage';
import { supabase } from '@/lib/supabaseClient';
import ProductFormFields, { PRODUCT_TYPES } from './ProductFormFields';
import ProductVariationsForm from './ProductVariationsForm';
import ProductImageUpload from './ProductImageUpload';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import WooCommerceService from '@/lib/woocommerceService';

const ProductForm = ({ open, onOpenChange, formData, setFormData, onSubmit, editingProduct, resetForm, onStockShared }) => {
  const [physicalStores, setPhysicalStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showShareStock, setShowShareStock] = useState(false);
  const [shareStoreId, setShareStoreId] = useState('');
  const [shareQuantity, setShareQuantity] = useState('');
  const [productStoreStocks, setProductStoreStocks] = useState([]);
  const [variations, setVariations] = useState([]);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImageUrlPreview, setMainImageUrlPreview] = useState('');
  const [variationImageFiles, setVariationImageFiles] = useState({});
  const [variationImageUrlPreviews, setVariationImageUrlPreviews] = useState({});
  // 1. Adicionar estado para múltiplas imagens
  const [productImages, setProductImages] = useState([]); // arquivos
  const [productImagePreviews, setProductImagePreviews] = useState([]); // urls
  const [showMedidasModal, setShowMedidasModal] = useState(false);
  const [medidas, setMedidas] = useState(formData.medidas || {
    ombro: '', busto: '', cintura: '', quadril: '', comprimento: '', manga: '', tornozelo: ''
  });
  const [syncWithWooCommerce, setSyncWithWooCommerce] = useState(false);
  const [woocommerceId, setWooCommerceId] = useState('');
  const [isWooCommerceConnected, setIsWooCommerceConnected] = useState(false);

  const mainImageInputRef = useRef(null);
  
  const { toast } = useToast();
  const user = getCurrentUser();

  const initialFormData = {
    name: '', category: '', barcode: '', price: '', 
    price_varejo: '', price_atacado: '', price_atacarejo: '',
    referencia: '',
    stock: '0', min_stock: '0', active: true,
    weight: '', length: '', height: '', width: '',
    product_type: PRODUCT_TYPES.SIMPLE, image_url: '',
  };

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        barcode: editingProduct.barcode || '',
        price: editingProduct.price?.toString() || '',
        price_varejo: editingProduct.price_varejo?.toString() || '',
        price_atacado: editingProduct.price_atacado?.toString() || '',
        price_atacarejo: editingProduct.price_atacarejo?.toString() || '',
        referencia: editingProduct.referencia || '',
        stock: editingProduct.product_type === PRODUCT_TYPES.SIMPLE ? (editingProduct.stock?.toString() || '0') : '0',
        min_stock: editingProduct.min_stock?.toString() || '0',
        active: editingProduct.active !== undefined ? editingProduct.active : true,
        weight: editingProduct.weight?.toString() || '',
        length: editingProduct.length?.toString() || '',
        height: editingProduct.height?.toString() || '',
        width: editingProduct.width?.toString() || '',
        product_type: editingProduct.product_type || PRODUCT_TYPES.SIMPLE,
        image_url: editingProduct.image_url || '',
      });
      setVariations(editingProduct.variations || []);
      setMainImageUrlPreview(editingProduct.image_url || '');
      const previews = {};
      (editingProduct.variations || []).forEach((v, index) => {
        if (v.image_url) previews[index] = v.image_url;
      });
      setVariationImageUrlPreviews(previews);
    } else {
      setFormData(initialFormData);
      setVariations([]);
      setMainImageUrlPreview('');
      setVariationImageUrlPreviews({});
    }
  }, [editingProduct, open, setFormData]);

  useEffect(() => {
    setMedidas(formData.medidas || { ombro: '', busto: '', cintura: '', quadril: '', comprimento: '', manga: '', tornozelo: '' });
  }, [formData.medidas]);

  // Testar conexão com WooCommerce
  const testWooCommerceConnection = async () => {
    try {
      const woocommerceService = new WooCommerceService();
      await woocommerceService.testConnection();
      setIsWooCommerceConnected(true);
      toast({
        title: "Conexão OK",
        description: "Conexão com WooCommerce estabelecida com sucesso!",
        variant: "default"
      });
    } catch (error) {
      setIsWooCommerceConnected(false);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar com o WooCommerce. Verifique as configurações.",
        variant: "destructive"
      });
    }
  };

  // Função para determinar quais campos de medida mostrar baseado na categoria
  const getMedidasFields = () => {
    const categoria = formData.category;
    const categoriasRoupa = ['Camiseta', 'Gola Média', 'Camisa', 'Blazer', 'Jaqueta', 'Súeter'];
    const categoriasCalca = ['Calças', 'Bermudas'];
    
    if (categoriasRoupa.includes(categoria)) {
      return [
        { name: 'tamanho', label: 'Tamanho' },
        { name: 'comprimento', label: 'Comprimento' },
        { name: 'busto', label: 'Busto' },
        { name: 'cintura', label: 'Cintura' },
        { name: 'ombro', label: 'Ombro' },
        { name: 'manga', label: 'Manga' }
      ];
    } else if (categoriasCalca.includes(categoria)) {
      return [
        { name: 'tamanho', label: 'Tamanho' },
        { name: 'comprimento', label: 'Comprimento' },
        { name: 'cintura', label: 'Cintura' },
        { name: 'tornozelo', label: 'Tornozelo' }
      ];
    }
    return []; // Retorna array vazio se não for uma categoria específica
  };

  useEffect(() => {
    const fetchPhysicalStores = async () => {
      const allStores = await getStores(true); 
      setPhysicalStores(allStores || []);
    };
    fetchPhysicalStores();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getActiveCategories();
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProductStocks = async () => {
      if (editingProduct && editingProduct.id) {
        const stocks = await getProductStoreStock(editingProduct.id);
        setProductStoreStocks(stocks || []);
      } else {
        setProductStoreStocks([]);
      }
    };
    if (open && editingProduct) {
      fetchProductStocks();
    }
  }, [open, editingProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMedidasChange = (e) => {
    const { name, value } = e.target;
    setMedidas(prev => ({ ...prev, [name]: value }));
  };

  const salvarMedidas = () => {
    setFormData(prev => ({ ...prev, medidas }));
    setShowMedidasModal(false);
  };

  const handleProductTypeChange = (value) => {
    setFormData(prev => ({ ...prev, product_type: value, stock: value === PRODUCT_TYPES.SIMPLE ? prev.stock : '0' }));
    if (value === PRODUCT_TYPES.SIMPLE) {
      setVariations([]); 
    } else {
      if (variations.length === 0) {
        addVariation(); 
      }
    }
  };

  const addVariation = () => {
    setVariations(prev => [...prev, { attributes: [{name: 'Cor', value: ''}, {name: 'Tamanho', value: ''}], sku: '', barcode: '', price: '', stock: '0', image_url: '' }]);
  };

  const handleVariationChange = (index, field, value) => {
    const newVariations = [...variations];
    newVariations[index][field] = value;
    setVariations(newVariations);
  };
  
  const handleVariationAttributeChange = (variationIndex, attributeIndex, field, value) => {
    const newVariations = [...variations];
    if (!newVariations[variationIndex].attributes) newVariations[variationIndex].attributes = [];
    if (!newVariations[variationIndex].attributes[attributeIndex]) {
        newVariations[variationIndex].attributes[attributeIndex] = { name: '', value: '' };
    }
    newVariations[variationIndex].attributes[attributeIndex][field] = value;
    setVariations(newVariations);
  };

  const removeVariation = (index) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
    setVariationImageFiles(prev => { const newFiles = {...prev}; delete newFiles[index]; return newFiles; });
    setVariationImageUrlPreviews(prev => { const newPreviews = {...prev}; delete newPreviews[index]; return newPreviews; });
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImageFile(file);
      setMainImageUrlPreview(URL.createObjectURL(file));
    }
  };

  const handleVariationImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      setVariationImageFiles(prev => ({ ...prev, [index]: file }));
      setVariationImageUrlPreviews(prev => ({ ...prev, [index]: URL.createObjectURL(file) }));
    }
  };

  // 2. Função para lidar com seleção de múltiplas imagens
  const handleProductImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setProductImages(files);
    setProductImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const uploadImage = async (file, bucketName = 'img-products') => {
    if (!file) return null;
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) {
      toast({ title: "Erro no Upload da Imagem", description: error.message, variant: "destructive" });
      throw error;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return publicUrl;
  };

  // Função para submit do formulário HTML
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await internalHandleSubmit();
  };

  // internalHandleSubmit agora não recebe mais o evento
  const internalHandleSubmit = async () => {
    // ... upload da imagem principal (mantém para compatibilidade)
    let mainImageUrl = formData.image_url;
    if (mainImageFile) {
      try {
        mainImageUrl = await uploadImage(mainImageFile);
      } catch (error) { return; }
    }

    // Upload múltiplo de imagens
    let uploadedImageUrls = [];
    if (productImages.length > 0) {
      uploadedImageUrls = await Promise.all(productImages.map(async (file) => {
        try {
          return await uploadImage(file);
        } catch (error) { return null; }
      }));
      uploadedImageUrls = uploadedImageUrls.filter(Boolean);
    }

    // ... processar variações normalmente
    const processedVariations = await Promise.all(
      variations.map(async (v, index) => {
        let variationImageUrl = v.image_url;
        if (variationImageFiles[index]) {
          try {
            variationImageUrl = await uploadImage(variationImageFiles[index]);
          } catch (error) { throw new Error(`Erro ao fazer upload da imagem para variação ${index + 1}.`); }
        }
        return { ...v, image_url: variationImageUrl, price: parseFloat(v.price) || null, stock: parseInt(v.stock) || 0 };
      })
    ).catch(error => {
        toast({ title: "Erro no processamento de variações", description: error.message, variant: "destructive" });
        return null; 
    });

    if (!processedVariations && variations.length > 0) return;

    const payload = {
      ...formData,
      referencia: formData.referencia,
      image_url: mainImageUrl,
      variations: formData.product_type === PRODUCT_TYPES.VARIABLE ? processedVariations : [],
      // Tratar campos numéricos
      price: parseFloat(formData.price) || 0,
      price_varejo: parseFloat(formData.price_varejo) || 0,
      price_atacado: parseFloat(formData.price_atacado) || 0,
      price_atacarejo: parseFloat(formData.price_atacarejo) || 0,
      weight: parseFloat(formData.weight) || null,
      length: parseFloat(formData.length) || null,
      height: parseFloat(formData.height) || null,
      width: parseFloat(formData.width) || null,
    };
    
    if (payload.product_type === PRODUCT_TYPES.VARIABLE) {
        payload.stock = (processedVariations || []).reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    } else {
        payload.stock = parseInt(formData.stock) || 0;
    }

    // Adicionar flag de sincronização e imagens ao payload
    const finalPayload = {
      ...payload,
      syncWithWooCommerce: syncWithWooCommerce && isWooCommerceConnected,
      uploadedImageUrls: uploadedImageUrls
    };

    onSubmit(finalPayload, uploadedImageUrls); 
  };

  const handleShareStock = async () => {
    if (!editingProduct || !shareStoreId || !shareQuantity) {
      toast({ title: "Erro", description: "Selecione produto, loja e quantidade para compartilhar.", variant: "destructive" });
      return;
    }
    const quantity = parseInt(shareQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Erro", description: "Quantidade inválida.", variant: "destructive" });
      return;
    }
    try {
      await shareProductStockWithStore(editingProduct.id, shareStoreId, quantity, null);
      toast({ title: "Estoque Compartilhado!", description: `${quantity} unidades compartilhadas com sucesso.` });
      setShareStoreId(''); setShareQuantity(''); setShowShareStock(false);
      const updatedStocks = await getProductStoreStock(editingProduct.id);
      setProductStoreStocks(updatedStocks || []);
      if(onStockShared) onStockShared();
    } catch (error) {
      toast({ title: "Erro ao compartilhar", description: error.message, variant: "destructive" });
    }
  };
  
  const canShareStock = user && hasPermission(user.role, PERMISSIONS.SHARE_STOCK);

  const handleDialogClose = () => {
    onOpenChange(false);
    resetForm(); 
    setShowShareStock(false);
    setShareStoreId('');
    setShareQuantity('');
    setProductStoreStocks([]);
    setVariations([]);
    setMainImageFile(null);
    setMainImageUrlPreview('');
    setVariationImageFiles({});
    setVariationImageUrlPreviews({});
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleDialogClose(); else onOpenChange(true); }}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Novo Produto</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <form id="product-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto space-y-6 p-2 pr-4">
                    <ProductFormFields
            formData={formData}
            handleInputChange={handleInputChange}
            handleProductTypeChange={handleProductTypeChange}
            categories={categories}
          />
          <ProductImageUpload
            title="Imagem Principal (opcional)"
            imageUrlPreview={mainImageUrlPreview}
            handleImageChange={handleMainImageChange}
            idPrefix="main"
          />
          <div className="mt-4">
            <Label>Imagens do Produto (várias)</Label>
            <div className="flex gap-2 flex-wrap mt-2">
              {productImagePreviews.map((url, idx) => (
                <div key={idx} className={`relative group rounded-lg shadow-md border bg-background ${idx === 0 ? 'ring-2 ring-primary' : ''}`}>
                  <img
                    src={url}
                    alt={`Imagem ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg transition-transform group-hover:scale-105"
                  />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-primary text-xs text-white px-2 py-0.5 rounded shadow">Destaque</span>
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-80 hover:opacity-100"
                    onClick={() => {
                      setProductImages(prev => prev.filter((_, i) => i !== idx));
                      setProductImagePreviews(prev => prev.filter((_, i) => i !== idx));
                    }}
                    title="Remover imagem"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-muted-foreground rounded-lg cursor-pointer hover:bg-muted transition">
                <span className="text-3xl text-muted-foreground">+</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleProductImagesChange}
                />
              </label>
            </div>
            <div className="text-xs text-muted-foreground mt-1">A primeira imagem será a de destaque.</div>
          </div>
          {formData.product_type === PRODUCT_TYPES.VARIABLE && (
            <ProductVariationsForm
              variations={variations}
              handleVariationChange={handleVariationChange}
              handleVariationAttributeChange={handleVariationAttributeChange}
              removeVariation={removeVariation}
              addVariation={addVariation}
              handleVariationImageChange={handleVariationImageChange}
              variationImageUrlPreviews={variationImageUrlPreviews}
            />
          )}

          {/* Seção WooCommerce */}
          <div className="pt-4 border-t mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Integração WooCommerce</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={testWooCommerceConnection}
              >
                Testar Conexão
              </Button>
            </div>
            <div className="p-4 border rounded-md bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={syncWithWooCommerce}
                    onCheckedChange={setSyncWithWooCommerce}
                    disabled={!isWooCommerceConnected}
                  />
                  <Label>Sincronizar com WooCommerce</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isWooCommerceConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-muted-foreground">
                    {isWooCommerceConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
              {woocommerceId && (
                <div className="text-sm text-muted-foreground">
                  ID WooCommerce: {woocommerceId}
                </div>
              )}
              {!isWooCommerceConnected && (
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Clique em "Testar Conexão" para verificar a integração com WooCommerce.
                </div>
              )}
            </div>
          </div>

          {editingProduct && canShareStock && (
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Compartilhar Estoque com Lojas Físicas</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowShareStock(!showShareStock)}>
                  <Share2 className="w-4 h-4 mr-2" />{showShareStock ? 'Fechar' : 'Abrir'} Compartilhamento
                </Button>
              </div>
              {showShareStock && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/30">
                  <div>
                    <Label htmlFor="shareStoreId">Loja Física</Label>
                    <Select value={shareStoreId} onValueChange={setShareStoreId}>
                      <SelectTrigger><SelectValue placeholder="Selecione a loja" /></SelectTrigger>
                      <SelectContent>{physicalStores.map(store => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label htmlFor="shareQuantity">Qtd. a Compartilhar</Label><input id="shareQuantity" type="number" min="1" value={shareQuantity} onChange={(e) => setShareQuantity(e.target.value)} className="input w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md" /></div>
                  <div className="md:self-end"><Button type="button" onClick={handleShareStock} className="w-full">Compartilhar</Button></div>
                </div>
              )}
              {productStoreStocks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Estoque Compartilhado:</h4>
                  {productStoreStocks.map(pss => (<div key={pss.id} className="flex items-center justify-between text-sm p-2 bg-background rounded-md"><div className="flex items-center"><CornerDownRight className="w-4 h-4 mr-2 text-muted-foreground" /><span>{pss.stores?.name || 'Loja desconhecida'}</span></div><span>{pss.quantity} unidades</span></div>))}
                </div>
              )}
            </div>
          )}
        </form>
        
        {/* Botões de ação fixos na parte inferior */}
        <div className="flex justify-end space-x-2 pt-4 border-t mt-4 bg-background">
          <Button type="button" variant="outline" onClick={handleDialogClose}>
            Cancelar
          </Button>
          <Button type="submit" form="product-form">
            {editingProduct ? 'Atualizar' : 'Criar'} Produto
          </Button>
        </div>
        {/* Botão para abrir modal de medidas */}
        <Button type="button" variant="outline" className="mt-2" onClick={() => setShowMedidasModal(true)}>
          Adicionar Medidas
        </Button>
        <Dialog open={showMedidasModal} onOpenChange={setShowMedidasModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Medidas da Peça</DialogTitle>
            </DialogHeader>
            {formData.category ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {getMedidasFields().map((field) => (
                  <div key={field.name}>
                    <Label>{field.label}</Label>
                    <Input 
                      name={field.name} 
                      value={medidas[field.name] || ''} 
                      onChange={handleMedidasChange} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecione uma categoria primeiro para ver os campos de medidas disponíveis.
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="ghost" onClick={() => setShowMedidasModal(false)}>Cancelar</Button>
              <Button type="button" onClick={salvarMedidas}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;