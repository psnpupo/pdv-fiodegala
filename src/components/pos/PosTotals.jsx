import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Percent } from 'lucide-react';
import { getCurrentUser, hasPermission, PERMISSIONS } from '@/lib/auth';

const PosTotals = ({ subtotal, discountAmount, total, onApplyDiscount }) => {
  const user = getCurrentUser();

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
            <span>Desconto:</span>
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
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onApplyDiscount}
            >
              <Percent className="w-4 h-4 mr-2" />
              Aplicar Desconto
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PosTotals;