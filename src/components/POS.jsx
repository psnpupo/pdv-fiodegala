import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  addCashRegisterLog, 
  getProductStoreStock // Para verificar estoque da loja física no carrinho
} from '@/lib/storage';
import { getCurrentCashRegisterState } from '@/lib/cashRegisterStorage';
import { createSale, getProductByBarcode as fetchProductByBarcodeForPOS } from '@/lib/salesApi'; 
import { getCurrentUser, hasPermission, PERMISSIONS, getUsers } from '@/lib/auth';
import { getCustomers } from '@/lib/customersStorage';
import peripheralsService from '@/lib/peripheralsService';
import fiscalService from '@/lib/fiscalService';
import interestRatesService from '@/lib/interestRatesService';
import CustomerForm from '@/components/pos/CustomerForm';

import BarcodeScanner from '@/components/pos/BarcodeScanner';
import CartDisplay from '@/components/pos/CartDisplay';
import PosTotals from '@/components/pos/PosTotals';
import { PAYMENT_METHODS, PAYMENT_LABELS } from '@/components/pos/PaymentSection';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Plus } from 'lucide-react';

// Importar ícones de pagamento
import pixIcon from '/images/pixicon.png';
import debitIcon from '/images/debito card.png';
import creditIcon from '/images/crediticon.png';
import dinheiroIcon from '/images/dinheiroicon.png';

const SALE_MODALITIES = [
  { value: 'varejo', label: 'Varejo' },
  { value: 'atacado', label: 'Atacado' },
  { value: 'cliente_exclusivo', label: 'Cliente Exclusivo' },
];

const PARCELAS = Array.from({ length: 10 }, (_, i) => i + 1);

// Funções utilitárias para formatação de moeda
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = parseCurrency(value);
  if (isNaN(numericValue)) return '';
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const parseCurrency = (value) => {
  if (!value) return 0;
  
  // Remove todos os caracteres exceto dígitos, vírgulas e pontos
  let cleanValue = value.toString().replace(/[^\d,.]/g, '');
  
  // Se tem vírgula e ponto, assume que vírgula é separador de milhares
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    cleanValue = cleanValue.replace(',', '');
  }
  // Se só tem vírgula, assume que é separador decimal
  else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
    cleanValue = cleanValue.replace(',', '.');
  }
  
  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? 0 : numericValue;
};

