import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getCashRegisterState, openCashRegister, closeCashRegister } from '../../lib/cashRegisterApi';
import { getCurrentUser } from '../../lib/auth';

const CashRegisterControls = ({ storeId, onCashRegisterChange }) => {
  const [cashRegister, setCashRegister] = useState({
    isOpen: false,
    currentAmount: 0,
    openingAmount: 0,
    openedBy: null,
    openedAt: null,
    closedAt: null,
    id: null,
    store_id: storeId,
    store: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [finalAmount, setFinalAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  const { toast } = useToast();

  // Carregar estado do caixa
  const loadCashRegisterState = async () => {
    try {
      setIsLoading(true);
      const state = await getCashRegisterState(storeId);
      setCashRegister(state);
      if (onCashRegisterChange) {
        onCashRegisterChange(state);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCashRegisterState();
  }, [storeId]);

  // Abrir caixa
  const handleOpenCashRegister = async () => {
    if (!initialAmount || parseFloat(initialAmount) < 0) {
      toast({
        title: "Erro",
        description: "Valor inicial é obrigatório e deve ser maior ou igual a zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const currentUser = getCurrentUser();
      const result = await openCashRegister(
        parseFloat(initialAmount),
        storeId,
        currentUser?.id
      );
      
      setCashRegister(result.cashRegister);
      if (onCashRegisterChange) {
        onCashRegisterChange(result.cashRegister);
      }
      
      setOpenDialog(false);
      setInitialAmount('');
      
      toast({
        title: "Sucesso",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fechar caixa
  const handleCloseCashRegister = async () => {
    try {
      setIsLoading(true);
      const currentUser = getCurrentUser();
      const result = await closeCashRegister(
        parseFloat(finalAmount) || cashRegister.currentAmount,
        storeId,
        currentUser?.id,
        notes
      );
      
      setCashRegister(result.cashRegister);
      if (onCashRegisterChange) {
        onCashRegisterChange(result.cashRegister);
      }
      
      setCloseDialog(false);
      setFinalAmount('');
      setNotes('');
      
      toast({
        title: "Sucesso",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Caixa</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Status do Caixa</p>
            <p className={`font-bold ${cashRegister.isOpen ? 'text-green-600' : 'text-red-600'}`}>
              {cashRegister.isOpen ? 'ABERTO' : 'FECHADO'}
            </p>
            {cashRegister.isOpen && (
              <p className="text-lg font-bold">
                R$ {cashRegister.currentAmount.toFixed(2)}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cashRegister.isOpen || isLoading}
                >
                  Abrir Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Caixa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="initialAmount">Valor Inicial (R$)</Label>
                    <Input
                      id="initialAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={initialAmount}
                      onChange={(e) => setInitialAmount(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setOpenDialog(false)}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleOpenCashRegister}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Abrindo...' : 'Abrir Caixa'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!cashRegister.isOpen || isLoading}
                >
                  Fechar Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fechar Caixa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="finalAmount">Valor Final (R$)</Label>
                    <Input
                      id="finalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={finalAmount}
                      onChange={(e) => setFinalAmount(e.target.value)}
                      placeholder={cashRegister.currentAmount.toFixed(2)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre o fechamento..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCloseDialog(false)}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCloseCashRegister}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Fechando...' : 'Fechar Caixa'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CashRegisterControls;