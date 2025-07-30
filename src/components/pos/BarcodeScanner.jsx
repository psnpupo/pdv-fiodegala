import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getProductByBarcode } from '@/lib/salesApi';

const BarcodeScanner = ({ onProductFound }) => {
  const [barcode, setBarcode] = useState('');
  const { toast } = useToast();

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const result = await getProductByBarcode(barcode);
      if (result && result.product) {
        onProductFound(result.product);
        setBarcode('');
      } else {
        toast({
          title: "Produto não encontrado",
          description: `Código de barras: ${barcode}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const quickAddProduct = async (testBarcode) => {
    try {
      const result = await getProductByBarcode(testBarcode);
      if (result && result.product) {
        onProductFound(result.product);
      } else {
        toast({
          title: "Produto de teste não encontrado",
          description: `Código: ${testBarcode}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar produto de teste",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Scan className="w-5 h-5" />
          <span>Leitor de Código de Barras</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBarcodeSubmit} className="flex space-x-2">
          <Input
            placeholder="Escaneie ou digite o código de barras"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="flex-1 barcode-scanner"
            autoFocus
          />
          <Button type="submit">
            <Plus className="w-4 h-4" />
          </Button>
        </form>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            onClick={() => quickAddProduct('6307CB')}
            className="text-sm"
          >
            Camiseta Básica
          </Button>
          <Button 
            variant="outline" 
            onClick={() => quickAddProduct('7182CSR')}
            className="text-sm"
          >
            Calça com Regulagem
          </Button>
          <Button 
            variant="outline" 
            onClick={() => quickAddProduct('4411GM')}
            className="text-sm"
          >
            Gola Média
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;