const formatCurrencyInput = (value) => {
  if (!value) return '';
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return '';
  return numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Nova função para formatar valores monetários com separadores de milhares
const formatMoney = (value) => {
  if (!value && value !== 0) return 'R$ 0,00';
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return 'R$ 0,00';
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const POS = () => {
  // Funções para persistir estado da venda
  const saveSaleState = (saleData) => {
    try {
      localStorage.setItem('pos_sale_state', JSON.stringify(saleData));
    } catch (error) {
      console.error('Erro ao salvar estado da venda:', error);
    }
  };

  const loadSaleState = () => {
    try {
      const saved = localStorage.getItem('pos_sale_state');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Erro ao carregar estado da venda:', error);
      return null;
    }
  };

  const clearSaleState = () => {
    try {
      localStorage.removeItem('pos_sale_state');
    } catch (error) {
      console.error('Erro ao limpar estado da venda:', error);
    }
  };

  // Carregar estado salvo ao inicializar
  const savedState = loadSaleState();
  
  const [cart, setCart] = useState(savedState?.cart || []);
  const [discount, setDiscount] = useState(savedState?.discount || { type: 'percentage', value: 0 });
  const [payments, setPayments] = useState(savedState?.payments || []);
  const [cashRegister, setCashRegister] = useState({ isOpen: false, currentAmount: 0, openingAmount: 0, id: null, store_id: null });
  const [selectedStore, setSelectedStore] = useState(null);
  const { toast } = useToast();
  const user = getCurrentUser();
  const isUserPhysicalStore = !!user?.store_id && !hasPermission(user.role, PERMISSIONS.VIEW_ALL_STORES_DATA);

  // Wizard state
  const [step, setStep] = useState(savedState?.step || 0); // 0: modalidade, 1: vendedor, 2: cliente, 3: carrinho, 4: pagamento, 5: resumo
  const [modalidade, setModalidade] = useState(savedState?.modalidade || '');
  // Etapa vendedor
  const [vendedor, setVendedor] = useState(savedState?.vendedor || null);
  const [vendedores, setVendedores] = useState([]);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  // Etapa cliente
  const [cliente, setCliente] = useState(savedState?.cliente || null);
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAllClients, setShowAllClients] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Componente reutilizável para mostrar cliente selecionado
  const ClienteSelecionado = () => {
    if (!cliente) return null;
    
    return (
      <div className="p-3 bg-green-600 rounded-lg text-white">
        <div className="font-medium text-green-100 mb-1">✓ Cliente selecionado</div>
        <div className="text-sm text-green-100">
          <strong className="text-white">{cliente.name}</strong> - {cliente.category || 'Cliente'}
          {cliente.cpf && <span> - CPF: {cliente.cpf}</span>}
          {cliente.cnpj && <span> - CNPJ: {cliente.cnpj}</span>}
          {cliente.phone && <span> - Tel: {cliente.phone}</span>}
        </div>
      </div>
    );
  };

  // Etapa pagamento
  const [numPagamentos, setNumPagamentos] = useState(savedState?.numPagamentos || 1);
  const [pagamentosWizard, setPagamentosWizard] = useState(savedState?.pagamentosWizard || [
    { method: '', amount: '', parcelas: undefined },
    { method: '', amount: '', parcelas: undefined },
  ]);
  
  // Etapa troca
  const [isTroca, setIsTroca] = useState(savedState?.isTroca || false);
  const [finalizando, setFinalizando] = useState(false);
  const [stateRestored, setStateRestored] = useState(!!savedState);
  
  // Configuração de juros para cartão de crédito
  const [creditCardInterest, setCreditCardInterest] = useState(2.99); // Juros padrão 2.99% ao mês
  
  // Carregar configuração de juros salva
  useEffect(() => {
    loadInterestRate();
  }, []);

  const loadInterestRate = async () => {
    try {
      const data = await interestRatesService.getInterestRate();
      setCreditCardInterest(data.credit_card_interest);
    } catch (error) {
      console.error('Erro ao carregar taxa de juros:', error);
      // Manter valor padrão se houver erro
    }
  };

  // Salvar estado automaticamente quando houver mudanças
  useEffect(() => {
    const saleState = {
      cart,
      discount,
      payments,
      step,
      modalidade,
      vendedor,
      cliente,
      numPagamentos,
      pagamentosWizard,
      isTroca
    };
    saveSaleState(saleState);
  }, [cart, discount, payments, step, modalidade, vendedor, cliente, numPagamentos, pagamentosWizard, isTroca]);

  // Recalcular valores dos pagamentos quando o desconto mudar
  useEffect(() => {
    if (pagamentosWizard.length > 0 && pagamentosWizard[0]?.method) {
      const totalVenda = calculateTotal();
      const newPagamentos = [...pagamentosWizard];
      
      // Se tem apenas 1 forma de pagamento, atualizar o valor
      if (numPagamentos === 1) {
        if (newPagamentos[0]?.method === 'credit') {
          // Para cartão de crédito, manter as parcelas e recalcular o valor
          const parcelas = newPagamentos[0]?.parcelas || 1;
          newPagamentos[0] = {
            ...newPagamentos[0],
            amount: calculateCreditCardValue(totalVenda, parcelas).toFixed(2)
          };
        } else {
          // Para outros métodos, usar o valor total direto
          newPagamentos[0] = {
            ...newPagamentos[0],
            amount: totalVenda.toFixed(2)
          };
        }
      } else if (numPagamentos === 2 && newPagamentos[0]?.amount && newPagamentos[1]?.method) {
        // Se tem 2 formas, distribuir o desconto proporcionalmente
        const valorOriginalPrimeira = parseCurrency(newPagamentos[0].amount);
        const valorOriginalSegunda = parseCurrency(newPagamentos[1].amount);
        const totalOriginal = valorOriginalPrimeira + valorOriginalSegunda;
        
        // Calcular proporções
        const proporcaoPrimeira = valorOriginalPrimeira / totalOriginal;
        const proporcaoSegunda = valorOriginalSegunda / totalOriginal;
        
        // Aplicar desconto proporcionalmente
        const novoValorPrimeira = totalVenda * proporcaoPrimeira;
        const novoValorSegunda = totalVenda * proporcaoSegunda;
        
        // Atualizar primeira forma
        if (newPagamentos[0]?.method === 'credit') {
          const parcelas = newPagamentos[0]?.parcelas || 1;
          newPagamentos[0] = {
            ...newPagamentos[0],
            amount: calculateCreditCardValue(novoValorPrimeira, parcelas).toFixed(2)
          };
        } else {
          newPagamentos[0] = {
            ...newPagamentos[0],
            amount: novoValorPrimeira.toFixed(2)
          };
        }
        
        // Atualizar segunda forma
        if (newPagamentos[1]?.method === 'credit') {
          const parcelas = newPagamentos[1]?.parcelas || 1;
          newPagamentos[1] = {
            ...newPagamentos[1],
            amount: calculateCreditCardValue(novoValorSegunda, parcelas).toFixed(2)
          };
        } else {
          newPagamentos[1] = {
            ...newPagamentos[1],
            amount: novoValorSegunda.toFixed(2)
          };
        }
      }
      
      setPagamentosWizard(newPagamentos);
    }
  }, [discount]); // Executar apenas quando o desconto mudar

  // Esconder notificação de estado restaurado após 5 segundos
  useEffect(() => {
    if (stateRestored) {
      const timer = setTimeout(() => {
        setStateRestored(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [stateRestored]);

  // Notificação de estado restaurado
  const StateRestoredNotification = () => {
    if (!stateRestored) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm">✓ Venda restaurada automaticamente</span>
          <button 
            onClick={() => setStateRestored(false)}
            className="text-white hover:text-green-200"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Wizard Step 5: Resumo e Finalização
  const renderStepResumo = () => (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Resumo da Venda</h2>
      <div className="border rounded-lg p-4 bg-card">
        <div className="mb-2"><b>Modalidade:</b> {SALE_MODALITIES.find(m => m.value === modalidade)?.label}</div>
        <div className="mb-2"><b>Vendedor:</b> {vendedor?.name}</div>
        <div className="mb-2"><b>Cliente:</b> {cliente?.name}</div>
        <div className="mb-2"><b>Tipo de venda:</b> {isTroca ? 'Troca' : 'Normal'}</div>
        <div className="mb-2"><b>Itens:</b>
          <ul className="ml-4 list-disc">
            {cart.map(item => (
              <li key={item.id}>{item.name} - {item.quantity} x {formatMoney(item.price)} = {formatMoney(item.price * item.quantity)}</li>
            ))}
          </ul>
        </div>
        <div className="mb-2"><b>Total:</b> {formatMoney(calculateTotal())}</div>
        <div className="mb-2"><b>Pagamentos:</b>
          <ul className="ml-4 list-disc">
            {pagamentosWizard.slice(0, numPagamentos).map((p, i) => (
              <li key={i}>
                {PAYMENT_LABELS[p.method]} - {formatMoney(parseCurrency(p.amount))}
                {p.method === 'credit' && p.parcelas > 1 && (
                  <div className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                    • Valor original: {formatMoney(parseCurrency(p.amount))}
                    <br />
                    • Juros ({creditCardInterest}% ao mês): {formatMoney(calculateCreditCardValue(parseCurrency(p.amount), p.parcelas) - parseCurrency(p.amount))}
                    <br />
                    • Valor por parcela: {formatMoney(calculateCreditCardValue(parseCurrency(p.amount), p.parcelas) / p.parcelas)}
                    <br />
                    • {p.parcelas}x de {formatMoney(calculateCreditCardValue(parseCurrency(p.amount), p.parcelas) / p.parcelas)}
                  </div>
                )}
                {p.method === 'credit' && p.parcelas === 1 && ` (${p.parcelas}x)`}
              </li>
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
                  amount: parseCurrency(p.amount),
                  parcelas: p.method === 'credit' ? p.parcelas : undefined
                })),
                cashier: user?.name,
                cashierId: user?.id,
                customerId: cliente?.id,
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
              setPagamentosWizard([{ method: '', amount: '', parcelas: undefined }, { method: '', amount: '', parcelas: undefined }]);
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

  // Buscar clientes ao entrar na etapa 2
  useEffect(() => {
    if (step === 2 && clientes.length === 0) {
      setLoadingClientes(true);
      getCustomers().then(customers => {
        setClientes(customers || []);
      }).catch(error => {
        console.error('Erro ao carregar clientes:', error);
        setClientes([]);
      }).finally(() => setLoadingClientes(false));
    }
  }, [step, clientes.length]);

  // Função para atualizar lista de clientes quando um novo cliente for criado
  const handleCustomerCreated = (newCustomer) => {
    setClientes(prev => [...prev, newCustomer]);
    // Opcionalmente, selecionar automaticamente o novo cliente
    setCliente(newCustomer);
  };

  // Limpar filtros quando sair da etapa de cliente
  useEffect(() => {
    if (step !== 2) {
      setSearchTerm('');
      setFilterCategory('all');
      setShowAllClients(false);
      setCurrentPage(1);
    }
  }, [step]);

  // Resetar página quando mudar busca ou filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);



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

  // Wizard Step 3: Carrinho
  const renderStepCarrinho = () => (
    <div className="space-y-6">
      <ClienteSelecionado />
      
      <BarcodeScanner onProductFound={handleProductFound} getProductByBarcode={fetchProductByBarcodeForPOS} />
      <CartDisplay 
        cart={cart} 
        onUpdateQuantity={updateQuantity} 
        onRemoveFromCart={removeFromCart} 
        onClearCart={clearCart}
      />
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => cart.length > 0 && setStep(4)}
          disabled={cart.length === 0}
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

  // Adaptar handleProductFound para usar preço conforme modalidade
  const getPrecoPorModalidade = (produto) => {
    if (modalidade === 'varejo' && produto.price_varejo != null) return produto.price_varejo;
    if (modalidade === 'atacado' && produto.price_atacado != null) return produto.price_atacado;
    if (modalidade === 'cliente_exclusivo' && produto.price_atacarejo != null) return produto.price_atacarejo;
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
    // Limpar estado salvo quando limpar o carrinho
    clearSaleState();
  };

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0);
  
  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (discount.type === 'percentage') return (subtotal * discount.value) / 100;
    return Math.min(discount.value, subtotal);
  };

  const calculateTotal = () => calculateSubtotal() - calculateDiscountAmount();
  
  const handleApplyDiscount = (discountData) => {
    if (!hasPermission(user?.role, PERMISSIONS.APPLY_DISCOUNTS)) {
      toast({ title: "Sem permissão", description: "Você não tem permissão para aplicar descontos", variant: "destructive" });
      return;
    }

    if (discountData.type === 'none') {
      setDiscount({ type: 'none', value: 0 });
      toast({ title: "Desconto removido", description: "Desconto foi removido com sucesso." });
      return;
    }

    if (discountData.type === 'percentage') {
      setDiscount({ type: 'percentage', value: discountData.value });
      toast({ title: "Desconto aplicado", description: `${discountData.value}% de desconto.` });
    } else if (discountData.type === 'fixed') {
      setDiscount({ type: 'fixed', value: discountData.value });
      toast({ title: "Desconto aplicado", description: `R$ ${discountData.value.toFixed(2)} de desconto.` });
    }
  };

  const handleEncerrarVenda = () => {
    // Limpar todos os dados da venda
    setCart([]);
    setDiscount({ type: 'none', value: 0 });
    setPayments([]);
    setStep(0);
    setModalidade('');
    setVendedor(null);
    setCliente(null);
    setNumPagamentos(1);
    setPagamentosWizard([
      { method: '', amount: '', parcelas: undefined },
      { method: '', amount: '', parcelas: undefined }
    ]);
    setIsTroca(false);
    
    // Limpar estado salvo
    clearSaleState();
    
    toast({ 
      title: "Venda encerrada", 
      description: "Nova venda iniciada. Todos os dados foram limpos.", 
      variant: "default" 
    });
  };

  const addPayment = (method, amount) => {
            setPayments(prev => [...prev, { method, amount: parseCurrency(amount.toFixed(2)), id: Date.now() }]);
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

  const getTotalPaid = () => pagamentosWizard.reduce((sum, payment) => sum + (parseCurrency(payment.amount) || 0), 0);
  
  // Calcular valor com juros para cartão de crédito
  const calculateCreditCardValue = (baseValue, installments) => {
    if (installments <= 1) return baseValue;
    const monthlyInterest = creditCardInterest / 100;
    const totalInterest = Math.pow(1 + monthlyInterest, installments - 1) - 1;
    return baseValue * (1 + totalInterest);
  };

  const calculateOriginalValue = (valueWithInterest, installments) => {
    if (installments <= 1) return valueWithInterest;
    const monthlyInterest = creditCardInterest / 100;
    const totalInterest = Math.pow(1 + monthlyInterest, installments - 1) - 1;
    return valueWithInterest / (1 + totalInterest);
  };
  const getRemainingAmount = () => calculateTotal() - getTotalPaid();
  const canFinalizeSale = () => {
    if (cart.length === 0) return false;
    
    // Verificar se pelo menos uma forma de pagamento foi selecionada
    if (!pagamentosWizard[0]?.method) return false;
    
    // Com 1 forma, o valor é automático
    if (numPagamentos === 1) {
      return true;
    }
    
    // Com 2 formas, verificar se todos os valores estão preenchidos
    for (let i = 0; i < numPagamentos; i++) {
      if (!pagamentosWizard[i]?.amount || parseCurrency(pagamentosWizard[i].amount) <= 0) {
        return false;
      }
    }
    
    // Verificar se o total bate
    return Math.abs(getTotalPaid() - calculateTotal()) <= 0.01;
  };
  const canPrintReceipt = () => cart.length > 0;

  const handlePagamentoChange = (idx, field, value) => {
    console.log('handlePagamentoChange:', idx, field, value); // Debug
    setPagamentosWizard(prev => {
      const newState = prev.map((p, i) => i === idx ? { ...p, [field]: value } : p);
      console.log('Novo estado:', newState); // Debug
      return newState;
    });
  };

  // Wizard Step 4: Pagamento
  const renderStepPagamento = () => {
    const totalVenda = calculateTotal();

    // Ícones oficiais para cada forma de pagamento
    const paymentIcons = {
      cash: dinheiroIcon,
      credit: creditIcon,
      debit: debitIcon,
      pix: pixIcon,
      transfer: debitIcon, // Usando ícone de débito para transferência
      check: dinheiroIcon  // Usando ícone de dinheiro para cheque
    };

    return (
      <div className="space-y-6 max-w-2xl">
        <ClienteSelecionado />
        
        <h2 className="text-xl font-bold mb-4">Formas de Pagamento</h2>
        
        {/* Bloco com formas de pagamento */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(PAYMENT_LABELS).map(([method, label]) => (
              <div
                key={method}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                  pagamentosWizard[0]?.method === method
                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    : 'border-gray-400 hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
                onClick={() => {
                  const newPagamentos = [...pagamentosWizard];
                  newPagamentos[0] = { 
                    ...newPagamentos[0], 
                    method,
                    amount: numPagamentos === 1 ? totalVenda.toFixed(2) : newPagamentos[0].amount,
                    parcelas: method === 'credit' ? (newPagamentos[0].parcelas || 1) : undefined
                  };
                  setPagamentosWizard(newPagamentos);
                }}
              >
                <div className="mb-2">
                  <img 
                    src={paymentIcons[method]} 
                    alt={label}
                    className="w-12 h-12 mx-auto object-contain"
                  />
                </div>
                <div className="font-medium">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Botões para número de formas */}
          <div className="flex gap-4 mb-6">
            {numPagamentos === 1 ? (
              <Button 
                variant="outline"
                onClick={() => {
                  setNumPagamentos(2);
                  // Limpar valores para permitir preenchimento manual, mas preservar parcelas
                  if (pagamentosWizard[0]?.method) {
                    const newPagamentos = [...pagamentosWizard];
                    newPagamentos[0] = { 
                      ...newPagamentos[0], 
                      amount: '',
                      parcelas: newPagamentos[0].parcelas || 1 // Preservar parcelas existentes
                    };
                    newPagamentos[1] = { method: '', amount: '', parcelas: undefined };
                    setPagamentosWizard(newPagamentos);
                  }
                }}
                className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-400 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white"
              >
                2 Formas de Pagamento
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={() => {
                  setNumPagamentos(1);
                  // Voltar para 1 forma: usar o valor da primeira forma como total
                  if (pagamentosWizard[0]?.method) {
                    const newPagamentos = [...pagamentosWizard];
                    newPagamentos[0] = { 
                      ...newPagamentos[0], 
                      amount: totalVenda.toFixed(2),
                      parcelas: newPagamentos[0].parcelas || 1 // Preservar parcelas existentes
                    };
                    // Limpar a segunda forma
                    newPagamentos[1] = { method: '', amount: '', parcelas: undefined };
                    setPagamentosWizard(newPagamentos);
                  }
                }}
                className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-400 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white"
              >
                Voltar para 1 Forma
              </Button>
            )}
          </div>

          {/* Indicador de valor para 1 forma (exceto cartão de crédito) */}
          {pagamentosWizard[0]?.method && numPagamentos === 1 && pagamentosWizard[0]?.method !== 'credit' && (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <img 
                  src={paymentIcons[pagamentosWizard[0]?.method]} 
                  alt={PAYMENT_LABELS[pagamentosWizard[0]?.method]}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {PAYMENT_LABELS[pagamentosWizard[0]?.method]}
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatMoney(totalVenda)}
                </span>
              </div>
            </div>
          )}

          {/* Indicador especial para cartão de crédito com 1 forma */}
          {pagamentosWizard[0]?.method === 'credit' && numPagamentos === 1 && (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={paymentIcons[pagamentosWizard[0]?.method]} 
                  alt={PAYMENT_LABELS[pagamentosWizard[0]?.method]}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {PAYMENT_LABELS[pagamentosWizard[0]?.method]}
                </span>
              </div>
              
              <div className="flex gap-3 items-center mb-3">
                <Select 
                  value={(pagamentosWizard[0]?.parcelas || 1).toString()} 
                  onValueChange={v => {
                    const parcelas = parseInt(v);
                    console.log('Mudando parcelas para:', parcelas); // Debug
                    
                    // Atualizar parcelas
                    const newPagamentos = [...pagamentosWizard];
                    newPagamentos[0] = { 
                      ...newPagamentos[0], 
                      parcelas: parcelas,
                      amount: calculateCreditCardValue(totalVenda, parcelas).toFixed(2)
                    };
                    setPagamentosWizard(newPagamentos);
                  }}
                >
                  <SelectTrigger className="w-32 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600">
                    <SelectValue placeholder="Parcelas" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    {PARCELAS.map(n => (
                      <SelectItem key={n} value={n.toString()} className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Detalhamento do pagamento */}
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Valor original:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formatMoney(totalVenda)}</span>
                  </div>
                  
                  {(pagamentosWizard[0]?.parcelas || 1) > 1 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Juros ({creditCardInterest}% ao mês):</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {formatMoney(calculateCreditCardValue(totalVenda, pagamentosWizard[0]?.parcelas || 1) - totalVenda)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Valor por parcela:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {formatMoney(calculateCreditCardValue(totalVenda, pagamentosWizard[0]?.parcelas || 1) / (pagamentosWizard[0]?.parcelas || 1))}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-gray-800 dark:text-gray-200">Total a pagar:</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatMoney(calculateCreditCardValue(totalVenda, pagamentosWizard[0]?.parcelas || 1))}
                      </span>
                    </div>
                    {(pagamentosWizard[0]?.parcelas || 1) > 1 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        {(pagamentosWizard[0]?.parcelas || 1)}x de {formatMoney(calculateCreditCardValue(totalVenda, pagamentosWizard[0]?.parcelas || 1) / (pagamentosWizard[0]?.parcelas || 1))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campos de valores - só aparecem com 2 formas */}
          {numPagamentos === 2 && (
            <div className="space-y-4">
              {[...Array(numPagamentos)].map((_, idx) => (
                <div key={idx} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={paymentIcons[pagamentosWizard[idx]?.method]} 
                      alt={PAYMENT_LABELS[pagamentosWizard[idx]?.method]}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {PAYMENT_LABELS[pagamentosWizard[idx]?.method]} ({idx + 1})
                    </span>
                  </div>
                                    <div className="space-y-3">
                    {/* Campo de valor */}
                    <div className="flex gap-3 items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor:</span>
                      <Input
                        type="text"
                        placeholder="0,00"
                        className={`w-40 border-gray-300 text-gray-800 focus:ring-0 focus:border-gray-300 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                          numPagamentos === 2 && idx === 1 
                            ? 'bg-gray-100 cursor-not-allowed' 
                            : 'bg-white'
                        }`}
                        value={pagamentosWizard[idx]?.amount || ''}
                        disabled={numPagamentos === 2 && idx === 1}
                        onChange={e => {
                          // Só permitir digitação na primeira forma quando há 2 formas
                          if (numPagamentos === 2 && idx === 1) return;
                          
                          const valor = e.target.value;
                          console.log('Digitando valor:', valor, 'no índice:', idx, 'valor atual:', pagamentosWizard[idx]?.amount); // Debug
                          handlePagamentoChange(idx, 'amount', valor);
                        }}
                        onBlur={e => {
                          // Para 2 formas de pagamento: calcular automaticamente o valor da segunda forma
                          if (numPagamentos === 2 && idx === 0) {
                            const valorNumerico = parseCurrency(e.target.value) || 0;
                            const valorOutro = totalVenda - valorNumerico;
                            
                            if (valorOutro >= 0) {
                              const newPagamentos = [...pagamentosWizard];
                              newPagamentos[1] = { 
                                ...newPagamentos[1], 
                                amount: valorOutro.toFixed(2)
                              };
                              setPagamentosWizard(newPagamentos);
                            }
                          }
                        }}
                      />
                    </div>
                    
                    {/* Select de forma de pagamento - só aparece se tem valor */}
                    {pagamentosWizard[idx]?.amount && parseCurrency(pagamentosWizard[idx].amount) > 0 && (
                      <div className="flex gap-3 items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma:</span>
                        <Select 
                          value={pagamentosWizard[idx]?.method || ''} 
                          onValueChange={v => {
                            handlePagamentoChange(idx, 'method', v);
                            
                            // Se for cartão de crédito, inicializar parcelas
                            if (v === 'credit') {
                              const newPagamentos = [...pagamentosWizard];
                              newPagamentos[idx] = { 
                                ...newPagamentos[idx], 
                                method: v,
                                parcelas: 1
                              };
                              setPagamentosWizard(newPagamentos);
                            }
                          }}
                        >
                          <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-800 focus:ring-0 focus:border-gray-300 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                            <SelectValue placeholder="Escolher forma" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300">
                            {Object.entries(PAYMENT_LABELS).map(([method, label]) => (
                              <SelectItem key={method} value={method} className="text-gray-800 hover:bg-gray-100">
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Campo de parcelas só para cartão */}
                    {pagamentosWizard[idx]?.method === 'credit' && (
                      <div className="flex gap-3 items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Parcelas:</span>
                        <Select 
                          value={(pagamentosWizard[idx]?.parcelas || 1).toString()} 
                          onValueChange={v => {
                            const parcelas = parseInt(v);
                            console.log('Mudando parcelas para:', parcelas, 'no índice:', idx); // Debug
                            
                            const newPagamentos = [...pagamentosWizard];
                            newPagamentos[idx] = { 
                              ...newPagamentos[idx], 
                              parcelas: parcelas
                            };
                            
                            // Se for cartão de crédito, apenas atualizar as parcelas
                            // NÃO recalcular valores automaticamente - deixar o usuário definir manualmente
                            if (pagamentosWizard[idx]?.method === 'credit') {
                              // Manter o valor atual, apenas atualizar as parcelas
                              newPagamentos[idx].parcelas = parcelas;
                            }
                            
                            setPagamentosWizard(newPagamentos);
                          }}
                        >
                          <SelectTrigger className="w-32 bg-white border-gray-300 text-gray-800 focus:ring-0 focus:border-gray-300 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                            <SelectValue placeholder="Parcelas" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300">
                            {PARCELAS.map(n => (
                              <SelectItem key={n} value={n.toString()} className="text-gray-800 hover:bg-gray-100">
                                {n}x
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  {/* Detalhamento para cartão de crédito na segunda forma */}
                  {pagamentosWizard[idx]?.method === 'credit' && numPagamentos === 2 && (pagamentosWizard[idx]?.parcelas || 1) > 1 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-800 dark:text-blue-200">Valor original:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {formatMoney(parseCurrency(pagamentosWizard[idx]?.amount))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-800 dark:text-blue-200">Juros ({creditCardInterest}% ao mês):</span>
                          <span className="font-medium text-orange-600 dark:text-orange-400">
                            {formatMoney(calculateCreditCardValue(parseCurrency(pagamentosWizard[idx]?.amount), pagamentosWizard[idx]?.parcelas || 1) - parseCurrency(pagamentosWizard[idx]?.amount))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-800 dark:text-blue-200">Valor por parcela:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {formatMoney(calculateCreditCardValue(parseCurrency(pagamentosWizard[idx]?.amount), pagamentosWizard[idx]?.parcelas || 1) / (pagamentosWizard[idx]?.parcelas || 1))}
                          </span>
                        </div>
                                                  <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            {(pagamentosWizard[idx]?.parcelas || 1)}x de {formatMoney(calculateCreditCardValue(parseCurrency(pagamentosWizard[idx]?.amount), pagamentosWizard[idx]?.parcelas || 1) / (pagamentosWizard[idx]?.parcelas || 1))}
                          </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>



        {!canFinalizeSale && pagamentosWizard[0]?.method && (
          <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            ⚠️ Preencha todas as formas de pagamento corretamente e o valor total deve bater com o total da venda.
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => canFinalizeSale && setStep(5)}
            disabled={!canFinalizeSale}
          >
            Avançar
          </Button>
          <Button
            variant="ghost"
            onClick={() => setStep(3)}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  };

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

  // Wizard Step 2: Cliente
  const renderStepCliente = () => {
    // Garantir que filterCategory não seja undefined ou null
    const safeFilterCategory = filterCategory || 'all';
    
    // Filtrar clientes
    const filteredClientes = clientes.filter(cli => {
      const matchName = cli.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCpf = cli.cpf?.includes(searchTerm);
      const matchCnpj = cli.cnpj?.includes(searchTerm);
      const matchPhone = cli.phone?.includes(searchTerm);
      const matchCategory = safeFilterCategory !== 'all' ? cli.category === safeFilterCategory : true;
      
      return (matchName || matchCpf || matchCnpj || matchPhone) && matchCategory;
    });

    // Paginação
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayClientes = showAllClients ? filteredClientes : filteredClientes.slice(startIndex, endIndex);

    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Selecione o cliente</h2>
        
        {/* Barra de busca */}
        <div className="mb-4">
          <Input
            placeholder="Buscar por nome, CPF, CNPJ ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          {/* Filtro por categoria e botão de cadastrar */}
          <div className="flex gap-2 mb-2">
            <Select value={safeFilterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="Varejo">Varejo</SelectItem>
                <SelectItem value="Atacado">Atacado</SelectItem>
                <SelectItem value="Cliente Exclusivo">Cliente Exclusivo</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setShowAllClients(!showAllClients)}
            >
              {showAllClients ? 'Mostrar menos' : 'Mostrar todos'}
            </Button>

            <Button
              variant="default"
              onClick={() => setShowCustomerForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Cliente
            </Button>
          </div>
        </div>





        {/* Lista de clientes */}
        {loadingClientes ? (
          <div className="text-center py-8 text-muted-foreground">Carregando clientes...</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-700 rounded-lg p-2">
            {displayClientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado com essa busca.' : 'Nenhum cliente cadastrado.'}
              </div>
            ) : (
              displayClientes.map((cli) => (
                <div
                  key={cli.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    cliente?.id === cli.id 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200'
                  }`}
                  onClick={() => setCliente(cli)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className={`font-medium ${cliente?.id === cli.id ? 'text-white' : 'text-gray-200'}`}>
                        {cli.name}
                      </div>
                      <div className={`text-sm mt-1 ${
                        cliente?.id === cli.id ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          cli.category === 'Varejo' ? 'bg-green-600 text-green-100' :
                          cli.category === 'Atacado' ? 'bg-blue-600 text-blue-100' :
                          cli.category === 'Cliente Exclusivo' ? 'bg-purple-600 text-purple-100' :
                          'bg-gray-600 text-gray-100'
                        }`}>
                          {cli.category || 'Cliente'}
                        </span>
                        {cli.cpf && <span className="ml-2">• CPF: {cli.cpf}</span>}
                        {cli.cnpj && <span className="ml-2">• CNPJ: {cli.cnpj}</span>}
                        {cli.phone && <span className="ml-2">• Tel: {cli.phone}</span>}
                      </div>
                    </div>
                    {cliente?.id === cli.id && (
                      <div className="text-white text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        ✓ Selecionado
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Paginação */}
        {!loadingClientes && filteredClientes.length > itemsPerPage && !showAllClients && (
          <div className="flex justify-between items-center mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-sm text-gray-300 font-medium">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredClientes.length)} de {filteredClientes.length} clientes
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                ← Anterior
              </Button>
              <span className="px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg font-medium text-gray-200">
                {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Próxima →
              </Button>
            </div>
          </div>
        )}

        {/* Botões de navegação */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => cliente && setStep(3)}
            disabled={!cliente}
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
  };

  const totalVenda = calculateTotal();
  const somaPagamentos = pagamentosWizard.slice(0, numPagamentos).reduce((sum, p) => sum + (parseCurrency(p.amount) || 0), 0);
  const pagamentosValidos = pagamentosWizard.slice(0, numPagamentos).every(p => p.method && p.amount && (!isNaN(parseCurrency(p.amount))) && (p.method !== 'credit' || p.parcelas));
  const podeAvancarPagamento = pagamentosValidos && Math.abs(somaPagamentos - totalVenda) < 0.01;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <StateRestoredNotification />
      
      {/* Modal de cadastro de cliente */}
      <CustomerForm
        open={showCustomerForm}
        onOpenChange={setShowCustomerForm}
        onCustomerCreated={handleCustomerCreated}
      />
      
      <div className="lg:col-span-2 space-y-6">
        {step === 0 && renderStepModalidade()}
        {step === 1 && renderStepVendedor()}
        {step === 2 && renderStepCliente()}
        {step === 3 && renderStepCarrinho()}
        {step === 4 && renderStepPagamento()}
        {step === 5 && renderStepResumo()}
      </div>

      <div className="space-y-6">
        <PosTotals 
          subtotal={calculateSubtotal()} 
          discountAmount={calculateDiscountAmount()} 
          total={calculateTotal()} 
          onApplyDiscount={handleApplyDiscount}
          discount={discount}
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
                  {formatMoney(cashRegister.currentAmount)}
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

        {/* Botão Encerrar Venda */}
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              onClick={handleEncerrarVenda}
            >
              Encerrar Venda
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POS;