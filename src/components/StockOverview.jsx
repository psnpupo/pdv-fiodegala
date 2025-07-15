import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingDown, TrendingUp, Store, Package } from 'lucide-react';

const StockOverview = () => {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockByStore, setStockByStore] = useState({});
  const [filter, setFilter] = useState({ loja: '', produto: '', referencia: '', barcode: '', categoria: '' });
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: storesData } = await supabase.from('stores').select('*');
      const { data: productsData } = await supabase.from('products').select('*');
      const { data: movementsData } = await supabase.from('stock_movements').select('*');
      const stock = {};
      const allStores = [
        ...storesData,
        { id: 'online', name: 'FDG Online', is_online_store: true }
      ];
      allStores.forEach(store => { stock[store.id] = {}; });
      movementsData.forEach(mov => {
        const storeId = mov.store_id || (mov.stock_type === 'online' ? 'online' : null);
        if (!storeId) return;
        if (!stock[storeId][mov.product_id]) stock[storeId][mov.product_id] = 0;
        stock[storeId][mov.product_id] += mov.quantity;
      });
      setStores(allStores);
      setProducts(productsData);
      setStockByStore(stock);
      const totalPorLoja = {};
      allStores.forEach(store => {
        totalPorLoja[store.id] = Object.values(stock[store.id]).reduce((a, b) => a + b, 0);
      });
      const totalGeral = Object.values(totalPorLoja).reduce((a, b) => a + b, 0);
      const produtosAtivos = productsData.filter(p => p.active).length;
      const estoquesBaixos = productsData.filter(p => p.active && p.min_stock && (stock['online'][p.id] || 0) <= p.min_stock).length;
      setTotals({ ...totalPorLoja, geral: totalGeral, ativos: produtosAtivos, baixos: estoquesBaixos });
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    if (filter.produto && filter.produto !== 'all' && p.id !== filter.produto) return false;
    if (filter.referencia && p.reference !== filter.referencia) return false;
    if (filter.barcode && p.barcode !== filter.barcode) return false;
    if (filter.categoria && p.category !== filter.categoria) return false;
    if (filter.loja && filter.loja !== 'all') {
      if (!stockByStore[filter.loja] || !stockByStore[filter.loja][p.id]) return false;
    }
    return true;
  });

  const exportCSV = () => {
    let csv = 'Loja,Código,Produto,Categoria,Referência,Estoque\n';
    stores.forEach(store => {
      filteredProducts.forEach(product => {
        csv += `${store.name},${product.barcode || ''},${product.name},${product.category || ''},${product.reference || ''},${stockByStore[store.id][product.id] || 0}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estoque_geral.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  const lojaColors = [
    'bg-gradient-to-br from-red-700 via-purple-800 to-purple-900',
    'bg-gradient-to-br from-purple-900 via-red-700 to-purple-800',
    'bg-gradient-to-br from-pink-600 via-purple-800 to-red-700',
    'bg-gradient-to-br from-purple-800 via-pink-600 to-red-700',
  ];

  return (
    <div className="space-y-10 bg-[#11111a] min-h-screen py-8 px-2 md:px-8">
      {/* Filtros avançados */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Select value={filter.loja} onValueChange={v => setFilter(f => ({ ...f, loja: v }))}>
          <SelectTrigger className="w-48 bg-[#18192a] text-white border-none rounded-xl shadow-md"><SelectValue placeholder="Loja" /></SelectTrigger>
          <SelectContent className="bg-[#18192a] text-white">
            <SelectItem value="all">Todas as Lojas</SelectItem>
            {stores.map(store => (
              <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter.produto} onValueChange={v => setFilter(f => ({ ...f, produto: v }))}>
          <SelectTrigger className="w-64 bg-[#18192a] text-white border-none rounded-xl shadow-md"><SelectValue placeholder="Produto" /></SelectTrigger>
          <SelectContent className="bg-[#18192a] text-white">
            <SelectItem value="all">Todos os Produtos</SelectItem>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input className="w-40 bg-[#18192a] text-white border-none rounded-xl shadow-md" placeholder="Referência" value={filter.referencia} onChange={e => setFilter(f => ({ ...f, referencia: e.target.value }))} />
        <Input className="w-40 bg-[#18192a] text-white border-none rounded-xl shadow-md" placeholder="Código de Barras" value={filter.barcode} onChange={e => setFilter(f => ({ ...f, barcode: e.target.value }))} />
        <Input className="w-40 bg-[#18192a] text-white border-none rounded-xl shadow-md" placeholder="Categoria" value={filter.categoria} onChange={e => setFilter(f => ({ ...f, categoria: e.target.value }))} />
        <Button variant="outline" onClick={exportCSV} className="flex items-center gap-2 bg-[#18192a] text-white border-none rounded-xl shadow-md hover:bg-[#23234a]">
          <Download className="w-4 h-4" />Exportar CSV
        </Button>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {stores.map((store, idx) => (
          <Card key={store.id} className={`text-white shadow-2xl rounded-2xl ${lojaColors[idx % lojaColors.length]} border-2 border-[#23234a]`}>
            <CardContent className="flex flex-col items-center py-8">
              <Store className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-lg font-bold tracking-wide">{store.name}</div>
              <div className="text-4xl font-mono font-extrabold drop-shadow-lg">{totals[store.id] || 0}</div>
              <div className="text-xs mt-1 opacity-80">Total em Estoque</div>
            </CardContent>
          </Card>
        ))}
        <Card className="text-white shadow-2xl rounded-2xl bg-gradient-to-br from-red-900 via-purple-900 to-purple-950 border-2 border-[#23234a]">
          <CardContent className="flex flex-col items-center py-8">
            <Package className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-lg font-bold tracking-wide">Total Geral</div>
            <div className="text-4xl font-mono font-extrabold drop-shadow-lg">{totals.geral || 0}</div>
            <div className="text-xs mt-1 opacity-80">Produtos em Estoque</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <Card className="text-white shadow-2xl rounded-2xl bg-gradient-to-br from-purple-900 via-red-900 to-purple-950 border-2 border-[#23234a]">
          <CardContent className="flex flex-col items-center py-8">
            <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-lg font-bold tracking-wide">Produtos Ativos</div>
            <div className="text-4xl font-mono font-extrabold drop-shadow-lg">{totals.ativos || 0}</div>
          </CardContent>
        </Card>
        <Card className="text-white shadow-2xl rounded-2xl bg-gradient-to-br from-red-900 via-pink-900 to-purple-950 border-2 border-[#23234a]">
          <CardContent className="flex flex-col items-center py-8">
            <TrendingDown className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-lg font-bold tracking-wide">Estoque Baixo</div>
            <div className="text-4xl font-mono font-extrabold drop-shadow-lg">{totals.baixos || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada */}
      <div className="overflow-x-auto rounded-2xl shadow-2xl border-2 border-[#23234a] bg-[#161622]">
        <table className="min-w-full text-sm text-white">
          <thead>
            <tr className="bg-[#23234a] text-purple-200">
              <th className="px-4 py-3">Loja</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Referência</th>
              <th className="px-4 py-3 text-right">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(store => (
              filteredProducts.map(product => (
                <tr key={store.id + '-' + product.id} className={((product.min_stock && (stockByStore[store.id][product.id] || 0) <= product.min_stock) ? 'bg-red-900/40' : 'hover:bg-[#23234a]/60 transition') + ' border-b border-[#23234a]'}>
                  <td className="px-4 py-3 font-semibold text-purple-100">{store.name}</td>
                  <td className="px-4 py-3 font-mono text-purple-300">{product.barcode || ''}</td>
                  <td className="px-4 py-3 font-semibold">{product.name}</td>
                  <td className="px-4 py-3">{product.category || ''}</td>
                  <td className="px-4 py-3">{product.reference || ''}</td>
                  <td className="px-4 py-3 text-right font-mono text-lg font-bold text-white drop-shadow-lg">{stockByStore[store.id][product.id] || 0}</td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockOverview; 