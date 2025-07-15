import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ShoppingCart, Calendar } from 'lucide-react';

const SalesTab = ({ sales, salesByHour }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Vendas Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda no período selecionado</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sales.slice(0, 10).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">Venda #{sale.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.cashier} • {new Date(sale.date).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sale.items.length} itens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {sale.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Vendas por Horário</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(salesByHour).length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda por horário no período</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(salesByHour)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([hour, stats]) => (
                  <div key={hour} className="flex items-center justify-between p-2 bg-background/50 rounded-md">
                    <span className="text-sm font-medium">{hour.padStart(2, '0')}:00 - {String(parseInt(hour)+1).padStart(2, '0')}:00</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                        {stats.count} vendas
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        R$ {stats.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesTab;