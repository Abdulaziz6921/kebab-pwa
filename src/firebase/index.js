// Firebase barrel export
export {
  initializeFirebase,
  getFirebaseApp,
  getFirestoreDB,
  getFirebaseAuth,
  isFirebaseConfigured,
  COLLECTIONS,
  app,
  db,
  auth,
} from "./config";

export { orderApi, customerApi } from "./firestore";
