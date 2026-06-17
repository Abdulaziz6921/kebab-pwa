/**
 * Settings Context — App-wide settings from IndexedDB
 *
 * Settings are the SINGLE SOURCE OF TRUTH for:
 * - Kebab prices (used in order calculations)
 * - Locations (shown in NewOrder screen)
 *
 * Flow:
 * 1. On app start: Load from IndexedDB → expose via context
 * 2. On settings change: Save to IndexedDB → update context → sync to Firestore
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { settingsDB, SYNC_STATUS } from "../services/indexeddb";
import { PRESET_LOCATIONS, LOC_TYPE } from "../utils/locations";
import { isFirebaseConfigured } from "../firebase";
import { db } from "../firebase/config";

const SettingsContext = createContext(undefined);

// Default kebab prices (fallback)
const DEFAULT_KEBAB_PRICES = {
  qiyma: 15000,
  mol: 20000,
  quy: 25000,
};

// Kebab type labels
export const KEBAB_TYPES = [
  { id: "qiyma", name: "Qiyma" },
  { id: "mol", name: "Mol go'shti" },
  { id: "quy", name: "Qo'y go'shti" },
];

export const SettingsProvider = ({ children }) => {
  const [kebabPrices, setKebabPricesState] = useState(() => ({
    ...DEFAULT_KEBAB_PRICES,
  }));
  const [customLocations, setCustomLocationsState] = useState([]);
  const [loading, setLoading] = useState(true);

  // All locations = preset + custom
  const allLocations = [...PRESET_LOCATIONS, ...customLocations];

  // Load settings from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const [prices, locations] = await Promise.all([
          settingsDB.getKebabPrices(),
          settingsDB.getCustomLocations(),
        ]);
        setKebabPricesState(prices);
        setCustomLocationsState(locations);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Kebab Prices ─────────────────────────────────────────────────────────

  const setKebabPrices = useCallback(async (prices) => {
    try {
      await settingsDB.setKebabPrices(prices);
      setKebabPricesState(prices);
      // Sync to Firestore in background
      if (isFirebaseConfigured()) {
        syncSettingsToFirestore({ kebabPrices: prices });
      }
    } catch (err) {
      console.error("Failed to save kebab prices:", err);
      throw err;
    }
  }, []);

  const getKebabPrice = useCallback(
    (type) => {
      return kebabPrices[type] || 0;
    },
    [kebabPrices],
  );

  // Get KEBAB_TYPES with current prices
  const getKebabTypesWithPrices = useCallback(() => {
    return KEBAB_TYPES.map((k) => ({
      ...k,
      basePrice: kebabPrices[k.id] || 0,
    }));
  }, [kebabPrices]);

  // ─── Locations ────────────────────────────────────────────────────────────

  const addCustomLocation = useCallback(
    async (loc) => {
      try {
        const newLoc = {
          id: `custom-${Date.now()}`,
          type: LOC_TYPE.CUSTOM,
          label: loc.label,
          desc: loc.desc || "",
          createdAt: Date.now(),
        };
        const updated = [...customLocations, newLoc];
        await settingsDB.setCustomLocations(updated);
        setCustomLocationsState(updated);
        if (isFirebaseConfigured()) {
          syncSettingsToFirestore({ customLocations: updated });
        }
        return newLoc;
      } catch (err) {
        console.error("Failed to add location:", err);
        throw err;
      }
    },
    [customLocations],
  );

  const deleteCustomLocation = useCallback(
    async (id) => {
      try {
        const updated = customLocations.filter((l) => l.id !== id);
        await settingsDB.setCustomLocations(updated);
        setCustomLocationsState(updated);
        if (isFirebaseConfigured()) {
          syncSettingsToFirestore({ customLocations: updated });
        }
      } catch (err) {
        console.error("Failed to delete location:", err);
        throw err;
      }
    },
    [customLocations],
  );

  const clearCustomLocations = useCallback(async () => {
    try {
      await settingsDB.setCustomLocations([]);
      setCustomLocationsState([]);
      if (isFirebaseConfigured()) {
        syncSettingsToFirestore({ customLocations: [] });
      }
    } catch (err) {
      console.error("Failed to clear locations:", err);
      throw err;
    }
  }, []);

  const value = {
    kebabPrices,
    setKebabPrices,
    getKebabPrice,
    getKebabTypesWithPrices,
    customLocations,
    allLocations,
    addCustomLocation,
    deleteCustomLocation,
    clearCustomLocations,
    loading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Background sync to Firestore
async function syncSettingsToFirestore(data) {
  try {
    if (!isFirebaseConfigured()) return;
    // Firestore settings document — single source
    const ref = db.collection("settings").doc("app");
    await ref.set(
      {
        ...data,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn("Failed to sync settings to Firestore:", err);
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
