import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react'; // Corrigido: UserIcon para Plus para manter a semântica do botão

const CustomerForm = ({ open, onOpenChange, formData, setFormData, onSubmit, editingCustomer, formatCPF, formatPhone, resetForm }) => {
  const [cepLoading, setCepLoading] = useState(false);

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

  // Exibe campos de empresa se categoria for Atacado ou Atacarejo
  const showCompanyFields = formData.category === 'Atacado' || formData.category === 'Atacarejo';

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
      <DialogContent className="max-w-2xl">
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
              <select
                id="category"
                value={formData.category || ''}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="bg-background/70 border-none text-white rounded-xl px-3 py-2 w-full"
                required
              >
                <option value="">Selecione...</option>
                <option value="Varejo">Varejo</option>
                <option value="Atacado">Atacado</option>
                <option value="Atacarejo">Atacarejo</option>
              </select>
            </div>
            {/* Campos de empresa */}
            {showCompanyFields && <>
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
                  required={showCompanyFields}
                />
              </div>
              <div>
                <Label htmlFor="inscricao_estadual">Inscrição Estadual *</Label>
                <Input
                  id="inscricao_estadual"
                  value={formData.inscricao_estadual || ''}
                  onChange={e => setFormData({...formData, inscricao_estadual: e.target.value})}
                  required={showCompanyFields}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="nome_fantasia"
                  value={formData.nome_fantasia || ''}
                  onChange={e => setFormData({...formData, nome_fantasia: e.target.value})}
                />
              </div>
            </>}
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