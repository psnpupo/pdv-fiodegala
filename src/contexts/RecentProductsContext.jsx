import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProducts } from '@/lib/productsStorage';

const RecentProductsContext = createContext();

export const useRecentProducts = () => {
  const context = useContext(RecentProductsContext);
  if (!context) {
    throw new Error('useRecentProducts deve ser usado dentro de um RecentProductsProvider');
  }
  return context;
};

export const RecentProductsProvider = ({ children }) => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Buscar os 3 últimos produtos cadastrados
  const fetchRecentProducts = async () => {
    try {
      setLoading(true);
      const products = await getProducts();
      
      // Filtrar apenas produtos ativos e ordenar por data de criação (mais recentes primeiro)
      const activeProducts = products
        .filter(product => product.active)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3); // Pegar apenas os 3 últimos
      
      setRecentProducts(activeProducts);
    } catch (error) {
      console.error('Erro ao buscar produtos recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar produtos recentes quando o contexto for montado
  useEffect(() => {
    fetchRecentProducts();
  }, []);

  // Função para forçar atualização dos produtos recentes
  const refreshRecentProducts = () => {
    fetchRecentProducts();
  };

  const value = {
    recentProducts,
    loading,
    refreshRecentProducts,
    fetchRecentProducts
  };

  return (
    <RecentProductsContext.Provider value={value}>
      {children}
    </RecentProductsContext.Provider>
  );
};
