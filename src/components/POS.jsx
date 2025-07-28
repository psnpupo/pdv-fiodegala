import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  addCashRegisterLog, 
  getProductStoreStock // Para verificar estoque da loja física no carrinho
} from '@/lib/storage';
import { getCurrentCashRegisterState } from '@/lib/cashRegisterStorage';
import { createSale, getProductByBarcode as fetchProductByBarcodeForPOS } from '@/lib/salesApi'; 
import { getCurrentUser, hasPermission, PERMISSIONS, getUsers } from '@/lib/auth';
import peripheralsService from '@/lib/peripheralsService';
import fiscalService from '@/lib/fiscalService';

import BarcodeScanner from '@/components/pos/BarcodeScanner';
import CartDisplay from '@/components/pos/CartDisplay';
import PosTotals from '@/components/pos/PosTotals';
import PaymentSection, { PAYMENT_METHODS, PAYMENT_LABELS } from '@/components/pos/PaymentSection';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const SALE_MODALITIES = [
  { value: 'varejo', label: 'Varejo' },
  { value: 'atacado', label: 'Atacado' },
  { value: 'atacarejo', label: 'Atacarejo' },
];

const PARCELAS = Array.from({ length: 10 }, (_, i) => i + 1);

const POS = () => {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
  const [payments, setPayments] = useState([]);
  const [cashRegister, setCashRegister] = useState({ isOpen: false, currentAmount: 0, openingAmount: 0, id: null, store_id: null });
  const [selectedStore, setSelectedStore] = useState(null);
  const { toast } = useToast();
  const user = getCurrentUser();
  const isUserPhysicalStore = !!user?.store_id && !hasPermission(user.role, PERMISSIONS.VIEW_ALL_STORES_DATA);

  // Wizard state
  const [step, setStep] = useState(0); // 0: modalidade, 1: vendedor, 2: carrinho, 3: pagamento, 4: resumo
  const [modalidade, setModalidade] = useState('');
  // Etapa vendedor
  const [vendedor, setVendedor] = useState(null);
  const [vendedores, setVendedores] = useState([]);
  const [loadingVendedores, setLoadingVendedores] = useState(false);

  // Etapa pagamento
  const [numPagamentos, setNumPagamentos] = useState(1);
  const [pagamentosWizard, setPagamentosWizard] = useState([
    { method: '', amount: '', parcelas: 1 },
    { method: '', amount: '', parcelas: 1 },
  ]);

  // Etapa troca
  const [isTroca, setIsTroca] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  // Wizard Step 4: Resumo e Finalização
  const renderStepResumo = () => (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Resumo da Venda</h2>
      <div className="border rounded-lg p-4 bg-card">
        <div className="mb-2"><b>Modalidade:</b> {SALE_MODALITIES.find(m => m.value === modalidade)?.label}</div>
        <div className="mb-2"><b>Vendedor:</b> {vendedor?.name}</div>
        <div className="mb-2"><b>Tipo de venda:</b> {isTroca ? 'Troca' : 'Normal'}</div>
        <div className="mb-2"><b>Itens:</b>
          <ul className="ml-4 list-disc">
            {cart.map(item => (
              <li key={item.id}>{item.name} - {item.quantity} x R$ {item.price.toFixed(2)} = R$ {(item.price * item.quantity).toFixed(2)}</li>
            ))}
          </ul>
        </div>
        <div className="mb-2"><b>Total:</b> R$ {calculateTotal().toFixed(2)}</div>
        <div className="mb-2"><b>Pagamentos:</b>
          <ul className="ml-4 list-disc">
            {pagamentosWizard.slice(0, numPagamentos).map((p, i) => (
              <li key={i}>{PAYMENT_LABELS[p.method]} - R$ {parseFloat(p.amount).toFixed(2)}{p.method === 'credit' ? ` (${p.parcelas}x)` : ''}</li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" id="troca" checked={isTroca} onChange={e => setIsTroca(e.target.checked)} />
          <label htmlFor="troca" className="text-sm">Esta venda é uma <b>troca</b></label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          onClick={async () => {
            setFinalizando(true);
            try {
              // Montar dados para o backend
              const saleData = {
                items: cart.map(ci => ({
                  productId: ci.productId,
                  name: ci.name,
                  price: ci.price,
                  barcode: ci.barcode,
                  quantity: ci.quantity,
                  subtotal: ci.subtotal
                })),
                subtotal: calculateSubtotal(),
                discount: calculateDiscountAmount(),
                total: calculateTotal(),
                payments: pagamentosWizard.slice(0, numPagamentos).map(p => ({
                  method: p.method,
                  amount: parseFloat(p.amount),
                  parcelas: p.method === 'credit' ? p.parcelas : undefined
                })),
                cashier: user?.name,
                cashierId: user?.id,
                store_id: selectedStore?.id || user?.store_id || null,
                modalidade,
                vendedor_id: vendedor?.id,
                tipo_venda: isTroca ? 'troca' : 'normal',
              };
              
              const result = await createSale(saleData);
              
              // Tentar imprimir recibo automaticamente
              try {
                const printerConfig = await peripheralsService.getConfig();
                if (printerConfig.printer.enabled) {
                  const saleDataForPrint = {
                    ...result.sale,
                    items: saleData.items,
                    payments: saleData.payments,
                    store_name: selectedStore?.name || 'Loja',
                    user_id: user?.id,
                    store_id: selectedStore?.id || user?.store_id
                  };
                  
                  await peripheralsService.printReceipt(saleDataForPrint, printerConfig.printer);
                  
                  toast({ 
                    title: 'Venda finalizada e recibo impresso!', 
                    description: `Venda #${result.sale.id} criada e recibo impresso automaticamente.`, 
                    variant: 'default' 
                  });
                } else {
                  toast({ 
                    title: 'Venda finalizada com sucesso!', 
                    description: `Venda #${result.sale.id} criada.`, 
                    variant: 'default' 
                  });
                }
              } catch (printError) {
                console.error('Erro ao imprimir recibo:', printError);
                toast({ 
                  title: 'Venda finalizada com sucesso!', 
                  description: `Venda #${result.sale.id} criada. (Erro na impressão: ${printError.message})`, 
                  variant: 'default' 
                });
              }

              // Tentar gerar documento fiscal automaticamente
              try {
                const fiscalConfig = await fiscalService.getConfig();
                if (fiscalConfig.nfe.enabled || fiscalConfig.sat.enabled) {
                  const saleDataForFiscal = {
                    ...result.sale,
                    items: saleData.items,
                    payments: saleData.payments,
                    store_name: selectedStore?.name || 'Loja',
                    user_id: user?.id,
                    store_id: selectedStore?.id || user?.store_id
                  };
                  
                  const fiscalResult = await fiscalService.generateFiscalDocument(saleDataForFiscal);
                  
                  toast({ 
                    title: 'Documento fiscal gerado!', 
                    description: `Documento fiscal gerado automaticamente para venda #${result.sale.id}.`, 
                    variant: 'default' 
                  });
                }
              } catch (fiscalError) {
                console.error('Erro ao gerar documento fiscal:', fiscalError);
                // Não mostrar erro para o usuário, apenas log
              }
              
              // Limpar carrinho e resetar wizard
              clearCart();
              setIsTroca(false);
              setStep(0);
              setVendedor(null);
              setPagamentosWizard([{ method: '', amount: '', parcelas: 1 }, { method: '', amount: '', parcelas: 1 }]);
              setNumPagamentos(1);
              
            } catch (err) {
              toast({ 
                title: 'Erro ao finalizar venda', 
                description: err.message || 'Tente novamente.', 
                variant: 'destructive' 
              });
            } finally {
              setFinalizando(false);
            }
          }}
          disabled={finalizando}
        >
          {finalizando ? 'Finalizando...' : 'Finalizar Venda'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStep(3)}
          disabled={finalizando}
        >
          Voltar
        </Button>
      </div>
    </div>
  );

  // Buscar vendedores ao entrar na etapa 1
  useEffect(() => {
    if (step === 1 && vendedores.length === 0) {
      setLoadingVendedores(true);
      getUsers().then(users => {
        const filtrados = users.filter(u => ['manager', 'cashier', 'admin'].includes(u.role));
        setVendedores(filtrados);
      }).finally(() => setLoadingVendedores(false));
    }
  }, [step, vendedores.length]);

  const fetchCashRegisterData = useCallback(async () => {
    // getCurrentCashRegisterState já é filtrado por loja se o usuário for de loja física
    // Se for admin/online, ele precisa selecionar a loja para abrir/ver o caixa.
    // Por simplicidade, se for admin, e não houver caixa específico, ele pode ver o último caixa aberto.
    const state = await getCurrentCashRegisterState(); 
    setCashRegister(state);
    
    // Definir loja selecionada baseada no usuário
    if (isUserPhysicalStore && user?.store_id) {
      setSelectedStore({ id: user.store_id, name: user.store_name || 'Loja Física' });
    } else {
      // Para admin/online, usar loja online por padrão
      setSelectedStore({ id: null, name: 'Loja Online' });
    }
  }, [isUserPhysicalStore, user?.store_id, user?.store_name]);

  useEffect(() => {
    fetchCashRegisterData();
  }, [fetchCashRegisterData]);

  // Wizard Step 2: Carrinho
  const renderStepCarrinho = () => (
    <div className="space-y-6">
      <BarcodeScanner onProductFound={handleProductFound} getProductByBarcode={fetchProductByBarcodeForPOS} />
      <CartDisplay 
        cart={cart} 
        onUpdateQuantity={updateQuantity} 
        onRemoveFromCart={removeFromCart} 
        onClearCart={clearCart}
      />
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => cart.length > 0 && setStep(3)}
          disabled={cart.length === 0}
        >
          Avançar
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStep(1)}
        >
          Voltar
        </Button>
      </div>
    </div>
  );

  // Adaptar handleProductFound para usar preço conforme modalidade
  const getPrecoPorModalidade = (produto) => {
    if (modalidade === 'varejo' && produto.price_varejo != null) return produto.price_varejo;
    if (modalidade === 'atacado' && produto.price_atacado != null) return produto.price_atacado;
    if (modalidade === 'atacarejo' && produto.price_atacarejo != null) return produto.price_atacarejo;
    return produto.price; // fallback
  };

  const handleProductFound = async (productFromScanner) => {
    // productFromScanner.stock já reflete:
    // - product_store_stock se o usuário é de loja física
    // - online_stock se o usuário é admin/online
    
    // Se usuário de loja física, e produto não tem estoque na sua loja (productFromScanner.stock é 0 ou undefined E is_physical_store_stock é true)
    if (isUserPhysicalStore && productFromScanner.is_physical_store_stock && (!productFromScanner.stock || productFromScanner.stock <= 0) ) {
        toast({
            title: "Sem estoque na sua loja",
            description: `O produto ${productFromScanner.name} não tem estoque disponível na sua loja.`,
            variant: "warning",
        });
        return;
    }
    
    // Se for venda online e o online_stock for zero ou menos
    if (!isUserPhysicalStore && (!productFromScanner.stock || productFromScanner.stock <= 0)) {
        toast({
            title: "Sem estoque online",
            description: `O produto ${productFromScanner.name} não tem estoque online disponível.`,
            variant: "warning",
        });
        return;
    }

    const preco = getPrecoPorModalidade(productFromScanner);
    const existingCartItem = cart.find(item => item.productId === productFromScanner.id);
    if (existingCartItem) {
      updateQuantity(existingCartItem.id, existingCartItem.quantity + 1, productFromScanner.stock);
    } else {
      const cartItem = {
        id: `${productFromScanner.id}-${Date.now()}`,
        productId: productFromScanner.id,
        name: productFromScanner.name,
        price: preco,
        barcode: productFromScanner.barcode,
        quantity: 1,
        size: productFromScanner.sizes?.[0] || null, 
        color: productFromScanner.colors?.[0] || null,
        subtotal: preco,
        // store_id do produto principal (online) ou da loja física se a venda for de lá
        // product_store_id é o ID da loja física da qual o estoque está sendo considerado.
        product_main_store_id: productFromScanner.store_id, // Loja "dona" do cadastro do produto
        max_available_stock: productFromScanner.stock // Estoque disponível (online ou da loja física)
      };
      setCart(prev => [...prev, cartItem]);
    }
    toast({
      title: "Produto adicionado",
      description: `${productFromScanner.name} adicionado ao carrinho. Estoque disponível: ${productFromScanner.stock}`,
    });
  };

  const updateQuantity = (itemId, newQuantity, maxStock) => {
    const itemToUpdate = cart.find(item => item.id === itemId);
    if (!itemToUpdate) return;

    const currentMaxStock = maxStock !== undefined ? maxStock : itemToUpdate.max_available_stock;

    if (newQuantity > currentMaxStock) {
        toast({
            title: "Quantidade excede estoque",
            description: `Máximo de ${currentMaxStock} unidades disponíveis.`,
            variant: "warning",
        });
        newQuantity = currentMaxStock;
    }

    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setPayments([]);
    setDiscount({ type: 'percentage', value: 0 });
  };

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0);
  
  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (discount.type === 'percentage') return (subtotal * discount.value) / 100;
    return Math.min(discount.value, subtotal);
  };

  const calculateTotal = () => calculateSubtotal() - calculateDiscountAmount();
  
  const handleApplyDiscount = () => {
    if (!hasPermission(user?.role, PERMISSIONS.APPLY_DISCOUNTS)) {
      toast({ title: "Sem permissão", description: "Você não tem permissão para aplicar descontos", variant: "destructive" });
      return;
    }
    const discountValueStr = prompt("Digite a porcentagem de desconto (ex: 10 para 10%):");
    const discountValue = parseFloat(discountValueStr);

    if (!isNaN(discountValue) && discountValue >= 0 && discountValue <= 100) {
      setDiscount({ type: 'percentage', value: discountValue });
      toast({ title: "Desconto aplicado", description: `${discountValue}% de desconto.`});
    } else if (discountValueStr !== null) {
      toast({ title: "Valor inválido", description: "Por favor, insira um valor entre 0 e 100.", variant: "destructive"});
    }
  };

  const addPayment = (method, amount) => {
    setPayments(prev => [...prev, { method, amount: parseFloat(amount.toFixed(2)), id: Date.now() }]);
  };

  const handlePrintReceipt = async () => {
    try {
      const printerConfig = await peripheralsService.getConfig();
      if (!printerConfig.printer.enabled) {
        toast({ 
          title: 'Impressora desabilitada', 
          description: 'Configure a impressora nas configurações de periféricos.', 
          variant: 'destructive' 
        });
        return;
      }

      const saleDataForPrint = {
        id: `PREVIEW_${Date.now()}`,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        })),
        subtotal: calculateSubtotal(),
        discount: calculateDiscountAmount(),
        total: calculateTotal(),
        payments: payments.map(p => ({
          method: PAYMENT_LABELS[p.method],
          amount: p.amount
        })),
        store_name: selectedStore?.name || 'Loja',
        user_id: user?.id,
        store_id: selectedStore?.id || user?.store_id
      };
      
      await peripheralsService.printReceipt(saleDataForPrint, printerConfig.printer);
      
      toast({ 
        title: 'Recibo impresso!', 
        description: 'Recibo enviado para impressão com sucesso.', 
        variant: 'default' 
      });
    } catch (error) {
      console.error('Erro ao imprimir recibo:', error);
      toast({ 
        title: 'Erro ao imprimir recibo', 
        description: error.message || 'Verifique a configuração da impressora.', 
        variant: 'destructive' 
      });
    }
  };

  const getTotalPaid = () => payments.reduce((sum, payment) => sum + payment.amount, 0);
  const getRemainingAmount = () => calculateTotal() - getTotalPaid();
  const canFinalizeSale = () => cart.length > 0 && getRemainingAmount() <= 0.001;
  const canPrintReceipt = () => cart.length > 0;

  const handlePagamentoChange = (idx, field, value) => {
    setPagamentosWizard(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // Wizard Step 3: Pagamento
  const renderStepPagamento = () => (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-bold mb-4">Formas de Pagamento</h2>
      <div className="flex gap-4 mb-2">
        <Button variant={numPagamentos === 1 ? 'default' : 'outline'} onClick={() => setNumPagamentos(1)}>1 Forma</Button>
        <Button variant={numPagamentos === 2 ? 'default' : 'outline'} onClick={() => setNumPagamentos(2)}>2 Formas</Button>
      </div>
      {[...Array(numPagamentos)].map((_, idx) => (
        <div key={idx} className="border rounded-lg p-4 mb-2 bg-card">
          <div className="mb-2 font-medium">Pagamento {idx + 1}</div>
          <div className="flex gap-2 items-center mb-2">
            <Select value={pagamentosWizard[idx].method} onValueChange={v => handlePagamentoChange(idx, 'method', v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Forma de Pagamento" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_LABELS).map(([method, label]) => (
                  <SelectItem key={method} value={method}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor"
              className="w-32"
              value={pagamentosWizard[idx].amount}
              onChange={e => handlePagamentoChange(idx, 'amount', e.target.value)}
            />
            {pagamentosWizard[idx].method === 'credit' && (
              <Select value={pagamentosWizard[idx].parcelas?.toString() || '1'} onValueChange={v => handlePagamentoChange(idx, 'parcelas', parseInt(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Parcelas" />
                </SelectTrigger>
                <SelectContent>
                  {PARCELAS.map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      ))}
      <div className="mb-2">
        <span className="font-medium">Total da venda:</span> R$ {calculateTotal().toFixed(2)}<br />
        <span className="font-medium">Total informado:</span> R$ {getTotalPaid().toFixed(2)}
      </div>
      {!canFinalizeSale && (
        <div className="text-destructive text-sm mb-2">Preencha todas as formas de pagamento corretamente e o valor total deve bater com o total da venda.</div>
      )}
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => canFinalizeSale && setStep(4)}
          disabled={!canFinalizeSale}
        >
          Avançar
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStep(2)}
        >
          Voltar
        </Button>
      </div>
    </div>
  );

  // Wizard Step 0: Modalidade
  const renderStepModalidade = () => (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4">Selecione a modalidade da venda</h2>
      <div className="flex gap-4 mb-4">
        {SALE_MODALITIES.map((mod) => (
          <Button
            key={mod.value}
            variant={modalidade === mod.value ? 'default' : 'outline'}
            onClick={() => setModalidade(mod.value)}
            className="min-w-[120px]"
          >
            {mod.label}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => modalidade && setStep(1)}
        disabled={!modalidade}
        className="mt-2"
      >
        Avançar
      </Button>
    </div>
  );

  // Wizard Step 1: Vendedor
  const renderStepVendedor = () => (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4">Selecione o vendedor responsável</h2>
      {loadingVendedores ? (
        <div>Carregando vendedores...</div>
      ) : (
        <div className="flex flex-col gap-2 mb-4 max-w-md">
          {vendedores.map((vend) => (
            <Button
              key={vend.id}
              variant={vendedor?.id === vend.id ? 'default' : 'outline'}
              onClick={() => setVendedor(vend)}
              className="justify-start"
            >
              {vend.name} <span className="ml-2 text-xs text-muted-foreground">({vend.role})</span>
            </Button>
          ))}
        </div>
      )}
      <Button
        onClick={() => vendedor && setStep(2)}
        disabled={!vendedor}
        className="mt-2"
      >
        Avançar
      </Button>
      <Button
        variant="ghost"
        className="mt-2 ml-2"
        onClick={() => setStep(0)}
      >
        Voltar
      </Button>
    </div>
  );

  const totalVenda = calculateTotal();
  const somaPagamentos = pagamentosWizard.slice(0, numPagamentos).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pagamentosValidos = pagamentosWizard.slice(0, numPagamentos).every(p => p.method && p.amount && (!isNaN(parseFloat(p.amount))) && (p.method !== 'credit' || p.parcelas));
  const podeAvancarPagamento = pagamentosValidos && Math.abs(somaPagamentos - totalVenda) < 0.01;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 space-y-6">
        {step === 0 && renderStepModalidade()}
        {step === 1 && renderStepVendedor()}
        {step === 2 && renderStepCarrinho()}
        {step === 3 && renderStepPagamento()}
        {step === 4 && renderStepResumo()}
      </div>

      <div className="space-y-6">
        <PosTotals 
          subtotal={calculateSubtotal()} 
          discountAmount={calculateDiscountAmount()} 
          total={calculateTotal()} 
          onApplyDiscount={handleApplyDiscount}
        />
        <PaymentSection 
          cartLength={cart.length}
          payments={payments}
          totalPaid={getTotalPaid()}
          remainingAmount={getRemainingAmount()}
          onAddPayment={addPayment}
          onFinalizeSale={() => setStep(3)}
          canFinalize={canFinalizeSale()}
          onPrintReceipt={handlePrintReceipt}
          canPrintReceipt={canPrintReceipt()}
        />
        {/* Controle de caixa movido para página exclusiva */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Status do Caixa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`font-bold ${cashRegister.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                {cashRegister.isOpen ? 'ABERTO' : 'FECHADO'}
              </p>
              {cashRegister.isOpen && (
                <p className="text-lg font-bold">
                  R$ {cashRegister.currentAmount.toFixed(2)}
                </p>
              )}
            </div>
            
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/cash-register'}
                className="w-full"
              >
                Gerenciar Caixa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POS;