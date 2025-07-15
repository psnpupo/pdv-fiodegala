import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logout, hasPermission, PERMISSIONS } from '@/lib/auth';
import { ShoppingCart, Package, Users as UsersIcon, BarChart3, Settings, LogOut, Menu, X, CreditCard, Warehouse, Store } from 'lucide-react';

const Layout = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: 'pos',
      label: 'Frente de Caixa',
      icon: ShoppingCart,
      path: '/pos',
      permission: PERMISSIONS.PROCESS_SALES
    },
    {
      id: 'products',
      label: 'Produtos',
      icon: Package,
      path: '/products',
      permission: PERMISSIONS.MANAGE_PRODUCTS
    },
    {
      id: 'stock',
      label: 'Estoque',
      icon: Warehouse,
      path: '/stock',
      permission: PERMISSIONS.MANAGE_STOCK
    },
    {
      id: 'customers',
      label: 'Clientes',
      icon: UsersIcon,
      path: '/customers',
      permission: PERMISSIONS.MANAGE_PRODUCTS 
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      path: '/reports',
      permission: PERMISSIONS.VIEW_REPORTS
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Settings,
      path: '/users',
      permission: PERMISSIONS.MANAGE_USERS
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    hasPermission(user?.role, item.permission)
  );

  const handleLogout = () => {
    logout();
    onLogout();
    navigate('/login');
  };

  const currentPageLabel = () => {
    const currentPath = location.pathname === '/' ? '/pos' : location.pathname;
    const activeItem = filteredMenuItems.find(item => item.path === currentPath);
    return activeItem?.label || 'Dashboard';
  };
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" }
  };

  const sidebarTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30
  };

  const storeName = user?.stores?.name || (hasPermission(user?.role, PERMISSIONS.VIEW_ALL_STORES_DATA) ? 'Todas as Lojas' : 'Loja não definida');

  return (
    <div className="min-h-screen bg-background flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={sidebarTransition}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-lg lg:static lg:translate-x-0"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">PDV System</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 p-4">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Logado como:</p>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Store className="w-3 h-3 mr-1" />
                    <span>{storeName}</span>
                  </div>
                </div>

                <nav className="space-y-2">
                  {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/pos');
                    
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                        asChild
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <Link to={item.path}>
                          <Icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </Link>
                      </Button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sair
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold">
                {currentPageLabel()}
              </h1>
              <div className="flex items-center text-xs text-muted-foreground">
                <Store className="w-3 h-3 mr-1" />
                <span>{storeName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;