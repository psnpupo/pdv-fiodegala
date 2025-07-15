import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const PAYMENT_LABELS = {
  cash: 'Dinheiro',
  debit: 'Cartão Débito',
  credit: 'Cartão Crédito',
  pix: 'PIX'
};

const PaymentsTab = ({ paymentMethodStats, totalRevenue }) => {
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Métodos de Pagamento</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(paymentMethodStats).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pagamento registrado no período</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {Object.entries(paymentMethodStats).map(([method, stats]) => (
              <div
                key={method}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{PAYMENT_LABELS[method] || method}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.count} transações
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    R$ {stats.amount.toFixed(2)}
                  </p>
                  {totalRevenue > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {((stats.amount / totalRevenue) * 100).toFixed(1)}% do total
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentsTab;