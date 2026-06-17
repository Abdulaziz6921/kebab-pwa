import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { orderService, syncService, SYNC_STATUS } from '../services';

const OrderContext = createContext(undefined);

// Sync status enum (expose from service)
export { SYNC_STATUS };

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  // Initialize sync and load orders on mount
  useEffect(() => {
    const initOrders = async () => {
      setLoading(true);
      try {
        // Load orders from IndexedDB (offline-first)
        const localOrders = await orderService.getAll();
        setOrders(localOrders);

        // Initialize sync service
        syncService.init();

        // Subscribe to sync status changes
        const unsubscribe = syncService.subscribe((status) => {
          setSyncStatus(status);
          // Reload orders after successful sync
          if (status.completedAt) {
            loadOrders();
          }
        });

        return unsubscribe;
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    initOrders();
  }, []);

  // Load orders from IndexedDB
  const loadOrders = useCallback(async () => {
    try {
      const localOrders = await orderService.getAll();
      setOrders(localOrders);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    }
  }, []);

  // Fetch/refresh orders (pull from remote)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Trigger sync
      const result = await syncService.syncAll();
      if (result.success) {
        await loadOrders();
      }
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadOrders]);

  // Create a new order (offline-first)
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const newOrder = await orderService.create(orderData);
      // Update local state
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      setError(err.message || 'Failed to create order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing order (offline-first)
  const updateOrder = useCallback(async (orderId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const updatedOrder = await orderService.update(orderId, updates);
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      );
      return updatedOrder;
    } catch (err) {
      setError(err.message || 'Failed to update order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark order as paid
  const markOrderPaid = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const updatedOrder = await orderService.markPaid(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      );
      return updatedOrder;
    } catch (err) {
      setError(err.message || 'Failed to mark order as paid');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete an order (offline-first)
  const deleteOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      await orderService.delete(orderId);
      // Update local state
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      // Clear selected order if it's the one being deleted
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedOrder]);

  // Get order by ID (from state or IndexedDB)
  const getOrderById = useCallback(async (orderId) => {
    // First check state
    const cached = orders.find((order) => order.id === orderId);
    if (cached) return cached;

    // If not in state, load from IndexedDB
    try {
      const order = await orderService.getById(orderId);
      return order;
    } catch (err) {
      console.error('Failed to get order:', err);
      return null;
    }
  }, [orders]);

  // Get order by identifier
  const getOrderByIdentifier = useCallback(async (identifier) => {
    try {
      const order = await orderService.getByIdentifier(identifier);
      return order;
    } catch (err) {
      console.error('Failed to get order by identifier:', err);
      return null;
    }
  }, []);

  // Get unpaid orders
  const getUnpaidOrders = useCallback(() => {
    return orders.filter((order) => !order.paid);
  }, [orders]);

  // Get paid orders
  const getPaidOrders = useCallback(() => {
    return orders.filter((order) => order.paid);
  }, [orders]);

  // Get unsynced orders
  const getUnsyncedOrders = useCallback(() => {
    return orders.filter(
      (order) =>
        order.synced === SYNC_STATUS.PENDING ||
        order.synced === SYNC_STATUS.FAILED
    );
  }, [orders]);

  // Get synced orders
  const getSyncedOrders = useCallback(() => {
    return orders.filter((order) => order.synced === SYNC_STATUS.SYNCED);
  }, [orders]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    const result = await syncService.syncAll();
    if (result.success) {
      await loadOrders();
    }
    return result;
  }, [loadOrders]);

  // Get sync metadata
  const getSyncMetadata = useCallback(async () => {
    return syncService.getSyncMetadata();
  }, []);

  // Cancel an order (mark as cancelled - different from delete)
  const cancelOrder = useCallback(async (orderId) => {
    return updateOrder(orderId, { cancelled: true, cancelledAt: Date.now() });
  }, [updateOrder]);

  const value = {
    // State
    orders,
    loading,
    error,
    selectedOrder,
    syncStatus,

    // Actions
    setSelectedOrder,
    fetchOrders,
    loadOrders,
    createOrder,
    updateOrder,
    markOrderPaid,
    deleteOrder,
    cancelOrder,

    // Queries
    getOrderById,
    getOrderByIdentifier,
    getUnpaidOrders,
    getPaidOrders,
    getUnsyncedOrders,
    getSyncedOrders,

    // Sync
    triggerSync,
    getSyncMetadata,

    // Enums
    SYNC_STATUS,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext;
