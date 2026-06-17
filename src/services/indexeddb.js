import { openDB } from "idb";

const DB_NAME = "restaurant-order-tracker";
const DB_VERSION = 4; // v4 adds settings store

// Store names
export const STORES = {
  ORDERS: "orders",
  SYNC_QUEUE: "syncQueue",
  SYNC_METADATA: "syncMetadata",
  CUSTOMERS: "customers",
  SETTINGS: "settings",
};

// Sync status enum
export const SYNC_STATUS = {
  PENDING: "pending",
  SYNCING: "syncing",
  SYNCED: "synced",
  FAILED: "failed",
};

// Order status enum
export const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Initialize the database — non-destructive migrations
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Orders store (create if missing — never drop to preserve data)
      if (!db.objectStoreNames.contains(STORES.ORDERS)) {
        const s = db.createObjectStore(STORES.ORDERS, { keyPath: "id" });
        s.createIndex("identifier", "identifier", { unique: true });
        s.createIndex("synced", "synced", { unique: false });
        s.createIndex("paid", "paid", { unique: false });
        s.createIndex("createdAt", "createdAt", { unique: false });
        s.createIndex("paidAt", "paidAt", { unique: false });
      }

      // Sync queue
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const s = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: "id",
          autoIncrement: true,
        });
        s.createIndex("timestamp", "timestamp", { unique: false });
        s.createIndex("orderId", "orderId", { unique: false });
        s.createIndex("operation", "operation", { unique: false });
        s.createIndex("retries", "retries", { unique: false });
      }

      // Sync metadata
      if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
        db.createObjectStore(STORES.SYNC_METADATA, { keyPath: "key" });
      }

      // Customers store (v3 addition)
      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        const s = db.createObjectStore(STORES.CUSTOMERS, { keyPath: "id" });
        s.createIndex("name", "name", { unique: false });
        s.createIndex("is_favorite", "is_favorite", { unique: false });
        s.createIndex("synced", "synced", { unique: false });
        s.createIndex("createdAt", "createdAt", { unique: false });
        s.createIndex("deleted", "deleted", { unique: false });
      }

      // Settings store (v4 addition) — key-value pairs for app configuration
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
      }
    },
  });
};

// Generic CRUD operations
export const dbOperations = {
  async get(storeName, key) {
    const db = await initDB();
    return db.get(storeName, key);
  },

  async getAll(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },

  async getAllByIndex(storeName, indexName, value) {
    const db = await initDB();
    return db.getAllFromIndex(storeName, indexName, value);
  },

  async getOneByIndex(storeName, indexName, value) {
    const db = await initDB();
    return db.getFromIndex(storeName, indexName, value);
  },

  async put(storeName, data) {
    const db = await initDB();
    return db.put(storeName, data);
  },

  async putAll(storeName, dataArray) {
    const db = await initDB();
    const tx = db.transaction(storeName, "readwrite");
    await Promise.all([
      ...dataArray.map((item) => tx.store.put(item)),
      tx.done,
    ]);
  },

  async delete(storeName, key) {
    const db = await initDB();
    return db.delete(storeName, key);
  },

  async clear(storeName) {
    const db = await initDB();
    return db.clear(storeName);
  },

  async count(storeName) {
    const db = await initDB();
    return db.count(storeName);
  },
};

