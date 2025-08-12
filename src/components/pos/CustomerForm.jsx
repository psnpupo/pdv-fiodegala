import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { addCustomer } from '@/lib/customersStorage';
import { useToast } from '@/components/ui/use-toast';

const CustomerForm = ({ open, onOpenChange, onCustomerCreated }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    cnpj: '',
    phone: '',
    email: '',
    category: '',
    cep: '',
    street: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: ''
  });
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Resetar formulário quando abrir
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        cpf: '',
        cnpj: '',
        phone: '',
        email: '',
        category: '',
        cep: '',
        street: '',
        bairro: '',
        cidade: '',
        estado: '',
        complemento: ''
      });
    }
  }, [open]);

  // Formatar CPF
  const formatCPF = (value) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Formatar telefone
  const formatPhone = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 10) {
      return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  // Busca dados do ViaCEP
  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData({
          ...formData,
          cep: data.cep,
          street: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          complemento: data.complemento
        });
      }
    } finally {
      setCepLoading(false);
    }
  };

  // Exibe campos de empresa se categoria for Atacado ou Cliente Exclusivo
  const showCompanyFields = formData.category === 'Atacado' || formData.category === 'Cliente Exclusivo';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.name || !formData.phone || !formData.category) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome, telefone e categoria são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (showCompanyFields && (!formData.cnpj || !formData.razao_social)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'CNPJ e Razão Social são obrigatórios para empresas.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const newCustomer = await addCustomer(formData);
      if (newCustomer) {
        toast({
          title: 'Cliente criado com sucesso!',
          description: `${formData.name} foi adicionado à lista de clientes.`,
          variant: 'default'
        });
        
        // Chamar callback para atualizar a lista de clientes
        if (onCustomerCreated) {
          onCustomerCreated(newCustomer);
        }
        
        // Fechar modal
        onOpenChange(false);
      } else {
        toast({
          title: 'Erro ao criar cliente',
          description: 'Tente novamente.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: 'Erro ao criar cliente',
        description: error.message || 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Cadastrar Novo Cliente
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nome completo do cliente"
              />
            </div>
            
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>
            
            {/* Categoria do cliente */}
            <div className="md:col-span-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Varejo">Varejo</SelectItem>
                  <SelectItem value="Atacado">Atacado</SelectItem>
                  <SelectItem value="Cliente Exclusivo">Cliente Exclusivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos de empresa */}
            {showCompanyFields && (
              <>
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={e => setFormData({...formData, cnpj: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social}
                    onChange={e => setFormData({...formData, razao_social: e.target.value})}
                    placeholder="Razão social da empresa"
                  />
                </div>
              </>
            )}
            
            {/* Endereço */}
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={e => setFormData({...formData, cep: e.target.value})}
                onBlur={handleCepBlur}
                disabled={cepLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={e => setFormData({...formData, street: e.target.value})}
                placeholder="Nome da rua"
              />
            </div>
            
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={e => setFormData({...formData, bairro: e.target.value})}
                placeholder="Nome do bairro"
              />
            </div>
            
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={e => setFormData({...formData, cidade: e.target.value})}
                placeholder="Nome da cidade"
              />
            </div>
            
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value})}
                placeholder="UF"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={e => setFormData({...formData, complemento: e.target.value})}
                placeholder="Apartamento, bloco, etc."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerForm;
