import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calculator, Percent, DollarSign, X } from 'lucide-react';
import { getCurrentUser, hasPermission, PERMISSIONS } from '@/lib/auth';

const PosTotals = ({ subtotal, discountAmount, total, onApplyDiscount, discount }) => {
  const user = getCurrentUser();
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState('');

  const handleDiscountTypeSelect = (type) => {
    setDiscountType(type);
    setDiscountValue('');
  };

  const handleApplyDiscount = () => {
    if (discountType === 'percentage') {
      const value = parseFloat(discountValue);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        onApplyDiscount({ type: 'percentage', value });
        setShowDiscountForm(false);
        setDiscountType(null);
        setDiscountValue('');
      }
    } else if (discountType === 'fixed') {
      const value = parseFloat(discountValue.replace(',', '.'));
      if (!isNaN(value) && value >= 0 && value <= subtotal) {
        onApplyDiscount({ type: 'fixed', value });
        setShowDiscountForm(false);
        setDiscountType(null);
        setDiscountValue('');
      }
    }
  };

  const handleCancelDiscount = () => {
    setShowDiscountForm(false);
    setDiscountType(null);
    setDiscountValue('');
  };

  const handleRemoveDiscount = () => {
    onApplyDiscount({ type: 'none', value: 0 });
  };

  const formatCurrencyInput = (value) => {
    // Remove tudo exceto números e vírgula
    const cleanValue = value.replace(/[^\d,]/g, '');
    // Substitui vírgula por ponto para cálculo
    return cleanValue;
  };

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="w-5 h-5" />
          <span>Totais</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Desconto {discount?.type === 'percentage' ? `(${discount.value}%)` : '(R$)'}:</span>
            <span>- R$ {discountAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t pt-2">
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        {hasPermission(user?.role, PERMISSIONS.APPLY_DISCOUNTS) && (
          <div className="pt-2 border-t space-y-3">
            {!showDiscountForm ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full hover:bg-gray-700 hover:text-white border-gray-600 text-gray-300"
                onClick={() => setShowDiscountForm(true)}
              >
                <Percent className="w-4 h-4 mr-2" />
                Aplicar Desconto
              </Button>
            ) : (
              <div className="space-y-3">
                {/* Botões de tipo de desconto */}
                <div className="flex gap-2">
                  <Button
                    variant={discountType === 'percentage' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 hover:bg-gray-700 hover:text-white border-gray-600 text-gray-300"
                    onClick={() => handleDiscountTypeSelect('percentage')}
                  >
                    <Percent className="w-3 h-3 mr-1" />
                    %
                  </Button>
                  <Button
                    variant={discountType === 'fixed' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 hover:bg-gray-700 hover:text-white border-gray-600 text-gray-300"
                    onClick={() => handleDiscountTypeSelect('fixed')}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    R$
                  </Button>
                </div>

                {/* Campo de valor */}
                {discountType && (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder={discountType === 'percentage' ? 'Ex: 10' : 'Ex: 10,50'}
                      value={discountValue}
                      onChange={(e) => {
                        if (discountType === 'percentage') {
                          setDiscountValue(e.target.value.replace(/[^\d]/g, ''));
                        } else {
                          setDiscountValue(formatCurrencyInput(e.target.value));
                        }
                      }}
                      className="text-center border-gray-600 bg-gray-800 text-white placeholder-gray-400"
                    />
                    
                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleApplyDiscount}
                        disabled={!discountValue || 
                          (discountType === 'percentage' && (parseFloat(discountValue) < 0 || parseFloat(discountValue) > 100)) ||
                          (discountType === 'fixed' && (parseFloat(discountValue.replace(',', '.')) < 0 || parseFloat(discountValue.replace(',', '.')) > subtotal))
                        }
                      >
                        Aplicar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={handleCancelDiscount}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botão para remover desconto */}
            {discountAmount > 0 && !showDiscountForm && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                onClick={handleRemoveDiscount}
              >
                <X className="w-4 h-4 mr-2" />
                Remover Desconto
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PosTotals;