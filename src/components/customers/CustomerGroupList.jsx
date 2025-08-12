import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { Edit, Trash2, Users, DollarSign } from 'lucide-react';
import customerGroupsStorage from '../../lib/customerGroupsStorage';
import CustomerGroupForm from './CustomerGroupForm';

const CustomerGroupList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await customerGroupsStorage.getCustomerGroups();
      setGroups(data);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar grupos de clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleEdit = (group) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Deseja realmente excluir o grupo "${group.name}"?`)) {
      return;
    }

    try {
      // Verificar se o grupo está sendo usado
      const isInUse = await customerGroupsStorage.isGroupInUse(group.id);
      
      if (isInUse) {
        toast({
          title: "Erro",
          description: "Este grupo não pode ser excluído pois está sendo usado por clientes",
          variant: "destructive"
        });
        return;
      }

      await customerGroupsStorage.deleteCustomerGroup(group.id);
      
      toast({
        title: "Sucesso!",
        description: "Grupo excluído com sucesso"
      });
      
      fetchGroups();
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir grupo",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleFormSuccess = () => {
    fetchGroups();
    setEditingGroup(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGroup(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando grupos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Grupos de Clientes</h2>
        <Button onClick={() => setShowForm(true)}>
          <Users className="w-4 h-4 mr-2" />
          Criar Grupo
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum grupo criado</h3>
            <p className="text-gray-500 mb-4">Crie seu primeiro grupo de clientes para começar</p>
            <Button onClick={() => setShowForm(true)}>
              Criar Primeiro Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(group)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(group)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Ticket Médio:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(group.average_ticket)}
                  </span>
                </div>
                
                {group.observations && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Observações:</p>
                    <p className="text-gray-500">{group.observations}</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  Criado em: {new Date(group.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerGroupForm
        isOpen={showForm}
        onClose={handleFormClose}
        editingGroup={editingGroup}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default CustomerGroupList; 