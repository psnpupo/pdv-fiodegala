import React from 'react';
import CustomerGroupList from './customers/CustomerGroupList';

const CustomerGroups = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Níveis de Comprador</h1>
        <p className="text-gray-600">
          Gerencie grupos de clientes baseados no ticket médio de compra e outras características.
        </p>
      </div>
      
      <CustomerGroupList />
    </div>
  );
};

export default CustomerGroups; 