import { orderDB, syncQueueDB, syncMetadataDB, SYNC_STATUS } from './indexeddb';
import { orderApi, isFirebaseConfigured } from '../firebase';
import { orderService } from './orderService';
import { customerService } from './customerService';

// Sync configuration
const SYNC_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_DELAY_BASE: 1000,
  MAX_RETRY_DELAY: 30000,
  BATCH_SIZE: 10,
};

// Sync state
let syncInProgress = false;
let lastSyncAttempt = null;
let syncListeners = [];

/**
 * Sync Service - Automatic sync with retry logic
 *
 * Features:
 * - Automatic sync when online
 * - Exponential backoff for retries
 * - Batch processing
 * - Never loses data
 */
export const syncService = {
  /**
   * Initialize sync service
   */
  init() {
    // Listen for online event
    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...');
      this.syncAll();
    });

    // Initial sync if online
    if (navigator.onLine && isFirebaseConfigured()) {
      console.log('App started online, performing initial sync...');
      this.syncAll();
    }

    // Subscribe to realtime changes
    this.subscribeToRemoteChanges();

    console.log('Sync service initialized');
  },

  /**
   * Subscribe to sync status changes
   */
  subscribe(callback) {
    syncListeners.push(callback);
    return () => {
      syncListeners = syncListeners.filter(l => l !== callback);
    };
  },

  /**
   * Notify listeners
   */
  notifyListeners(status) {
    syncListeners.forEach(callback => {
      try {
        callback(status);
      } catch (e) {
        console.error('Sync listener error:', e);
      }
    });
  },

  /**
   * Get current sync status
   */
  getStatus() {
    return {
      inProgress: syncInProgress,
      lastAttempt: lastSyncAttempt,
      isOnline: navigator.onLine,
      isConfigured: isFirebaseConfigured(),
    };
  },

  /**
   * Sync all pending orders
   */
  async syncAll() {
    if (syncInProgress) {
      console.log('Sync already in progress');
      return { success: false, reason: 'already_syncing' };
    }

    if (!navigator.onLine) {
      console.log('Offline, cannot sync');
      return { success: false, reason: 'offline' };
    }

    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, skipping sync');
      return { success: false, reason: 'not_configured' };
    }

    syncInProgress = true;
    lastSyncAttempt = Date.now();
    this.notifyListeners({ inProgress: true, startedAt: lastSyncAttempt });

    const results = {
      pulled: 0,
      pushed: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Step 1: Pull remote changes
      console.log('Pulling remote orders...');
      try {
        const pulled = await orderService.pullRemoteOrders();
        results.pulled = pulled.length;
      } catch (error) {
        console.error('Pull failed:', error);
        results.errors.push({ phase: 'pull', error: error.message });
      }

      // Step 1b: Pull + push customers
      console.log('Syncing customers...');
      try {
        await customerService.pullFromFirestore();
        await customerService.syncAll();
      } catch (error) {
        console.warn('Customer sync failed:', error.message);
        results.errors.push({ phase: 'customers', error: error.message });
      }

      // Step 2: Push local changes
      console.log('Pushing local changes...');
      const unsyncedOrders = await orderDB.getUnsyncedOrders();
      const failedSyncOrders = await orderDB.getFailedSyncOrders();
      const toSync = [...unsyncedOrders, ...failedSyncOrders];

      // Process in batches
      for (let i = 0; i < toSync.length; i += SYNC_CONFIG.BATCH_SIZE) {
        const batch = toSync.slice(i, i + SYNC_CONFIG.BATCH_SIZE);

        for (const order of batch) {
          try {
            await orderService.syncOrder(order.id);
            results.pushed++;
          } catch (error) {
            results.failed++;
            results.errors.push({ orderId: order.id, error: error.message });
            console.error(`Failed to sync order ${order.id}:`, error.message);
          }
        }
      }

      // Step 3: Process retry queue
      console.log('Processing retry queue...');
      const retryable = await syncQueueDB.getRetryableEntries(SYNC_CONFIG.MAX_RETRIES);

      for (const entry of retryable) {
        const delay = Math.min(
          SYNC_CONFIG.RETRY_DELAY_BASE * Math.pow(2, entry.retries),
          SYNC_CONFIG.MAX_RETRY_DELAY
        );

        const timeSinceLastAttempt = Date.now() - (entry.lastAttempt || entry.timestamp);

        if (timeSinceLastAttempt >= delay) {
          try {
            const order = await orderDB.getOrder(entry.orderId);
            if (order) {
              await orderService.syncOrder(order.id);
              await syncQueueDB.removeFromQueue(entry.id);
            }
          } catch (error) {
            await syncQueueDB.incrementRetry(entry.id, error);
            console.warn(`Retry ${entry.retries + 1} failed for order ${entry.orderId}`);
          }
        }
      }

      // Update metadata
      if (results.failed === 0) {
        await syncMetadataDB.setLastSuccessfulSync(Date.now());
      }
      await syncMetadataDB.setLastSyncTime(Date.now());

      console.log('Sync complete:', results);
      this.notifyListeners({
        inProgress: false,
        completedAt: Date.now(),
        results,
      });

      return { success: true, results };
    } catch (error) {
      console.error('Sync failed:', error);
      results.errors.push({ phase: 'general', error: error.message });

      this.notifyListeners({
        inProgress: false,
        failedAt: Date.now(),
        error: error.message,
      });

      return { success: false, results, error: error.message };
    } finally {
      syncInProgress = false;
    }
  },

  /**
   * Force sync specific order
   */
  async syncOrder(orderId) {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }
    return orderService.syncOrder(orderId);
  },

  /**
   * Get pending sync count
   */
  async getPendingCount() {
    const local = await orderDB.getPendingSyncCount();
    const queue = await syncQueueDB.getQueueCount();
    return Math.max(local, queue);
  },

  /**
   * Debounced sync
   */
  scheduleSync: (() => {
    let timeout = null;
    return (delay = 1000) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        syncService.syncAll();
      }, delay);
    };
  })(),

  /**
   * Subscribe to realtime changes
   */
  subscribeToRemoteChanges() {
    if (!isFirebaseConfigured()) return () => {};

    try {
      const unsubscribe = orderApi.subscribe(async (change) => {
        const { type, order } = change;

        if (type === 'added' && order) {
          const local = await orderDB.getOrder(order.id);
          if (!local) {
            await orderDB.saveOrder({
              ...order,
              synced: SYNC_STATUS.SYNCED,
            });
            console.log('Synced new remote order:', order.identifier);
          }
        } else if (type === 'modified' && order) {
          const local = await orderDB.getOrder(order.id);
          if (local && local.synced === SYNC_STATUS.SYNCED) {
            if (order.updatedAt > local.updatedAt) {
              await orderDB.saveOrder({
                ...order,
                synced: SYNC_STATUS.SYNCED,
              });
              console.log('Synced remote update:', order.identifier);
            }
          }
        } else if (type === 'removed') {
          const local = await orderDB.getOrder(order.id);
          if (local && local.synced === SYNC_STATUS.SYNCED) {
            await orderDB.deleteOrder(order.id);
            console.log('Removed deleted remote order:', order.id);
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.warn('Failed to subscribe to remote changes:', error);
      return () => {};
    }
  },

  /**
   * Get sync metadata
   */
  async getSyncMetadata() {
    const lastSync = await syncMetadataDB.getLastSyncTime();
    const lastSuccessful = await syncMetadataDB.getLastSuccessfulSync();
    const pendingCount = await this.getPendingCount();
    const queueCount = await syncQueueDB.getQueueCount();

    return {
      lastSyncTime: lastSync,
      lastSuccessfulSync: lastSuccessful,
      pendingCount,
      queueCount,
    };
  },

  /**
   * Clear sync queue
   */
  async reset() {
    await syncQueueDB.clearQueue();
    console.log('Sync queue cleared');
  },
};

export default syncService;
