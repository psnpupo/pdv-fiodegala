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
  const [error, setError] = useState(null);

  // Buscar os 3 últimos produtos cadastrados
  const fetchRecentProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Buscando produtos recentes...');
      
      const products = await getProducts();
      console.log('📦 Produtos encontrados:', products?.length || 0);
      
      // Filtrar apenas produtos ativos e ordenar por data de criação (mais recentes primeiro)
      const activeProducts = products
        .filter(product => product.active && product.barcode) // Garantir que tem código de barras
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3); // Pegar apenas os 3 últimos
      
      console.log('✅ Produtos recentes processados:', activeProducts.length);
      setRecentProducts(activeProducts);
    } catch (error) {
      console.error('❌ Erro ao buscar produtos recentes:', error);
      setError(error.message);
      setRecentProducts([]);
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
    console.log('🔄 Atualizando produtos recentes...');
    fetchRecentProducts();
  };

  const value = {
    recentProducts,
    loading,
    error,
    refreshRecentProducts,
    fetchRecentProducts
  };

  return (
    <RecentProductsContext.Provider value={value}>
      {children}
    </RecentProductsContext.Provider>
  );
};
