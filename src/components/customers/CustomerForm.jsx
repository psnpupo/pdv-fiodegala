import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import customerGroupsStorage from '../../lib/customerGroupsStorage';

const CustomerForm = ({ open, onOpenChange, formData, setFormData, onSubmit, editingCustomer, formatCPF, formatPhone, resetForm }) => {
  const [cepLoading, setCepLoading] = useState(false);
  const [customerGroups, setCustomerGroups] = useState([]);

  // Buscar grupos de clientes
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groups = await customerGroupsStorage.getCustomerGroups();
        setCustomerGroups(groups);
      } catch (error) {
        console.error('Erro ao buscar grupos:', error);
      }
    };
    fetchGroups();
  }, []);

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> 
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              />
            </div>
            {/* Categoria do cliente */}
            <div className="md:col-span-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category || ''}
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

            {/* Grupo de Clientes */}
            <div className="md:col-span-2">
              <Label htmlFor="group_id">Nível de Comprador</Label>
              <Select
                value={formData.group_id || ''}
                onValueChange={(value) => setFormData({...formData, group_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum grupo</SelectItem>
                  {customerGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} - {group.ticket_min ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(group.ticket_min) : 'Sem valor definido'}
                    </SelectItem>
                  ))}
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
                    value={formData.cnpj || ''}
                    onChange={e => setFormData({...formData, cnpj: e.target.value})}
                    required={showCompanyFields}
                  />
                </div>
                <div>
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social || ''}
                    onChange={e => setFormData({...formData, razao_social: e.target.value})}
                    placeholder="Razão social da empresa"
                    required={showCompanyFields}
                  />
                </div>
                <div>
                  <Label htmlFor="inscricao_estadual">Inscrição Estadual *</Label>
                  <Input
                    id="inscricao_estadual"
                    value={formData.inscricao_estadual || ''}
                    onChange={e => setFormData({...formData, inscricao_estadual: e.target.value})}
                    placeholder="Inscrição estadual"
                    required={showCompanyFields}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome_fantasia"
                    value={formData.nome_fantasia || ''}
                    onChange={e => setFormData({...formData, nome_fantasia: e.target.value})}
                    placeholder="Nome fantasia da empresa"
                  />
                </div>
              </>
            )}
            {/* Endereço completo */}
            <div>
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep || ''}
                onChange={e => setFormData({...formData, cep: e.target.value})}
                onBlur={handleCepBlur}
                required
                disabled={cepLoading}
              />
            </div>
            <div>
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                value={formData.street || ''}
                onChange={e => setFormData({...formData, street: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                value={formData.bairro || ''}
                onChange={e => setFormData({...formData, bairro: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade || ''}
                onChange={e => setFormData({...formData, cidade: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                value={formData.estado || ''}
                onChange={e => setFormData({...formData, estado: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento || ''}
                onChange={e => setFormData({...formData, complemento: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => {
              onOpenChange(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingCustomer ? 'Atualizar' : 'Criar'} Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerForm;