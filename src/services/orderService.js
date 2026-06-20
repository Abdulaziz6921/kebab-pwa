/**
 * Order Service — Offline-first
 *
 * Critical rule: IndexedDB writes MUST complete and return before any
 * Firestore operation is attempted. Firestore is background-only.
 *
 * Flow:
 *   1. Write to IndexedDB  ← returns here (< 10ms)
 *   2. Firestore sync      ← fire-and-forget, never awaited on critical path
 */
import { orderDB, syncQueueDB, SYNC_STATUS } from "./indexeddb";
import { orderApi, isFirebaseConfigured } from "../firebase";
import { generateId, generateOrderNumber } from "../utils/helpers";

// Fire-and-forget wrapper — NEVER throws to caller
const syncInBackground = (fn) => {
  Promise.resolve()
    .then(fn)
    .catch((err) =>
      console.warn(
        "[sync] Background Firestore operation failed, will retry:",
        err.message,
      ),
    );
};

export const orderService = {
  // ── Create ─────────────────────────────────────────────────────────────────
  async create(orderData) {
    const timestamp = Date.now();
    const id = generateId();
    const identifier = orderData.identifier || generateOrderNumber("ORD");

    if (!orderData.description) {
      throw new Error("Order description is required");
    }

    const quantity = orderData.quantity || 1;
    const unitPrice = orderData.unitPrice || 0;
    const totalPrice = orderData.totalPrice || quantity * unitPrice;

    // Preserve ALL extra fields (customerName, locationType, locationLabel, etc.)
    const order = {
      ...orderData,
      id,
      identifier,
      quantity,
      unitPrice,
      totalPrice,
      paid: false,
      synced: SYNC_STATUS.PENDING,
      createdAt: timestamp,
      updatedAt: timestamp,
      paidAt: null,
      isDebt: orderData.isDebt || false,
    };

    // STEP 1: Write to IndexedDB — guaranteed, no network needed
    await orderDB.saveOrder(order);
    await syncQueueDB.addToQueue(id, "create", order);

    // STEP 2: Background Firestore sync — non-blocking, fire-and-forget
    if (isFirebaseConfigured()) {
      syncInBackground(() => this.syncOrder(id));
    }

    return order; // returns immediately after IndexedDB write
  },

  // ── Update ──────────────────────────────────────────────────────────────
  async update(id, updates) {
    const existing = await orderDB.getOrder(id);
    if (!existing) throw new Error(`Order ${id} not found`);

    // 1. O'zgartirib bo'lmaydigan maydonlarni tozalash
    const protectedFields = ["id", "identifier", "createdAt"];
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates || {}).filter(
        ([k]) => !protectedFields.includes(k),
      ),
    );

    // 2. 🌟 ENG ASOSIY TUZATISH: updates va updates.items borligini qat'iy tekshiramiz
    if (updates && "items" in updates && Array.isArray(updates.items)) {
      filteredUpdates.items = updates.items;

      if (updates.totalPrice === undefined) {
        filteredUpdates.totalPrice = updates.items.reduce(
          (sum, item) =>
            sum +
            Number(item.quantity || 0) *
              Number(item.unitPrice || item.price || 0),
          0,
        );
      }

      if (updates.quantity === undefined) {
        filteredUpdates.quantity = updates.items.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        );
      }
    }
    // 3. Agar items bo'lmasa (To'landi yoki Nasiya qilinganda xatolik bermasligi uchun):
    else {
      // items o'zgarmagani uchun filteredUpdates ichidan uni butunlay o'chirib tashlaymiz,
      // toki orqa fondagi boshqa funksiyalar uni "iterable" (aylanmoqchi) qila olmasin.
      delete filteredUpdates.items;

      if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
        filteredUpdates.totalPrice =
          (updates.quantity ?? existing.quantity) *
          (updates.unitPrice ?? existing.unitPrice);
      }
    }

    // STEP 1: Write to IndexedDB
    await orderDB.updateOrder(id, {
      ...filteredUpdates,
      synced: SYNC_STATUS.PENDING,
      updatedAt: Date.now(),
    });

    // Sinxronizatsiya navbatiga ham faqat tozalangan filteredUpdates yuboriladi
    await syncQueueDB.addToQueue(id, "update", { id, ...filteredUpdates });

    // STEP 2: Background Firestore sync
    if (isFirebaseConfigured()) {
      syncInBackground(() => this.syncOrder(id));
    }

    return orderDB.getOrder(id);
  },

  // ── Mark paid ──────────────────────────────────────────────────────────────
  async markPaid(id) {
    return this.update(id, { paid: true, paidAt: Date.now() });
  },

  // ── Delete ─────────────────────────────────────────────────────────────────
  async delete(id) {
    const existing = await orderDB.getOrder(id);
    if (!existing) throw new Error(`Order ${id} not found`);

    // STEP 1: Remove from IndexedDB immediately
    await orderDB.deleteOrder(id);
    await syncQueueDB.removeByOrderId(id);

    // STEP 2: Background Firestore deletion
    if (existing.synced === SYNC_STATUS.SYNCED && isFirebaseConfigured()) {
      syncInBackground(() => orderApi.delete(id));
    }

    return true;
  },

  // ── Read ───────────────────────────────────────────────────────────────────
  async getById(id) {
    return orderDB.getOrder(id);
  },
  async getByIdentifier(id) {
    return orderDB.getOrderByIdentifier(id);
  },
  async getAll() {
    return orderDB.getAllOrders();
  },
  async getUnpaid() {
    return (await this.getAll()).filter((o) => !o.paid);
  },
  async getPaid() {
    return (await this.getAll()).filter((o) => o.paid);
  },
  async getUnsyncedCount() {
    return orderDB.getPendingSyncCount();
  },

  // ── Firestore sync (called by syncService, never on UI critical path) ──────
  async syncOrder(id) {
    const order = await orderDB.getOrder(id);
    if (!order) throw new Error(`Order ${id} not found`);

    await orderDB.markOrderSyncing(id);

    try {
      const remote = await orderApi.getByIdentifier(order.identifier);
      if (remote) {
        await orderApi.update(remote.id, {
          description: order.description,
          location: order.location,
          quantity: order.quantity,
          unitPrice: order.unitPrice || 0,
          totalPrice: order.totalPrice,
          paid: order.paid,
          paidAt: order.paidAt,

          // ─── 🌟 ENGI MUHIM TUZATISH: isDebt maydonini Firebase-ga yuboramiz ───
          isDebt: order.isDebt || false,

          // Extended fields
          customerName: order.customerName || "",
          customerId: order.customerId || "",
          locationType: order.locationType || "",
          locationLabel: order.locationLabel || "",
          locationDesc: order.locationDesc || "",
          tavsif: order.tavsif || "",

          // Kechagi tuzatilgan items qismi
          items:
            order.items && Array.isArray(order.items)
              ? order.items.map((item) => ({
                  kebabType: item.kebabType || "",
                  kebabName: item.kebabName || "",
                  quantity: Number(item.quantity || 0),
                  unitPrice: Number(item.unitPrice || 0),
                }))
              : [],
        });
      } else {
        await orderApi.create(order);
      }

      await orderDB.markOrderSynced(id);
      await syncQueueDB.removeByOrderId(id);
    } catch (error) {
      await orderDB.markOrderSyncFailed(id);
      const entries = await syncQueueDB.getQueueByOrderId(id);
      for (const entry of entries) {
        await syncQueueDB.incrementRetry(entry.id, error);
      }
      throw error;
    }
  },

  // ── Pull from Firestore (background on reconnect) ─────────────────────────
  async pullRemoteOrders() {
    if (!isFirebaseConfigured()) return [];

    try {
      const remoteOrders = await orderApi.getAll();
      for (const remoteOrder of remoteOrders) {
        const local = await orderDB.getOrder(remoteOrder.id);
        if (!local) {
          await orderDB.saveOrder({
            ...remoteOrder,
            synced: SYNC_STATUS.SYNCED,
          });
        } else if (remoteOrder.updatedAt > local.updatedAt) {
          await orderDB.saveOrder({
            ...remoteOrder,
            synced: SYNC_STATUS.SYNCED,
          });
        }
      }
      return remoteOrders;
    } catch (error) {
      console.error("Failed to pull remote orders:", error);
      throw error;
    }
  },
};

export default orderService;
