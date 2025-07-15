import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';

const ReportSummary = ({ totalRevenue, totalSales, averageTicket, totalItemsSold }) => {
  const summaryItems = [
    { icon: DollarSign, value: `R$ ${totalRevenue.toFixed(2)}`, label: 'Faturamento', color: 'text-green-500' },
    { icon: ShoppingCart, value: totalSales, label: 'Vendas', color: 'text-blue-500' },
    { icon: TrendingUp, value: `R$ ${averageTicket.toFixed(2)}`, label: 'Ticket Médio', color: 'text-purple-500' },
    { icon: Package, value: totalItemsSold, label: 'Itens Vendidos', color: 'text-orange-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryItems.map(item => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full bg-primary/10 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ReportSummary;