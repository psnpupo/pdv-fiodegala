// API para vendas - integração com backend
const BACKEND_URL = 'http://localhost:4000/api';

// Buscar produto por código de barras
export const getProductByBarcode = async (code, storeId = null, modalidade = 'varejo') => {
  try {
    const params = new URLSearchParams();
    params.append('code', code);
    if (storeId) params.append('store_id', storeId);
    if (modalidade) params.append('modalidade', modalidade);

    const response = await fetch(`${BACKEND_URL}/sales/products/barcode/${code}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar produto');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Criar nova venda
export const createSale = async (saleData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar venda');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Listar vendas
export const getSales = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${BACKEND_URL}/sales?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar vendas');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Buscar venda por ID
export const getSaleById = async (saleId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/sales/${saleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar venda');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Cancelar venda
export const cancelSale = async (saleId, reason = null) => {
  try {
    const response = await fetch(`${BACKEND_URL}/sales/${saleId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao cancelar venda');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Atualizar venda
export const updateSale = async (saleId, updateData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/sales/${saleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar venda');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Deletar venda
export const deleteSale = async (saleId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/sales/${saleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao deletar venda');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
}; 