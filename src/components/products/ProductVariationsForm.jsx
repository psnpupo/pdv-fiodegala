import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import ProductImageUpload from './ProductImageUpload';

const ProductVariationsForm = ({ 
  variations, 
  handleVariationChange, 
  handleVariationAttributeChange,
  removeVariation, 
  addVariation,
  handleVariationImageChange,
  variationImageUrlPreviews
}) => {
  if (!variations || variations.length === 0) {
    return (
      <div className="pt-4 border-t mt-6">
        <Button type="button" variant="outline" onClick={addVariation}><Plus className="w-4 h-4 mr-2" />Adicionar Primeira Variação</Button>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t mt-6">
      <h3 className="text-lg font-medium mb-2">Variações do Produto</h3>
      {variations.map((variation, index) => (
        <div key={index} className="p-4 border rounded-md mb-4 space-y-3 bg-muted/20 relative">
          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeVariation(index)}><Trash2 className="w-4 h-4" /></Button>
          <p className="font-semibold text-md">Variação {index + 1}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(variation.attributes || [{name: '', value: ''}]).map((attr, attrIndex) => (
                <React.Fragment key={attrIndex}>
                    <div>
                        <Label htmlFor={`variation_${index}_attribute_name_${attrIndex}`}>Nome do Atributo {attrIndex + 1} (Ex: Cor, Tamanho)</Label>
                        <Input id={`variation_${index}_attribute_name_${attrIndex}`} value={attr.name} onChange={(e) => handleVariationAttributeChange(index, attrIndex, 'name', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor={`variation_${index}_attribute_value_${attrIndex}`}>Valor do Atributo {attrIndex + 1} (Ex: Azul, M)</Label>
                        <Input id={`variation_${index}_attribute_value_${attrIndex}`} value={attr.value} onChange={(e) => handleVariationAttributeChange(index, attrIndex, 'value', e.target.value)} />
                    </div>
                </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label htmlFor={`variation_sku_${index}`}>SKU da Variação</Label><Input id={`variation_sku_${index}`} value={variation.sku || ''} onChange={(e) => handleVariationChange(index, 'sku', e.target.value)} /></div>
            <div><Label htmlFor={`variation_barcode_${index}`}>Cód. Barras Variação</Label><Input id={`variation_barcode_${index}`} value={variation.barcode || ''} onChange={(e) => handleVariationChange(index, 'barcode', e.target.value)} /></div>
            <div><Label htmlFor={`variation_referencia_${index}`}>Referência</Label><Input id={`variation_referencia_${index}`} value={variation.referencia || ''} onChange={(e) => handleVariationChange(index, 'referencia', e.target.value)} /></div>
            <div><Label htmlFor={`variation_price_${index}`}>Preço Variação (opcional)</Label><Input id={`variation_price_${index}`} type="number" step="0.01" value={variation.price || ''} onChange={(e) => handleVariationChange(index, 'price', e.target.value)} placeholder="Usar preço principal" /></div>
            <div><Label htmlFor={`variation_price_varejo_${index}`}>Preço Varejo</Label><Input id={`variation_price_varejo_${index}`} type="number" step="0.01" value={variation.price_varejo || ''} onChange={(e) => handleVariationChange(index, 'price_varejo', e.target.value)} /></div>
            <div><Label htmlFor={`variation_price_atacado_${index}`}>Preço Atacado</Label><Input id={`variation_price_atacado_${index}`} type="number" step="0.01" value={variation.price_atacado || ''} onChange={(e) => handleVariationChange(index, 'price_atacado', e.target.value)} /></div>
            <div><Label htmlFor={`variation_price_atacarejo_${index}`}>Preço Atacarejo</Label><Input id={`variation_price_atacarejo_${index}`} type="number" step="0.01" value={variation.price_atacarejo || ''} onChange={(e) => handleVariationChange(index, 'price_atacarejo', e.target.value)} /></div>
          </div>
          <div>
            <Label htmlFor={`variation_stock_${index}`}>Estoque da Variação *</Label>
            <Input id={`variation_stock_${index}`} type="number" value={variation.stock || '0'} onChange={(e) => handleVariationChange(index, 'stock', e.target.value)} required />
          </div>
          <ProductImageUpload
            title="Imagem da Variação (opcional)"
            imageUrlPreview={variationImageUrlPreviews[index]}
            handleImageChange={(e) => handleVariationImageChange(index, e)}
            idPrefix={`variation_${index}`}
          />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addVariation}><Plus className="w-4 h-4 mr-2" />Adicionar Variação</Button>
    </div>
  );
};

export default ProductVariationsForm;