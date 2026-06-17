/**
 * Customer Service — Offline-first
 *
 * All reads and writes go to IndexedDB immediately.
 * Firestore is used only for background cloud backup/sync.
 * Works in airplane mode. Syncs when connectivity is restored.
 */
import { customerDB, SYNC_STATUS } from './indexeddb';
import { customerApi, isFirebaseConfigured } from '../firebase';

export const customerService = {
  // ── Read ───────────────────────────────────────────────────────────────────

  async getAll() {
    const all = await customerDB.getAllCustomers();
    return all
      .filter(c => !c.deleted)
      .sort((a, b) => (b.is_favorite - a.is_favorite) || a.name.localeCompare(b.name));
  },

  // ── Write (IndexedDB first, always <100ms) ────────────────────────────────

  async create(name) {
    const customer = await customerDB.createCustomer({ name });
    // Background sync — non-blocking
    if (navigator.onLine && isFirebaseConfigured()) {
      this._syncCustomer(customer.id).catch(() => {});
    }
    return customer;
  },

  async update(id, updates) {
    const updated = await customerDB.updateCustomer(id, updates);
    if (navigator.onLine && isFirebaseConfigured()) {
      this._syncCustomer(id).catch(() => {});
    }
    return updated;
  },

  async delete(id) {
    // Soft-delete so Firestore can be notified later
    await customerDB.softDeleteCustomer(id);
    if (navigator.onLine && isFirebaseConfigured()) {
      this._deleteFromFirestore(id).catch(() => {});
    }
    return true;
  },

  // ── Sync helpers (called internally + from syncService) ──────────────────

  async _syncCustomer(id) {
    const customer = await customerDB.getCustomer(id);
    if (!customer || customer.deleted) return;

    try {
      const remote = await customerApi.getById(id);
      if (remote) {
        await customerApi.update(id, {
          name:        customer.name,
          is_favorite: customer.is_favorite,
          updatedAt:   customer.updatedAt,
        });
      } else {
        await customerApi.create(customer);
      }
      await customerDB.markCustomerSynced(id);
    } catch {
      await customerDB.markCustomerSyncFailed(id);
    }
  },

  async _deleteFromFirestore(id) {
    try {
      await customerApi.delete(id);
      // Hard-delete local soft-deleted record after Firestore confirms
      await customerDB.deleteCustomer(id);
    } catch {
      // Keep the soft-delete record; retry next time
    }
  },

  // ── Called by syncService on reconnect ────────────────────────────────────

  async syncAll() {
    if (!navigator.onLine || !isFirebaseConfigured()) return;

    // Push unsynced customers
    const unsynced = await customerDB.getUnsyncedCustomers();
    for (const c of unsynced) {
      await this._syncCustomer(c.id).catch(() => {});
    }

    // Push pending deletions
    const deletions = await customerDB.getPendingDeletions();
    for (const c of deletions) {
      await this._deleteFromFirestore(c.id).catch(() => {});
    }
  },

  async pullFromFirestore() {
    if (!navigator.onLine || !isFirebaseConfigured()) return;
    try {
      const remoteCustomers = await customerApi.getAll();
      for (const remote of remoteCustomers) {
        const local = await customerDB.getCustomer(remote.id);
        if (!local) {
          // New customer from another device
          await customerDB.saveCustomer({
            ...remote,
            deleted:   false,
            deletedAt: null,
            synced:    SYNC_STATUS.SYNCED,
          });
        }
        // If local exists and is synced, skip (don't overwrite local edits)
      }
    } catch (error) {
      console.warn('Failed to pull customers from Firestore:', error.message);
    }
  },
};

export default customerService;