// Order-specific operations
export const orderDB = {
  async getOrder(id) {
    return dbOperations.get(STORES.ORDERS, id);
  },

  async getOrderByIdentifier(identifier) {
    return dbOperations.getOneByIndex(STORES.ORDERS, "identifier", identifier);
  },

  async getAllOrders() {
    return dbOperations.getAll(STORES.ORDERS);
  },

  async getUnsyncedOrders() {
    return dbOperations.getAllByIndex(
      STORES.ORDERS,
      "synced",
      SYNC_STATUS.PENDING,
    );
  },

  async getFailedSyncOrders() {
    return dbOperations.getAllByIndex(
      STORES.ORDERS,
      "synced",
      SYNC_STATUS.FAILED,
    );
  },

  async getPaidOrders() {
    return dbOperations.getAllByIndex(STORES.ORDERS, "paid", true);
  },

  async getUnpaidOrders() {
    return dbOperations.getAllByIndex(STORES.ORDERS, "paid", false);
  },

  async saveOrder(order) {
    const existing = await this.getOrderByIdentifier(order.identifier);
    if (existing && existing.id !== order.id) {
      throw new Error(
        `Order with identifier ${order.identifier} already exists`,
      );
    }
    return dbOperations.put(STORES.ORDERS, order);
  },

  async createOrder(orderData) {
    const timestamp = Date.now();
    const order = {
      ...orderData,
      id:
        orderData.id ||
        `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      synced: SYNC_STATUS.PENDING,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.saveOrder(order);
  },

  async updateOrder(id, updates) {
    const existing = await this.getOrder(id);
    if (!existing) throw new Error(`Order ${id} not found`);
    const updated = {
      ...existing,
      ...updates,
      synced:
        updates.synced !== undefined ? updates.synced : SYNC_STATUS.PENDING,
      updatedAt: Date.now(),
    };
    return this.saveOrder(updated);
  },

  async markOrderPaid(id) {
    return this.updateOrder(id, { paid: true, paidAt: Date.now() });
  },

  async markOrderSynced(id) {
    return this.updateOrder(id, { synced: SYNC_STATUS.SYNCED });
  },

  async markOrderSyncFailed(id) {
    return this.updateOrder(id, { synced: SYNC_STATUS.FAILED });
  },

  async markOrderSyncing(id) {
    return this.updateOrder(id, { synced: SYNC_STATUS.SYNCING });
  },

  async deleteOrder(id) {
    return dbOperations.delete(STORES.ORDERS, id);
  },

  async getPendingSyncCount() {
    const all = await this.getAllOrders();
    return all.filter(
      (o) =>
        o.synced === SYNC_STATUS.PENDING || o.synced === SYNC_STATUS.FAILED,
    ).length;
  },
};

// Customer-specific operations (offline-first)
export const customerDB = {
  async getCustomer(id) {
    return dbOperations.get(STORES.CUSTOMERS, id);
  },

  async getAllCustomers() {
    return dbOperations.getAll(STORES.CUSTOMERS);
  },

  async getActiveCustomers() {
    const all = await this.getAllCustomers();
    return all.filter((c) => !c.deleted);
  },

  async getUnsyncedCustomers() {
    const all = await this.getActiveCustomers();
    return all.filter((c) => c.synced !== SYNC_STATUS.SYNCED);
  },

  async getPendingDeletions() {
    const all = await this.getAllCustomers();
    return all.filter((c) => c.deleted && c.synced !== SYNC_STATUS.SYNCED);
  },

  async saveCustomer(customer) {
    return dbOperations.put(STORES.CUSTOMERS, customer);
  },

  async createCustomer(data) {
    const timestamp = Date.now();
    const customer = {
      id: `cust-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name.trim(),
      is_favorite: data.is_favorite || false,
      deleted: false,
      deletedAt: null,
      synced: SYNC_STATUS.PENDING,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.saveCustomer(customer);
    return customer;
  },

  async updateCustomer(id, updates) {
    const existing = await this.getCustomer(id);
    if (!existing) throw new Error(`Customer ${id} not found`);
    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
      // Only reset synced to PENDING if no explicit synced value given
      synced:
        updates.synced !== undefined ? updates.synced : SYNC_STATUS.PENDING,
    };
    await this.saveCustomer(updated);
    return updated;
  },

  async deleteCustomer(id) {
    return dbOperations.delete(STORES.CUSTOMERS, id);
  },

  async softDeleteCustomer(id) {
    return this.updateCustomer(id, {
      deleted: true,
      deletedAt: Date.now(),
      synced: SYNC_STATUS.PENDING,
    });
  },

  async markCustomerSynced(id) {
    return this.updateCustomer(id, { synced: SYNC_STATUS.SYNCED });
  },

  async markCustomerSyncFailed(id) {
    return this.updateCustomer(id, { synced: SYNC_STATUS.FAILED });
  },
};

