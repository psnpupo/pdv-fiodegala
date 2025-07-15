import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSales, getProducts, getCustomers, getCashRegisterLogs } from '@/lib/storage';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import ReportSummary from '@/components/reports/ReportSummary';
import SalesTab from '@/components/reports/SalesTab';
import ProductsTab from '@/components/reports/ProductsTab';
import PaymentsTab from '@/components/reports/PaymentsTab';
import PerformanceTab from '@/components/reports/PerformanceTab';

const PERIOD_LABELS = {
  today: 'Hoje',
  yesterday: 'Ontem',
  week: 'Últimos 7 dias',
  month: 'Este mês',
  all: 'Todo o período'
};

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const salesData = await getSales();
      setSales(salesData || []);
    } catch (error) {
      toast({ title: "Erro ao carregar vendas", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(now.getDate() - 6);
    last7DaysStart.setHours(0, 0, 0, 0);
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.date); // Use created_at from Supabase
      switch (dateFilter) {
        case 'today':
          return saleDate >= today && saleDate <= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        case 'yesterday':
          return saleDate >= yesterday && saleDate < today;
        case 'week':
          return saleDate >= last7DaysStart && saleDate <= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        case 'month':
          return saleDate >= thisMonthStart && saleDate <= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        case 'all':
        default:
          return true;
      }
    });
  }, [sales, dateFilter]);

  const reportData = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || sale.total || 0), 0);
    const totalSalesCount = filteredSales.length;
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
    
    const totalItemsSold = filteredSales.reduce((sum, sale) => {
        const itemsArray = sale.items || sale.sale_items || [];
        return sum + itemsArray.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    }, 0);


    const topProducts = (() => {
      const productSales = {};
      filteredSales.forEach(sale => {
        const itemsArray = sale.items || sale.sale_items || [];
        itemsArray.forEach(item => {
          const productId = item.product_id || item.productId;
          const productName = item.products?.name || item.name || 'Produto Desconhecido';
          const itemSubtotal = item.subtotal || (item.quantity * item.unit_price) || 0;

          if (!productSales[productId]) {
            productSales[productId] = { id: productId, name: productName, quantity: 0, revenue: 0 };
          }
          productSales[productId].quantity += item.quantity || 0;
          productSales[productId].revenue += itemSubtotal;
        });
      });
      return Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    })();

    const paymentMethodStats = (() => {
      const stats = {};
      filteredSales.forEach(sale => {
        const paymentsArray = sale.payment_details || sale.payments || [];
        paymentsArray.forEach(payment => {
          if (!stats[payment.method]) stats[payment.method] = { count: 0, amount: 0 };
          stats[payment.method].count += 1;
          stats[payment.method].amount += payment.amount || 0;
        });
      });
      return stats;
    })();

    const salesByHour = (() => {
      const stats = {};
      filteredSales.forEach(sale => {
        const hour = new Date(sale.created_at || sale.date).getHours().toString();
        if (!stats[hour]) stats[hour] = { count: 0, revenue: 0 };
        stats[hour].count += 1;
        stats[hour].revenue += (sale.total_amount || sale.total || 0);
      });
      return stats;
    })();
    
    const salesByUser = (() => {
      const stats = {};
      filteredSales.forEach(sale => {
        const user = sale.cashier_name || sale.cashier || 'Desconhecido';
        if (!stats[user]) stats[user] = { count: 0, revenue: 0 };
        stats[user].count += 1;
        stats[user].revenue += (sale.total_amount || sale.total || 0);
      });
      return stats;
    })();

    return {
      totalRevenue,
      totalSales: totalSalesCount,
      averageTicket,
      totalItemsSold,
      topProducts,
      paymentMethodStats,
      salesByHour,
      salesByUser
    };
  }, [filteredSales]);

  const exportReport = () => {
    toast({
      title: "🚧 Em Desenvolvimento 🚧",
      description: "A funcionalidade de exportar relatórios será implementada em breve!",
    });
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada de vendas e performance da loja.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Selecione o período" /></SelectTrigger>
            <SelectContent>
              {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}><Download className="w-4 h-4 mr-2" />Exportar</Button>
        </div>
      </div>

      <ReportSummary
        totalRevenue={reportData.totalRevenue}
        totalSales={reportData.totalSales}
        averageTicket={reportData.averageTicket}
        totalItemsSold={reportData.totalItemsSold}
      />

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales"><SalesTab sales={filteredSales} salesByHour={reportData.salesByHour} /></TabsContent>
        <TabsContent value="products"><ProductsTab topProducts={reportData.topProducts} /></TabsContent>
        <TabsContent value="payments"><PaymentsTab paymentMethodStats={reportData.paymentMethodStats} totalRevenue={reportData.totalRevenue} /></TabsContent>
        <TabsContent value="performance">
          <PerformanceTab
            salesByUser={reportData.salesByUser}
            dateFilter={dateFilter}
            totalSales={reportData.totalSales}
            totalRevenue={reportData.totalRevenue}
            averageTicket={reportData.averageTicket}
            totalItemsSold={reportData.totalItemsSold}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;