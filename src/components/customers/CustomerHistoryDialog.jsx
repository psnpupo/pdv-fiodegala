import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle as DialogCardTitle } from '@/components/ui/card'; // Renomeado para evitar conflito

const CustomerHistoryDialog = ({ open, onOpenChange, customer, purchases }) => {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Compras: {customer.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-3 p-1">
          {purchases.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma compra encontrada para este cliente.</p>
          ) : (
            purchases.map(sale => (
              <Card key={sale.id} className="bg-background/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <DialogCardTitle className="text-base">Venda #{sale.id}</DialogCardTitle>
                    <span className="text-sm text-muted-foreground">{new Date(sale.created_at || sale.date).toLocaleString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                <ul className="text-sm space-y-1">
                    {(sale.items || sale.sale_items || []).map(item => (
                      <li key={item.id || item.product_id} className="flex justify-between">
                        <span>{item.quantity}x {item.name || item.products?.name || 'Produto Indisponível'}</span>
                        <span>R$ {(item.subtotal || (item.quantity * item.unit_price)).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                    <span>Total da Venda:</span>
                    <span>R$ {(sale.total_amount || sale.total).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerHistoryDialog;