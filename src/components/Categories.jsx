import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  getCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory,
  checkCategoryUsage
} from '@/lib/categoriesStorage';
import { Search, Tag, Plus, Edit, Trash2, Eye } from 'lucide-react';
import CategoryList from '@/components/categories/CategoryList';
import CategoryForm from '@/components/categories/CategoryForm';
import { getCurrentUser } from '@/lib/auth';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'tag',
    active: true
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData || []);
    } catch (error) {
      toast({ 
        title: "Erro ao carregar categorias", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso!"
        });
      } else {
        await addCategory(formData);
        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso!"
        });
      }
      
      setShowFormDialog(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: 'tag',
        active: true
      });
      fetchCategories();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      icon: category.icon || 'tag',
      active: category.active
    });
    setShowFormDialog(true);
  };

  const handleDelete = async (category) => {
    try {
      // Verificar se a categoria está sendo usada
      const isUsed = await checkCategoryUsage(category.id);
      
      if (isUsed) {
        toast({
          title: "Não é possível deletar",
          description: "Esta categoria está sendo usada por produtos. Remova a associação primeiro.",
          variant: "destructive"
        });
        return;
      }

      if (window.confirm(`Tem certeza que deseja deletar a categoria "${category.name}"?`)) {
        await deleteCategory(category.id);
        toast({
          title: "Sucesso",
          description: "Categoria deletada com sucesso!"
        });
        fetchCategories();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'tag',
      active: true
    });
    setShowFormDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias dos seus produtos
          </p>
        </div>
        <button
          onClick={handleNewCategory}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <CategoryList
            categories={filteredCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </CardContent>
      </Card>

      <CategoryForm
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        editingCategory={editingCategory}
      />
    </div>
  );
};

export default Categories; 