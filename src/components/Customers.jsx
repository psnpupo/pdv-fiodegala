import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  getCustomers, 
  addCustomer, 
  updateCustomer, 
  deleteCustomer, 
  getSales 
} from '@/lib/storage';
import { Users, Search, DollarSign, User as UserIcon } from 'lucide-react';
import CustomerList from '@/components/customers/CustomerList';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerHistoryDialog from '@/components/customers/CustomerHistoryDialog';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    group_id: '',
    cep: '',
    street: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: '',
    cnpj: '',
    razao_social: '',
    inscricao_estadual: '',
    nome_fantasia: ''
  });

  const fetchCustomersAndSales = useCallback(async () => {
    setLoading(true);
    try {
      const customersData = await getCustomers();
      const salesData = await getSales();
      setCustomers(customersData || []);
      setSales(salesData || []);
    } catch (error) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomersAndSales();
  }, [fetchCustomersAndSales]);

  // Contadores por categoria
  const totalVarejo = customers.filter(c => c.category === 'Varejo').length;
  const totalAtacado = customers.filter(c => c.category === 'Atacado').length;
  const totalClienteExclusivo = customers.filter(c => c.category === 'Cliente Exclusivo').length;

  // Filtros
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCpfCnpj, setFilterCpfCnpj] = useState('');

  const filteredCustomers = customers.filter(customer => {
    const matchName = customer.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory ? customer.category === filterCategory : true;
    const matchCpfCnpj = filterCpfCnpj ? (customer.cpf?.includes(filterCpfCnpj) || customer.cnpj?.includes(filterCpfCnpj)) : true;
    return matchName && matchCategory && matchCpfCnpj;
  });

  const resetForm = () => {
    setFormData({ 
      name: '', 
      cpf: '', 
      phone: '', 
      email: '', 
      address: '',
      category: '',
      group_id: '',
      cep: '',
      street: '',
      bairro: '',
      cidade: '',
      estado: '',
      complemento: '',
      cnpj: '',
      razao_social: '',
      inscricao_estadual: '',
      nome_fantasia: ''
    });
    setEditingCustomer(null);
  };

  const formatCPF = (cpf) => {
    if (!cpf) return '';
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length > 11) numbers.slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length > 11) numbers.slice(0, 11);
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const customerData = {
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ''),
      phone: formData.phone.replace(/\D/g, ''),
    };

    if (!customerData.name || !customerData.phone) {
      toast({ title: "Erro de Validação", description: "Nome e Telefone são obrigatórios.", variant: "destructive" });
      return;
    }
    if (customerData.cpf && customerData.cpf.length !== 11) {
       toast({ title: "Erro de Validação", description: "CPF inválido.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        toast({ title: "Cliente atualizado!", description: `${customerData.name} foi atualizado.` });
      } else {
        await addCustomer(customerData);
        toast({ title: "Cliente criado!", description: `${customerData.name} foi criado.` });
      }
      fetchCustomersAndSales();
      setShowFormDialog(false);
      resetForm();
    } catch (error) {
      toast({ title: "Erro ao salvar cliente", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      cpf: formatCPF(customer.cpf),
      phone: formatPhone(customer.phone),
      email: customer.email || '',
      address: customer.address || '',
      category: customer.category || '',
      group_id: customer.group_id || '',
      cep: customer.cep || '',
      street: customer.street || '',
      bairro: customer.bairro || '',
      cidade: customer.cidade || '',
      estado: customer.estado || '',
      complemento: customer.complemento || '',
      cnpj: customer.cnpj || '',
      razao_social: customer.razao_social || '',
      inscricao_estadual: customer.inscricao_estadual || '',
      nome_fantasia: customer.nome_fantasia || ''
    });
    setShowFormDialog(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Tem certeza que deseja remover este cliente?")) return;
    setLoading(true);
    try {
      await deleteCustomer(customerId);
      toast({ title: "Cliente removido!", description: "O cliente foi removido." });
      fetchCustomersAndSales();
    } catch (error) {
      toast({ title: "Erro ao remover cliente", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const getCustomerPurchases = useCallback((customerId) => {
    return sales.filter(sale => sale.customer_id === customerId).sort((a,b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
  }, [sales]);

  const getCustomerTotalSpent = useCallback((customerId) => {
    const purchases = getCustomerPurchases(customerId);
    return purchases.reduce((sum, sale) => sum + (sale.total_amount || sale.total), 0);
  }, [getCustomerPurchases]);

  const handleViewHistory = (customer) => {
    setViewingCustomer(customer);
    setShowHistoryDialog(true);
  };

  if (loading && customers.length === 0) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de clientes e seus históricos.</p>
        </div>
        <CustomerForm 
          open={showFormDialog} 
          onOpenChange={setShowFormDialog}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          editingCustomer={editingCustomer}
          formatCPF={formatCPF}
          formatPhone={formatPhone}
          resetForm={resetForm}
        />
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalVarejo}</p>
                <p className="text-sm text-muted-foreground">Clientes de Varejo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{totalAtacado}</p>
                <p className="text-sm text-muted-foreground">Clientes de Atacado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalClienteExclusivo}</p>
                <p className="text-sm text-muted-foreground">Clientes Exclusivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de pesquisa */}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-background/70 border-none text-white placeholder:text-gray-400 rounded-xl"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-background/70 border-none text-white rounded-xl px-3 py-2"
        >
          <option value="">Todas as Categorias</option>
          <option value="Varejo">Varejo</option>
          <option value="Atacado">Atacado</option>
          <option value="Cliente Exclusivo">Cliente Exclusivo</option>
        </select>
        <Input
          placeholder="Buscar por CPF ou CNPJ..."
          value={filterCpfCnpj}
          onChange={e => setFilterCpfCnpj(e.target.value)}
          className="bg-background/70 border-none text-white placeholder:text-gray-400 rounded-xl"
        />
      </div>

      <CustomerList 
        customers={filteredCustomers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewHistory={handleViewHistory}
        getCustomerPurchases={getCustomerPurchases}
        getCustomerTotalSpent={getCustomerTotalSpent}
        formatCPF={formatCPF}
        formatPhone={formatPhone}
      />

      <CustomerHistoryDialog 
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        customer={viewingCustomer}
        purchases={viewingCustomer ? getCustomerPurchases(viewingCustomer.id) : []}
      />
    </div>
  );
};

export default Customers;