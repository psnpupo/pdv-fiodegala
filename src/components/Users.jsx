import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  getUsers, 
  addUser, 
  updateUserRole, 
  updateUserViaBackend,
  deleteUserViaBackend,
  toggleUserActive,
  USER_ROLES, 
  ROLE_PERMISSIONS,
  getStores,
  getCurrentUser
} from '@/lib/auth';
import { Plus, Edit, Trash2, Users as UsersIcon, Shield, Eye, EyeOff, Store } from 'lucide-react';

const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.MANAGER]: 'Gerente',
  [USER_ROLES.CASHIER]: 'Operador de Caixa',
  [USER_ROLES.STOCK]: 'Estoquista',
  [USER_ROLES.SALESPERSON]: 'Vendedor' // Novo label
};

const NO_STORE_VALUE = "__no_store_selected__";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: '',
    store_id: NO_STORE_VALUE,
    active: true
  });

  const isAdmin = getCurrentUser()?.role === USER_ROLES.ADMIN;

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, storesData] = await Promise.all([
        getUsers(),
        getStores() 
      ]);
      setUsers(usersData || []);
      setStores(storesData || []);
    } catch (error) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setFormData({ username: '', password: '', name: '', role: '', store_id: NO_STORE_VALUE, active: true });
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const actualStoreId = formData.store_id === NO_STORE_VALUE ? null : formData.store_id;
    const selectedStoreIsOnline = stores.find(s => s.id === actualStoreId)?.is_online_store;

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.username)) {
      toast({ title: "Erro de Validação", description: "O e-mail do usuário é inválido.", variant: "destructive" });
      return;
    }

    if (!formData.role) {
        toast({ title: "Erro de Validação", description: "Função é obrigatória.", variant: "destructive" });
        return;
    }
    
    if (!actualStoreId && formData.role !== USER_ROLES.ADMIN && !selectedStoreIsOnline) {
      toast({ title: "Erro de Validação", description: "Loja é obrigatória para esta função (exceto Admin global ou se a loja for a online).", variant: "destructive" });
      return;
    }
    
    const existingUser = users.find(u => 
      u.username === formData.username && 
      (!editingUser || u.id !== editingUser.id)
    );
    
    if (existingUser) {
      toast({ title: "Erro", description: "Nome de usuário já existe.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const userData = { ...formData, store_id: actualStoreId }; 
      if (editingUser && !formData.password) {
        delete userData.password;
      }

      if (editingUser) {
        if (isAdmin) {
          // Usar backend para atualizar usuário
          const updateData = {
            name: formData.name,
            role: formData.role,
            store_id: formData.store_id === NO_STORE_VALUE ? null : formData.store_id,
            password: formData.password || undefined
          };
          await updateUserViaBackend(editingUser.id, updateData);
          toast({ title: "Usuário atualizado!", description: `${formData.name} foi atualizado com sucesso.` });
        } else {
          toast({ title: "Apenas admin pode alterar usuários!", variant: "destructive" });
        }
      } else {
        // Usar backend para criar usuário
        await createFuncionarioViaBackend(userData);
        toast({ title: "Funcionário criado!", description: `${formData.name} foi criado com sucesso.` });
      }
      fetchInitialData();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast({ title: "Erro ao salvar usuário", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Função para criar funcionário via backend
  const createFuncionarioViaBackend = async (userData) => {
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.username,
          password: userData.password,
          name: userData.name,
          role: userData.role,
          store_id: userData.store_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar funcionário');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Erro na comunicação com o backend: ${error.message}`);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name || user.username.split('@')[0], // Usar name se existir, senão parte do email
      role: user.role,
      store_id: user.store_id || NO_STORE_VALUE, 
      active: user.active
    });
    setShowDialog(true);
  };

  const handleToggleActive = async (userToToggle) => {
    setLoading(true);
    try {
      // Usar backend para atualizar status do usuário
      await toggleUserActive(userToToggle.id, !userToToggle.active);
      toast({
        title: userToToggle.active ? "Usuário desativado" : "Usuário ativado",
        description: `${userToToggle.name} foi ${userToToggle.active ? 'desativado' : 'ativado'}.`,
      });
      fetchInitialData();
    } catch (error) {
      toast({ title: "Erro ao alterar status do usuário", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Tem certeza que deseja remover este usuário?")) return;
    setLoading(true);
    try {
      await deleteUserViaBackend(userId);
      toast({ title: "Usuário removido!", description: "O usuário foi removido com sucesso." });
      fetchInitialData();
    } catch (error) {
      toast({ title: "Erro ao remover usuário", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN: return 'text-red-600 bg-red-100 dark:bg-red-900';
      case USER_ROLES.MANAGER: return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case USER_ROLES.CASHIER: return 'text-green-600 bg-green-100 dark:bg-green-900';
      case USER_ROLES.STOCK: return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case USER_ROLES.SALESPERSON: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  if (loading && users.length === 0 && stores.length === 0) {
    return <div className="flex justify-center items-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários, funções e suas lojas</p>
        </div>
        {isAdmin && (
          <Dialog open={showDialog} onOpenChange={(isOpen) => {setShowDialog(isOpen); if(!isOpen) resetForm();}}>
            <DialogTrigger asChild><Button onClick={() => resetForm()}><Plus className="w-4 h-4 mr-2" />Novo Funcionário</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Funcionário'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Edite as informações do usuário.' : 'Crie um novo funcionário no sistema.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required/>
                </div>
                <div>
                  <Label htmlFor="username">E-mail do Usuário</Label>
                  <Input id="username" type="email" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required placeholder="usuario@exemplo.com"/>
                </div>
                <div>
                  <Label htmlFor="password">{editingUser ? 'Nova Senha (deixe vazio para manter atual)' : 'Senha'}</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!editingUser} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {isAdmin && (
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                      <SelectTrigger><SelectValue placeholder="Selecione uma função" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="store_id">Loja</Label>
                  <Select value={formData.store_id} onValueChange={(value) => setFormData({...formData, store_id: value})}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma loja" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_STORE_VALUE}>Nenhuma (Global/Admin)</SelectItem>
                      {stores.map((store) => (<SelectItem key={store.id} value={store.id}>{store.name} {store.is_online_store ? "(Online)" : ""}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Criar') + ' Usuário'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2"><UsersIcon className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{users.length}</p><p className="text-sm text-muted-foreground">Total de Usuários</p></div></div>
          </CardContent>
        </Card>
         <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2"><Store className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{stores.length}</p><p className="text-sm text-muted-foreground">Total de Lojas</p></div></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-hover">
            <Card className={`glass-effect ${!user.active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2"><UsersIcon className="w-5 h-5 text-primary" /><CardTitle className="text-lg">{user.name}</CardTitle></div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Usuário: {user.username}</p>
                  <p className="text-sm text-muted-foreground">Nome: {user.name || user.username.split('@')[0]}</p>
                  <p className="text-sm text-muted-foreground">
                    Loja: {user.stores?.name ? `${user.stores.name}${user.stores.is_online_store ? ' (Online)' : ''}` : (user.role === USER_ROLES.ADMIN ? 'Todas (Admin)' : 'Não definida')}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>{ROLE_LABELS[user.role]}</span>
                    {isAdmin && (
                      <Button size="xs" variant="outline" onClick={() => handleEdit(user)}>Alterar Role</Button>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.active ? 'text-green-600 bg-green-100 dark:bg-green-900' : 'text-red-600 bg-red-100 dark:bg-red-900'}`}>{user.active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Permissões:</p>
                  <div className="space-y-1">
                    {ROLE_PERMISSIONS[user.role]?.slice(0, 3).map(permission => (<div key={permission} className="text-xs text-muted-foreground">• {permission.replace(/_/g, ' ').toLowerCase()}</div>))}
                    {ROLE_PERMISSIONS[user.role]?.length > 3 && (<div className="text-xs text-muted-foreground">• +{ROLE_PERMISSIONS[user.role].length - 3} mais...</div>)}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleToggleActive(user)} disabled={loading}>{loading ? 'Aguarde...' : (user.active ? 'Desativar' : 'Ativar') + ' Usuário'}</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <Card><CardContent className="text-center py-12"><UsersIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3><p className="text-muted-foreground">Comece criando seu primeiro usuário</p></CardContent></Card>
      )}
    </div>
  );
};

export default Users;