// API para vendas - integração com backend
import { BACKEND_URL } from './config.js';

// Função auxiliar para criar um fetch com timeout
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: A requisição demorou muito para responder');
    }
    throw error;
  }
};

// Função auxiliar para retry
const retryFetch = async (fetchFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Buscar produto por código de barras
export const getProductByBarcode = async (code, storeId = null, modalidade = 'varejo') => {
  try {
    const params = new URLSearchParams();
    params.append('code', code);
    if (storeId) params.append('store_id', storeId);
    if (modalidade) params.append('modalidade', modalidade);

    const url = `${BACKEND_URL}/sales/products/barcode/${code}?${params}`;
    
    const response = await retryFetch(async () => {
      return await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }, 15000); // 15 segundos de timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar produto por código de barras:', error);
    
    // Mensagens de erro mais específicas
    if (error.message.includes('Timeout')) {
      throw new Error('Servidor não respondeu a tempo. Verifique sua conexão e tente novamente.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    } else if (error.message.includes('NetworkError')) {
      throw new Error('Erro de rede. Verifique sua conexão com a internet.');
    } else {
      throw new Error(`Erro na comunicação com o backend: ${error.message}`);
    }
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