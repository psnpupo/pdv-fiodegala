import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const LowStockAlert = ({ products }) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
          <AlertTriangle className="w-5 h-5" />
          <span>Produtos com Estoque Baixo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {products.map(product => (
            <div key={product.id} className="text-sm p-2 bg-orange-100 dark:bg-orange-900/50 rounded">
              <span className="font-medium">{product.name}</span>
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                (Estoque: {product.stock} / Mín: {product.min_stock})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LowStockAlert;