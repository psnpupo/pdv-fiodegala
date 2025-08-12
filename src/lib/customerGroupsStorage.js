import { supabase } from './supabaseClient.js';

export class CustomerGroupsStorage {
  // Buscar todos os grupos de clientes
  async getCustomerGroups() {
    try {
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar grupos de clientes:', error);
      throw error;
    }
  }

  // Buscar um grupo específico por ID
  async getCustomerGroup(id) {
    try {
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar grupo de cliente:', error);
      throw error;
    }
  }

  // Criar novo grupo de clientes
  async createCustomerGroup(groupData) {
    try {
      const insertData = {
        name: groupData.name,
        category: 'Varejo', // Categoria padrão fixa
        ticket_min: groupData.average_ticket || null, // Usar ticket_min para armazenar o valor médio
        ticket_max: null, // Não usar ticket_max
        description: groupData.description || null
      };

      const { data, error } = await supabase
        .from('customer_groups')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar grupo de cliente:', error);
      throw error;
    }
  }

  // Atualizar grupo de clientes
  async updateCustomerGroup(id, groupData) {
    try {
      const updateData = {
        name: groupData.name,
        category: 'Varejo', // Categoria padrão fixa
        ticket_min: groupData.average_ticket || null, // Usar ticket_min para armazenar o valor médio
        ticket_max: null, // Não usar ticket_max
        description: groupData.description || null
      };

      const { data, error } = await supabase
        .from('customer_groups')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar grupo de cliente:', error);
      throw error;
    }
  }

  // Deletar grupo de clientes
  async deleteCustomerGroup(id) {
    try {
      const { error } = await supabase
        .from('customer_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar grupo de cliente:', error);
      throw error;
    }
  }

  // Verificar se grupo está sendo usado por clientes
  async isGroupInUse(id) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('group_id', id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar uso do grupo:', error);
      throw error;
    }
  }
}

export default new CustomerGroupsStorage(); 