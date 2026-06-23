import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { syncService } from "../services";
import { isFirebaseConfigured } from "../firebase";

const OfflineContext = createContext(undefined);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const syncIntervalRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // 1. Haqiqiy internet borligini tekshirish funksiyasi (Ping)
  const checkActualInternet = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }
    try {
      // Eng yengil va keshlanmaydigan ping so'rov
      await fetch("https://google.com", {
        mode: "no-cors",
        cache: "no-store",
      });
      setIsOnline(true);
    } catch (error) {
      // Agar brauzer onLine bo'lsa-yu, lekin fetch xato bersa — internet yo'q!
      setIsOnline(false);
    }
  }, []);

  // Tarmoq hodisalarini tinglash va interval o'rnatish
  useEffect(() => {
    const handleOnline = () => {
      console.log("Tarmoq qayta tiklandi - haqiqiy internet tekshirilmoqda...");
      checkActualInternet().then(() => triggerSync());
    };

    const handleOffline = () => {
      console.log("Tarmoq uzildi - offlayn rejimga o‘tilmoqda");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Dastlabki yuklanishda haqiqiy internetni tekshirish
    checkActualInternet();

    // Har 10 soniyada internet borligini jimgina tekshirib turish
    pingIntervalRef.current = setInterval(checkActualInternet, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [checkActualInternet]);

  // Sinxronizatsiya xizmatini ishga tushirish (Faqat isOnline o'zgarganda qayta quriladi)
  useEffect(() => {
    const init = async () => {
      const metadata = await syncService.getSyncMetadata();
      setLastSyncTime(metadata.lastSuccessfulSync);
      setPendingSyncCount(metadata.pendingCount);

      const unsubscribe = syncService.subscribe((status) => {
        setSyncInProgress(status.inProgress);

        if (status.completedAt) {
          setLastSyncTime(status.completedAt);
          setLastSyncResult(status.results);
          updatePendingCount();
        }

        if (status.failedAt) {
          setLastSyncResult({ error: status.error });
        }
      });

      if (isOnline && isFirebaseConfigured()) {
        syncIntervalRef.current = setInterval(async () => {
          const pending = await syncService.getPendingCount();
          if (pending > 0 && !syncInProgress) {
            triggerSync();
          }
        }, 30000);
      }

      return () => {
        unsubscribe();
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    };

    init();
  }, [isOnline]); // Faqat haqiqiy internet holati o'zgarganda ishlaydi

  const updatePendingCount = useCallback(async () => {
    const count = await syncService.getPendingCount();
    setPendingSyncCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      return { success: false, reason: "offline" };
    }

    if (syncInProgress) {
      return { success: false, reason: "syncing" };
    }

    setSyncInProgress(true);
    try {
      const result = await syncService.syncAll();
      setLastSyncResult(result.results);
      if (result.success) {
        setLastSyncTime(Date.now());
      }
      await updatePendingCount();
      return result;
    } catch (error) {
      console.error("Sinxronizatsiya xatosi:", error);
      setLastSyncResult({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, syncInProgress, updatePendingCount]);

  const getSyncStatus = useCallback(async () => {
    const status = syncService.getStatus();
    const metadata = await syncService.getSyncMetadata();
    return {
      ...status,
      ...metadata,
      lastSyncTime: metadata.lastSuccessfulSync,
      pendingCount: metadata.pendingCount,
    };
  }, []);

  const getConnectionQuality = useCallback(() => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (!connection) {
      return { effectiveType: "unknown", downlink: null };
    }
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      saveData: connection.saveData,
    };
  }, []);

  const shouldDeferOperations = useCallback(() => {
    if (!isOnline) return true;
    const quality = getConnectionQuality();
    return (
      quality.saveData ||
      quality.effectiveType === "slow-2g" ||
      quality.effectiveType === "2g"
    );
  }, [isOnline, getConnectionQuality]);

  const value = {
    isOnline,
    isOffline: !isOnline,
    pendingSyncCount,
    hasPendingSync: pendingSyncCount > 0,
    lastSyncTime,
    syncInProgress,
    lastSyncResult,
    triggerSync,
    getSyncStatus,
    updatePendingCount,
    getConnectionQuality,
    shouldDeferOperations,
    isConfigured: isFirebaseConfigured(),
  };

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
};

export default OfflineContext;
