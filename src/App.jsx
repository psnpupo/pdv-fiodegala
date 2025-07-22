import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import POS from '@/components/POS';
import Products from '@/components/Products';
import ProductDetail from '@/components/products/ProductDetail';
import Stock from '@/components/Stock';
import Customers from '@/components/Customers';
import Reports from '@/components/Reports';
import Users from '@/components/Users';
import CashRegister from '@/components/CashRegister';
import { getCurrentUser, hasPermission, PERMISSIONS, authenticateUser, setCurrentUser as setLocalCurrentUser, logout as localLogout } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';


const ProtectedRoute = ({ element, requiredPermission, user }) => {
  if (!user || user.role === 'none') {
    return <Navigate to="/login" />;
  }
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return <Navigate to="/" />;
  }
  return element;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const handleShowToast = (event) => {
      toast(event.detail);
    };
    window.addEventListener('show-toast', handleShowToast);

    const checkUserSession = async () => {
      const localUser = getCurrentUser();
      if (localUser) {
        setUser(localUser);
      }
      setLoading(false);
    };
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Sem consulta à tabela user_roles
          let role = 'none';
          if (session.user.email === 'admin@server.com') {
            role = 'admin';
          }
          const userObj = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            role,
            store_id: null,
            active: true,
            created_at: session.user.created_at,
            stores: null
          };
          setUser(userObj);
          setLocalCurrentUser(userObj);
        } else {
          setUser(null);
          localLogout();
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('show-toast', handleShowToast);
    };
  }, [toast]);

  const handleLogin = (userData) => {
    setUser(userData);
    setLocalCurrentUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="loading-spinner w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute user={user} element={<Layout onLogout={handleLogout} />} />
          }
        >
          <Route index element={<ProtectedRoute user={user} element={<POS />} requiredPermission={PERMISSIONS.PROCESS_SALES} />} />
          <Route path="pos" element={<ProtectedRoute user={user} element={<POS />} requiredPermission={PERMISSIONS.PROCESS_SALES} />} />
          <Route path="products" element={<ProtectedRoute user={user} element={<Products />} requiredPermission={PERMISSIONS.MANAGE_PRODUCTS} />} />
          <Route path="products/:id" element={<ProtectedRoute user={user} element={<ProductDetail />} requiredPermission={PERMISSIONS.MANAGE_PRODUCTS} />} />
          <Route path="stock" element={<ProtectedRoute user={user} element={<Stock />} requiredPermission={PERMISSIONS.MANAGE_STOCK} />} />
          <Route path="customers" element={<ProtectedRoute user={user} element={<Customers />} requiredPermission={PERMISSIONS.MANAGE_PRODUCTS} />} />
          <Route path="reports" element={<ProtectedRoute user={user} element={<Reports />} requiredPermission={PERMISSIONS.VIEW_REPORTS} />} />
          <Route path="users" element={<ProtectedRoute user={user} element={<Users />} requiredPermission={PERMISSIONS.MANAGE_USERS} />} />
          <Route path="cash-register" element={<ProtectedRoute user={user} element={<CashRegister />} requiredPermission={PERMISSIONS.CASH_REGISTER_MANAGEMENT} />} />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;