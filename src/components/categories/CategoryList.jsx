import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Tag, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const CategoryList = ({ categories, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="loading-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Nenhuma categoria encontrada
        </h3>
        <p className="text-sm text-muted-foreground">
          Crie sua primeira categoria para organizar seus produtos
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category, index) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color || '#3B82F6' }}
              />
              <h3 className="font-semibold text-lg">{category.name}</h3>
            </div>
            <Badge variant={category.active ? "default" : "secondary"}>
              {category.active ? "Ativa" : "Inativa"}
            </Badge>
          </div>

          {category.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {category.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Tag className="w-3 h-3" />
              <span>
                Criada em {new Date(category.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(category)}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(category)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CategoryList; 