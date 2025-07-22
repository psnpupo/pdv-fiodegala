import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const PRODUCT_TYPES = {
  SIMPLE: 'simple',
  VARIABLE: 'variable',
};

const ProductFormFields = ({ formData, handleInputChange, handleProductTypeChange }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select name="category" value={formData.category} onValueChange={(value) => handleInputChange({ target: { name: 'category', value } })}>
            <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Camiseta">Camiseta</SelectItem>
              <SelectItem value="Gola Média">Gola Média</SelectItem>
              <SelectItem value="Camisa">Camisa</SelectItem>
              <SelectItem value="Blazer">Blazer</SelectItem>
              <SelectItem value="Jaqueta">Jaqueta</SelectItem>
              <SelectItem value="Súeter">Súeter</SelectItem>
              <SelectItem value="Calças">Calças</SelectItem>
              <SelectItem value="Bermudas">Bermudas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="barcode">Código de Barras Principal *</Label>
          <Input id="barcode" name="barcode" value={formData.barcode} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="price">Preço Principal *</Label>
          <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="price_varejo">Preço de Varejo</Label>
          <Input id="price_varejo" name="price_varejo" type="number" step="0.01" value={formData.price_varejo || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="price_atacado">Preço de Atacado</Label>
          <Input id="price_atacado" name="price_atacado" type="number" step="0.01" value={formData.price_atacado || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="price_atacarejo">Cliente Exclusivo</Label>
          <Input id="price_atacarejo" name="price_atacarejo" type="number" step="0.01" value={formData.price_atacarejo || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="product_type">Tipo de Produto *</Label>
          <Select name="product_type" value={formData.product_type} onValueChange={handleProductTypeChange}>
            <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={PRODUCT_TYPES.SIMPLE}>Produto Simples</SelectItem>
              <SelectItem value={PRODUCT_TYPES.VARIABLE}>Produto Variável</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.product_type === PRODUCT_TYPES.SIMPLE && (
          <div>
            <Label htmlFor="stock">Estoque (Simples) *</Label>
            <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleInputChange} required />
          </div>
        )}
        <div>
          <Label htmlFor="referencia">Referência *</Label>
          <Input id="referencia" name="referencia" value={formData.referencia || ''} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="min_stock">Estoque Mínimo Global (Alerta)</Label>
          <Input id="min_stock" name="min_stock" type="number" value={formData.min_stock} onChange={handleInputChange} />
        </div>
      </div>

      <div className="pt-4 border-t mt-6">
        <h3 className="text-lg font-medium mb-2">Dimensões e Peso (para frete)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><Label htmlFor="weight">Peso (kg)</Label><Input id="weight" name="weight" type="number" step="0.01" value={formData.weight} onChange={handleInputChange} /></div>
          <div><Label htmlFor="length">Comprimento (cm)</Label><Input id="length" name="length" type="number" step="0.1" value={formData.length} onChange={handleInputChange} /></div>
          <div><Label htmlFor="height">Altura (cm)</Label><Input id="height" name="height" type="number" step="0.1" value={formData.height} onChange={handleInputChange} /></div>
          <div><Label htmlFor="width">Largura (cm)</Label><Input id="width" name="width" type="number" step="0.1" value={formData.width} onChange={handleInputChange} /></div>
        </div>
      </div>
    </>
  );
};

export default ProductFormFields;