import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/use-toast';
import customerGroupsStorage from '../../lib/customerGroupsStorage';

const CustomerGroupForm = ({ isOpen, onClose, editingGroup = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    average_ticket: '',
    observations: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name || '',
        average_ticket: editingGroup.average_ticket ? editingGroup.average_ticket.toString() : '',
        observations: editingGroup.observations || ''
      });
    } else {
      setFormData({
        name: '',
        average_ticket: '',
        observations: ''
      });
    }
  }, [editingGroup, isOpen]);

  const formatCurrency = (value) => {
    // Remove tudo exceto números
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue === '') return '';
    
    // Converte para centavos e formata
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  const parseCurrency = (value) => {
    // Remove formatação e converte para número
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numericValue) || 0;
  };

  const handleInputChange = (field, value) => {
    if (field === 'average_ticket') {
      setFormData(prev => ({
        ...prev,
        [field]: formatCurrency(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.average_ticket.trim()) {
      toast({
        title: "Erro",
        description: "Ticket médio é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const groupData = {
        name: formData.name.trim(),
        average_ticket: parseCurrency(formData.average_ticket),
        observations: formData.observations.trim()
      };

      if (editingGroup) {
        await customerGroupsStorage.updateCustomerGroup(editingGroup.id, groupData);
        toast({
          title: "Sucesso!",
          description: "Grupo de clientes atualizado com sucesso"
        });
      } else {
        await customerGroupsStorage.createCustomerGroup(groupData);
        toast({
          title: "Sucesso!",
          description: "Grupo de clientes criado com sucesso"
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar grupo de clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? 'Editar Grupo de Clientes' : 'Criar Grupo de Clientes'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Grupo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Clientes Premium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="average_ticket">Ticket Médio de Compra *</Label>
            <Input
              id="average_ticket"
              value={formData.average_ticket}
              onChange={(e) => handleInputChange('average_ticket', e.target.value)}
              placeholder="R$ 0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              placeholder="Informações adicionais sobre o grupo..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (editingGroup ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerGroupForm; 