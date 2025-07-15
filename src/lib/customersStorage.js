import { supabase } from './supabaseClient';

export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data;
};

export const addCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select();
  if (error) {
    console.error('Error adding customer:', error);
    return null;
  }
  return data ? data[0] : null;
};

export const updateCustomer = async (customerId, customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .update(customerData)
    .eq('id', customerId)
    .select();
  if (error) {
    console.error('Error updating customer:', error);
    return null;
  }
  return data ? data[0] : null;
};

export const deleteCustomer = async (customerId) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);
  if (error) {
    console.error('Error deleting customer:', error);
    return false;
  }
  return true;
};