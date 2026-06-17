import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { customerService } from '../services/customerService';

const CustomerContext = createContext(undefined);

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load from IndexedDB on mount — instant, no network needed
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const _sort = (list) =>
    [...list].sort((a, b) => (b.is_favorite - a.is_favorite) || a.name.localeCompare(b.name));

  const addCustomer = useCallback(async (name) => {
    const created = await customerService.create(name);
    setCustomers(prev => _sort([created, ...prev]));
    return created;
  }, []);

  const updateCustomer = useCallback(async (id, updates) => {
    const updated = await customerService.update(id, updates);
    setCustomers(prev => _sort(prev.map(c => c.id === id ? updated : c)));
    return updated;
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    return updateCustomer(id, { is_favorite: !customer.is_favorite });
  }, [customers, updateCustomer]);

  const deleteCustomer = useCallback(async (id) => {
    await customerService.delete(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <CustomerContext.Provider value={{
      customers,
      loading,
      loadCustomers,
      addCustomer,
      updateCustomer,
      toggleFavorite,
      deleteCustomer,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomers must be used within CustomerProvider');
  return ctx;
};

export default CustomerContext;
