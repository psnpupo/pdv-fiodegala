import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Receipt, Printer } from 'lucide-react';

export const PAYMENT_METHODS = {
  CASH: 'cash',
  DEBIT: 'debit',
  CREDIT: 'credit',
  PIX: 'pix'
};

export const PAYMENT_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Dinheiro',
  [PAYMENT_METHODS.DEBIT]: 'Cartão Débito',
  [PAYMENT_METHODS.CREDIT]: 'Cartão Crédito',
  [PAYMENT_METHODS.PIX]: 'PIX'
};

const PaymentSection = ({ cartLength, payments, totalPaid, remainingAmount, onAddPayment, onFinalizeSale, canFinalize, onPrintReceipt, canPrintReceipt }) => {
  if (cartLength === 0) return null;

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Pagamento</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Pagamentos:</h4>
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between text-sm">
                <span>{PAYMENT_LABELS[payment.method]}</span>
                <span>R$ {payment.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total Pago:</span>
                <span>R$ {totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Restante:</span>
                <span>R$ {remainingAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PAYMENT_LABELS).map(([method, label]) => (
            <Button
              key={method}
              variant="outline"
              size="sm"
              onClick={() => {
                if (remainingAmount > 0) {
                  onAddPayment(method, remainingAmount);
                }
              }}
              disabled={remainingAmount <= 0}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            className="w-full"
            size="lg"
            onClick={onFinalizeSale}
            disabled={!canFinalize}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Finalizar Venda
          </Button>
          
          {canPrintReceipt && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintReceipt}
              className="w-full"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Recibo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSection;