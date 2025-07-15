import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';

const PERIOD_LABELS = {
  today: 'Hoje',
  yesterday: 'Ontem',
  week: 'Últimos 7 dias',
  month: 'Este mês'
};

const PerformanceTab = ({ salesByUser, dateFilter, totalSales, totalRevenue, averageTicket, totalItemsSold }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Performance por Operador</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(salesByUser).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda por operador no período</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(salesByUser).map(([cashier, stats]) => (
                <div
                  key={cashier}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{cashier || "Não identificado"}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.count} vendas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {stats.revenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ticket Médio: R$ {(stats.revenue / stats.count || 0).toFixed(2)}
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
            <TrendingUp className="w-5 h-5" />
            <span>Resumo do Período</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-xl font-bold text-primary">
                {PERIOD_LABELS[dateFilter]}
              </p>
              <p className="text-sm text-muted-foreground">Período Selecionado</p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total de Vendas:</span>
                <span className="font-medium">{totalSales}</span>
              </div>
              <div className="flex justify-between">
                <span>Faturamento Total:</span>
                <span className="font-medium text-green-600">R$ {totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ticket Médio:</span>
                <span className="font-medium">R$ {averageTicket.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Itens Vendidos:</span>
                <span className="font-medium">{totalItemsSold}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTab;