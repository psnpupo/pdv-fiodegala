import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, Edit, Trash2, FileText, Phone, Mail, UserCheck, Building2 } from 'lucide-react';

const CustomerList = ({ customers, onEdit, onDelete, onViewHistory, getCustomerPurchases, getCustomerTotalSpent, formatCPF, formatPhone }) => {
  // Função para formatar CNPJ
  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const numbers = cnpj.replace(/\D/g, '');
    if (numbers.length > 14) numbers.slice(0, 14);
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };
  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <UserIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os termos de busca ou crie seu primeiro cliente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {customers.map((customer) => {
        const purchases = getCustomerPurchases(customer.id);
        const totalSpent = getCustomerTotalSpent(customer.id);
        
        return (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                     <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewHistory(customer)}
                      title="Ver Histórico"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(customer)}
                      title="Editar Cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(customer.id)}
                      className="text-destructive hover:text-destructive"
                      title="Remover Cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  {customer.cpf && 
                    <div className="flex items-center space-x-2 text-sm">
                      <UserIcon className="w-3 h-3 text-muted-foreground" />
                      <span>CPF: {formatCPF(customer.cpf)}</span>
                    </div>
                  }
                  {customer.cnpj && 
                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="w-3 h-3 text-muted-foreground" />
                      <span>CNPJ: {formatCNPJ(customer.cnpj)}</span>
                    </div>
                  }
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span>{formatPhone(customer.phone)}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.customer_groups && (
                    <div className="flex items-center space-x-2 text-sm">
                      <UserCheck className="w-3 h-3 text-blue-600" />
                      <span className="text-blue-600 font-medium">
                        {customer.customer_groups.name}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{purchases.length}</p>
                      <p className="text-xs text-muted-foreground">Compras</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        R$ {totalSpent.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Gasto</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Cliente desde: {new Date(customer.created_at || customer.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CustomerList;