// Sync queue operations
export const syncQueueDB = {
  async addToQueue(orderId, operation, data) {
    const entry = {
      orderId,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
      lastError: null,
    };
    return dbOperations.put(STORES.SYNC_QUEUE, entry);
  },

  async getQueue() {
    return dbOperations.getAll(STORES.SYNC_QUEUE);
  },

  async getQueueByOrderId(orderId) {
    return dbOperations.getAllByIndex(STORES.SYNC_QUEUE, "orderId", orderId);
  },

  async getQueueEntry(id) {
    return dbOperations.get(STORES.SYNC_QUEUE, id);
  },

  async removeFromQueue(id) {
    return dbOperations.delete(STORES.SYNC_QUEUE, id);
  },

  async removeByOrderId(orderId) {
    const entries = await this.getQueueByOrderId(orderId);
    for (const entry of entries) {
      await this.removeFromQueue(entry.id);
    }
  },

  async incrementRetry(id, error) {
    const entry = await this.getQueueEntry(id);
    if (entry) {
      entry.retries = (entry.retries || 0) + 1;
      entry.lastError = error?.message || "Unknown error";
      entry.lastAttempt = Date.now();
      return dbOperations.put(STORES.SYNC_QUEUE, entry);
    }
  },

  async getRetryableEntries(maxRetries = 5) {
    const all = await this.getQueue();
    return all.filter((e) => e.retries < maxRetries);
  },

  async clearQueue() {
    return dbOperations.clear(STORES.SYNC_QUEUE);
  },

  async getQueueCount() {
    const all = await this.getQueue();
    return all.length;
  },
};

// Sync metadata operations
export const syncMetadataDB = {
  async getMetadata(key) {
    const result = await dbOperations.get(STORES.SYNC_METADATA, key);
    return result?.value;
  },

  async setMetadata(key, value) {
    return dbOperations.put(STORES.SYNC_METADATA, { key, value });
  },

  async getLastSyncTime() {
    return this.getMetadata("lastSyncTime");
  },

  async setLastSyncTime(timestamp) {
    return this.setMetadata("lastSyncTime", timestamp);
  },

  async getLastSuccessfulSync() {
    return this.getMetadata("lastSuccessfulSync");
  },

  async setLastSuccessfulSync(timestamp) {
    return this.setMetadata("lastSuccessfulSync", timestamp);
  },
};

// Settings operations (key-value store for app configuration)
export const settingsDB = {
  async getSetting(key) {
    const result = await dbOperations.get(STORES.SETTINGS, key);
    return result?.value;
  },

  async setSetting(key, value) {
    return dbOperations.put(STORES.SETTINGS, {
      key,
      value,
      updatedAt: Date.now(),
    });
  },

  async getAllSettings() {
    const all = await dbOperations.getAll(STORES.SETTINGS);
    // Convert array of {key, value} to object
    return all.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  },

  // Kebab prices
  async getKebabPrices() {
    const prices = await this.getSetting("kebabPrices");
    return prices || { qiyma: 15000, mol: 20000, quy: 25000 };
  },

  async setKebabPrices(prices) {
    return this.setSetting("kebabPrices", prices);
  },

  // Custom locations (beyond presets)
  async getCustomLocations() {
    const locs = await this.getSetting("customLocations");
    return locs || [];
  },

  async setCustomLocations(locations) {
    return this.setSetting("customLocations", locations);
  },

  // All locations (preset + custom)
  async getAllLocations() {
    const custom = await this.getCustomLocations();
    // Import presets — cannot use static import at service layer
    const { PRESET_LOCATIONS } = await import("../utils/locations.js");
    return [...PRESET_LOCATIONS, ...custom];
  },
};

export default {
  initDB,
  STORES,
  SYNC_STATUS,
  ORDER_STATUS,
  dbOperations,
  orderDB,
  customerDB,
  syncQueueDB,
  syncMetadataDB,
};
