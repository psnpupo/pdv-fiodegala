import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  DollarSign, 
  Lock, 
  Unlock, 
  History, 
  Plus, 
  Minus, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  getCashRegisterState, 
  openCashRegister, 
  closeCashRegister, 
  getCashRegisterLogs,
  addCashRegisterLog 
} from '@/lib/cashRegisterApi';
import { getCurrentUser, hasPermission, PERMISSIONS } from '@/lib/auth';

const CashRegister = () => {
  const [cashRegister, setCashRegister] = useState({
    isOpen: false,
    currentAmount: 0,
    openingAmount: 0,
    openedBy: null,
    openedAt: null,
    closedAt: null,
    id: null,
    store_id: null,
    store: null
  });
  
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [movementDialog, setMovementDialog] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [finalAmount, setFinalAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementType, setMovementType] = useState('add');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('status');
  
  const { toast } = useToast();
  const user = getCurrentUser();

  // Verificar permissões
  const canManageCashRegister = hasPermission(user?.role, PERMISSIONS.CASH_REGISTER_MANAGEMENT);

  // Carregar estado do caixa
  const loadCashRegisterState = async () => {
    try {
      setIsLoading(true);
      // Usar loja padrão se não houver loja definida
      const defaultStoreId = user?.store_id || '1fa90f00-cf02-4a42-8167-c599537c22bb'; // Loja online padrão
      const state = await getCashRegisterState(defaultStoreId);
      setCashRegister(state);
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

  // Carregar logs
  const loadLogs = async () => {
    try {
      const result = await getCashRegisterLogs({ limit: 100 });
      setLogs(result.logs || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadCashRegisterState();
    loadLogs();
  }, []);

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
      const result = await openCashRegister(
        parseFloat(initialAmount),
        cashRegister.store_id,
        user?.id
      );
      
      setCashRegister(result.cashRegister);
      setOpenDialog(false);
      setInitialAmount('');
      
      toast({
        title: "Sucesso",
        description: result.message,
      });
      
      // Recarregar logs
      loadLogs();
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
      const result = await closeCashRegister(
        parseFloat(finalAmount) || cashRegister.currentAmount,
        cashRegister.store_id,
        user?.id,
        notes
      );
      
      setCashRegister(result.cashRegister);
      setCloseDialog(false);
      setFinalAmount('');
      setNotes('');
      
      toast({
        title: "Sucesso",
        description: result.message,
      });
      
      // Recarregar logs
      loadLogs();
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

  // Adicionar movimentação
  const handleAddMovement = async () => {
    if (!movementAmount || parseFloat(movementAmount) <= 0) {
      toast({
        title: "Erro",
        description: "Valor é obrigatório e deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const amount = parseFloat(movementAmount);
      const finalAmount = movementType === 'add' ? amount : -amount;
      
      await addCashRegisterLog(
        movementType,
        amount,
        cashRegister.store_id,
        user?.id,
        notes
      );
      
      setMovementDialog(false);
      setMovementAmount('');
      setMovementType('add');
      setNotes('');
      
      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso!",
      });
      
      // Recarregar estado e logs
      loadCashRegisterState();
      loadLogs();
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

  // Formatar data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Formatar valor
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!canManageCashRegister) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o controle de caixa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="w-8 h-8" />
          Controle de Caixa
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {cashRegister.store?.name || 'Loja Online'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (confirm('Tem certeza que deseja resetar o caixa? Isso apagará todo o histórico.')) {
                try {
                  const response = await fetch(`http://31.97.86.88:4000/api/cash-register/reset/${cashRegister.store_id}`, {
                    method: 'DELETE',
                  });
                  if (response.ok) {
                    toast({
                      title: "Sucesso",
                      description: "Caixa resetado com sucesso!",
                    });
                    loadCashRegisterState();
                    loadLogs();
                  }
                } catch (error) {
                  toast({
                    title: "Erro",
                    description: "Erro ao resetar caixa",
                    variant: "destructive",
                  });
                }
              }
            }}
          >
            Resetar Caixa
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {/* Status do Caixa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {cashRegister.isOpen ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                Status do Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`text-lg font-bold ${cashRegister.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                    {cashRegister.isOpen ? 'ABERTO' : 'FECHADO'}
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Valor Atual</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(cashRegister.currentAmount)}
                  </p>
                </div>
              </div>

              {cashRegister.isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Inicial</p>
                    <p className="font-bold">{formatCurrency(cashRegister.openingAmount)}</p>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Aberto por</p>
                    <p className="font-bold">{cashRegister.openedBy || 'N/A'}</p>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Aberto em</p>
                    <p className="font-bold">{cashRegister.openedAt ? formatDate(cashRegister.openedAt) : 'N/A'}</p>
                  </div>
                </div>
              )}

              {!cashRegister.isOpen && cashRegister.closedAt && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Fechado em</p>
                    <p className="font-bold">{formatDate(cashRegister.closedAt)}</p>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Final</p>
                    <p className="font-bold">{formatCurrency(cashRegister.currentAmount)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          {/* Operações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Abrir Caixa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Unlock className="w-5 h-5" />
                  Abrir Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
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
              </CardContent>
            </Card>

            {/* Fechar Caixa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Fechar Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="w-full" 
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
                        <Label htmlFor="closeNotes">Observações (opcional)</Label>
                        <Input
                          id="closeNotes"
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
              </CardContent>
            </Card>

            {/* Movimentações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={movementDialog} onOpenChange={setMovementDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="w-full" 
                      disabled={!cashRegister.isOpen || isLoading}
                    >
                      Adicionar/Remover
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Movimentação de Caixa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tipo de Operação</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant={movementType === 'add' ? 'default' : 'outline'}
                            onClick={() => setMovementType('add')}
                            className="flex-1"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                          </Button>
                          <Button
                            variant={movementType === 'remove' ? 'default' : 'outline'}
                            onClick={() => setMovementType('remove')}
                            className="flex-1"
                          >
                            <Minus className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="movementAmount">Valor (R$)</Label>
                        <Input
                          id="movementAmount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={movementAmount}
                          onChange={(e) => setMovementAmount(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="movementNotes">Observações (opcional)</Label>
                        <Input
                          id="movementNotes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Motivo da movimentação..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setMovementDialog(false)}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAddMovement}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Registrando...' : 'Registrar Movimentação'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Operações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.type === 'open' && <Unlock className="w-5 h-5 text-green-500" />}
                      {log.type === 'close' && <Lock className="w-5 h-5 text-red-500" />}
                      {log.type === 'add' && <Plus className="w-5 h-5 text-blue-500" />}
                      {log.type === 'remove' && <Minus className="w-5 h-5 text-orange-500" />}
                      
                      <div>
                        <p className="font-medium">
                          {log.type === 'open' && 'Abertura de Caixa'}
                          {log.type === 'close' && 'Fechamento de Caixa'}
                          {log.type === 'add' && 'Adição de Dinheiro'}
                          {log.type === 'remove' && 'Remoção de Dinheiro'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {log.notes}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(log.current_amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {logs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma operação registrada.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashRegister; 