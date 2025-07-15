import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const CashRegisterControls = ({ cashRegister, onOpenCashRegister, onCloseCashRegister }) => {
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Caixa</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Status do Caixa</p>
          <p className={`font-bold ${cashRegister.isOpen ? 'text-green-600' : 'text-red-600'}`}>
            {cashRegister.isOpen ? 'ABERTO' : 'FECHADO'}
          </p>
          {cashRegister.isOpen && (
            <p className="text-lg font-bold">
              R$ {cashRegister.currentAmount.toFixed(2)}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCashRegister}
            disabled={cashRegister.isOpen}
          >
            Abrir Caixa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCloseCashRegister}
            disabled={!cashRegister.isOpen}
          >
            Fechar Caixa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashRegisterControls;