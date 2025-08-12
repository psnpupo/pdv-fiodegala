import { supabase } from './supabaseClient';

class InterestRatesService {
  // Buscar configuração atual de juros
  async getInterestRate() {
    try {
      const { data, error } = await supabase
        .from('interest_rates_config')
        .select('credit_card_interest, updated_at, updated_by')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Erro ao buscar taxa de juros:', error);
        return { credit_card_interest: 2.99 }; // Valor padrão
      }

      return data || { credit_card_interest: 2.99 };
    } catch (error) {
      console.error('Erro ao buscar taxa de juros:', error);
      return { credit_card_interest: 2.99 };
    }
  }

  // Salvar/atualizar configuração de juros
  async saveInterestRate(creditCardInterest) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Primeiro, verificar se já existe uma configuração
      const { data: existingConfig } = await supabase
        .from('interest_rates_config')
        .select('id')
        .limit(1)
        .single();

      let result;

      if (existingConfig) {
        // Atualizar configuração existente
        const { data, error } = await supabase
          .from('interest_rates_config')
          .update({
            credit_card_interest: creditCardInterest,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar taxa de juros:', error);
          throw error;
        }

        result = data;
      } else {
        // Criar primeira configuração
        const { data, error } = await supabase
          .from('interest_rates_config')
          .insert({
            credit_card_interest: creditCardInterest,
            created_by: user.id,
            updated_by: user.id
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar taxa de juros:', error);
          throw error;
        }

        result = data;
      }

      return result;
    } catch (error) {
      console.error('Erro ao salvar taxa de juros:', error);
      throw error;
    }
  }

  // Buscar configuração atual com informações de auditoria
  async getCurrentConfigWithAudit() {
    try {
      const { data, error } = await supabase
        .from('interest_rates_config')
        .select(`
          credit_card_interest,
          created_at,
          updated_at,
          created_by,
          updated_by
        `)
        .limit(1)
        .single();

      if (error) {
        console.error('Erro ao buscar configuração:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return null;
    }
  }

  // Verificar se usuário tem permissão para gerenciar
  async canManageInterestRates() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'manager'])
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }
}

export default new InterestRatesService(); 