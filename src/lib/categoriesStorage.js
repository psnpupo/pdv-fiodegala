import { supabase } from './supabaseClient';
import { getCurrentUser } from './auth';

// Buscar todas as categorias
export const getCategories = async () => {
  try {
    const user = getCurrentUser();
    let query = supabase
      .from('categories')
      .select('*')
      .order('name');

    // Se não for admin, filtrar por loja
    if (user?.role !== 'admin' && user?.store_id) {
      query = query.eq('store_id', user.store_id);
    } else if (user?.role !== 'admin') {
      // Se não for admin e não tem store_id, buscar apenas categorias sem loja específica
      query = query.is('store_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      throw new Error('Erro ao buscar categorias');
    }

    return data || [];
  } catch (error) {
    console.error('Erro em getCategories:', error);
    throw error;
  }
};

// Buscar categoria por ID
export const getCategoryById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar categoria:', error);
      throw new Error('Erro ao buscar categoria');
    }

    return data;
  } catch (error) {
    console.error('Erro em getCategoryById:', error);
    throw error;
  }
};

// Adicionar nova categoria
export const addCategory = async (categoryData) => {
  try {
    const user = getCurrentUser();
    
    const categoryToInsert = {
      ...categoryData,
      store_id: user?.store_id || null
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([categoryToInsert])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar categoria:', error);
      throw new Error('Erro ao adicionar categoria');
    }

    return data;
  } catch (error) {
    console.error('Erro em addCategory:', error);
    throw error;
  }
};

// Atualizar categoria
export const updateCategory = async (id, categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw new Error('Erro ao atualizar categoria');
    }

    return data;
  } catch (error) {
    console.error('Erro em updateCategory:', error);
    throw error;
  }
};

// Deletar categoria
export const deleteCategory = async (id) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar categoria:', error);
      throw new Error('Erro ao deletar categoria');
    }

    return true;
  } catch (error) {
    console.error('Erro em deleteCategory:', error);
    throw error;
  }
};

// Buscar categorias ativas
export const getActiveCategories = async () => {
  try {
    const user = getCurrentUser();
    let query = supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name');

    // Se não for admin, filtrar por loja
    if (user?.role !== 'admin' && user?.store_id) {
      query = query.eq('store_id', user.store_id);
    } else if (user?.role !== 'admin') {
      // Se não for admin e não tem store_id, buscar apenas categorias sem loja específica
      query = query.is('store_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar categorias ativas:', error);
      throw new Error('Erro ao buscar categorias ativas');
    }

    return data || [];
  } catch (error) {
    console.error('Erro em getActiveCategories:', error);
    throw error;
  }
};

// Verificar se categoria está sendo usada em produtos
export const checkCategoryUsage = async (categoryId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('category', categoryId)
      .limit(1);

    if (error) {
      console.error('Erro ao verificar uso da categoria:', error);
      throw new Error('Erro ao verificar uso da categoria');
    }

    return data.length > 0;
  } catch (error) {
    console.error('Erro em checkCategoryUsage:', error);
    throw error;
  }
}; 