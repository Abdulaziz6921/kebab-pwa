import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDB, isFirebaseConfigured, COLLECTIONS } from './config';

// Helper to convert Firestore timestamp to JS timestamp
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }
  if (timestamp?.seconds) {
    return timestamp.seconds * 1000;
  }
  return timestamp;
};

// Helper to convert JS timestamp to Firestore timestamp
const toFirestoreTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) return timestamp;
  return Timestamp.fromMillis(timestamp);
};

// Convert order data for Firestore (JS timestamp -> Firestore timestamp)
const orderToFirestore = (order) => {
  return {
    ...order,
    createdAt: toFirestoreTimestamp(order.createdAt) || serverTimestamp(),
    updatedAt: serverTimestamp(),
    paidAt: order.paidAt ? toFirestoreTimestamp(order.paidAt) : null,
  };
};

// Convert order data from Firestore (Firestore timestamp -> JS timestamp)
const orderFromFirestore = (id, data) => {
  if (!data) return null;
  return {
    ...data,
    id,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    paidAt: convertTimestamp(data.paidAt),
  };
};

// Order API - Firestore operations
export const orderApi = {
  // Get all orders
  async getAll() {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    const db = getFirestoreDB();
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => orderFromFirestore(doc.id, doc.data()));
  },

  // Get order by ID
  async getById(id) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    const db = getFirestoreDB();
    const docRef = doc(db, COLLECTIONS.ORDERS, id);
    const snapshot = await getDoc(docRef);

    return orderFromFirestore(id, snapshot.data());
  },

  // Get order by identifier
  async getByIdentifier(identifier) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    const db = getFirestoreDB();
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, where('identifier', '==', identifier), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return orderFromFirestore(doc.id, doc.data());
  },

  // Create order
  async create(orderData) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    const db = getFirestoreDB();
    const docRef = doc(db, COLLECTIONS.ORDERS, orderData.id);

    // Check for duplicate
    const existing = await this.getByIdentifier(orderData.identifier);
    if (existing) {
      throw new Error(`Order with identifier ${orderData.identifier} already exists`);
    }

    const firestoreData = orderToFirestore(orderData);
    await setDoc(docRef, {
      ...firestoreData,
      synced: true,
    });

    return this.getById(orderData.id);
  },

  // Update order
  async update(id, updates) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    const db = getFirestoreDB();
    const docRef = doc(db, COLLECTIONS.ORDERS, id);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      synced: true,
    };

    await updateDoc(docRef, updateData);
    return this.getById(id);
  },

  // Delete order
  async delete(id) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    const db = getFirestoreDB();
    const docRef = doc(db, COLLECTIONS.ORDERS, id);
    await deleteDoc(docRef);
    return true;
  },

  // Subscribe to realtime updates
  subscribe(callback) {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured, skipping subscription');
      return () => {};
    }

    const db = getFirestoreDB();
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const order = orderFromFirestore(change.doc.id, change.doc.data());
        callback({
          type: change.type, // 'added', 'modified', 'removed'
          order,
        });
      });
    });

    return unsubscribe;
  },
};

// Customer API — Firestore operations (cloud backup only)
export const customerApi = {
  async getAll() {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    const db = getFirestoreDB();
    const ref = collection(db, COLLECTIONS.CUSTOMERS);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  },

  async getById(id) {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    const db  = getFirestoreDB();
    const ref = doc(db, COLLECTIONS.CUSTOMERS, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { ...snap.data(), id };
  },

  async create(customerData) {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    const db  = getFirestoreDB();
    const ref = doc(db, COLLECTIONS.CUSTOMERS, customerData.id);
    await setDoc(ref, {
      name:        customerData.name,
      is_favorite: customerData.is_favorite || false,
      createdAt:   toFirestoreTimestamp(customerData.createdAt) || serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });
    return customerData;
  },

  async update(id, updates) {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    const db  = getFirestoreDB();
    const ref = doc(db, COLLECTIONS.CUSTOMERS, id);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return { id, ...updates };
  },

  async delete(id) {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    const db  = getFirestoreDB();
    const ref = doc(db, COLLECTIONS.CUSTOMERS, id);
    await deleteDoc(ref);
    return true;
  },
};

export default {
  orderApi,
  customerApi,
  COLLECTIONS,
  isFirebaseConfigured,
};
