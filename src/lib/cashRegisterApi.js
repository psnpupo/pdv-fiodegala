// API para controle de caixa - integração com backend
import { BACKEND_URL } from './config.js';

// Obter estado atual do caixa
export const getCashRegisterState = async (storeId = null) => {
  try {
    const params = new URLSearchParams();
    if (storeId) params.append('store_id', storeId);

    const response = await fetch(`${BACKEND_URL}/cash-register/state?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar estado do caixa');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Abrir caixa
export const openCashRegister = async (initialAmount, storeId, userId) => {
  try {
    const response = await fetch(`${BACKEND_URL}/cash-register/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initial_amount: initialAmount,
        store_id: storeId,
        user_id: userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao abrir caixa');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Fechar caixa
export const closeCashRegister = async (finalAmount, storeId, userId, notes = null) => {
  try {
    const response = await fetch(`${BACKEND_URL}/cash-register/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        final_amount: finalAmount,
        store_id: storeId,
        user_id: userId,
        notes: notes
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao fechar caixa');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Listar logs do caixa
export const getCashRegisterLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const response = await fetch(`${BACKEND_URL}/cash-register/logs?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar logs do caixa');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
};

// Adicionar log do caixa
export const addCashRegisterLog = async (type, amount, storeId, userId, notes = null) => {
  try {
    const response = await fetch(`${BACKEND_URL}/cash-register/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type,
        amount: amount,
        store_id: storeId,
        user_id: userId,
        notes: notes
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao adicionar log do caixa');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com o backend: ${error.message}`);
  }
}; 