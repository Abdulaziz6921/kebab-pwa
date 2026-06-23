import { useOffline } from "../contexts";
import { useEffect, useState } from "react";

const SyncIndicator = () => {
  const { isOnline, pendingSyncCount, syncInProgress } = useOffline();

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (syncInProgress) return;

    if (!isOnline) {
      setNotification({
        type: "offline",
        message: "📴 Internet yo'q. Ma'lumotlar keyin yuboriladi.",
      });
    } else if (pendingSyncCount > 0) {
      setNotification({
        type: "pending",
        message: `📤 ${pendingSyncCount} ta buyurtma sinxronlanishni kutmoqda`,
      });
    } else {
      setNotification(null);
      return;
    }

    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOnline, pendingSyncCount, syncInProgress]);

  return (
    <>
      {/* Full Screen Loader */}
      {isOnline && syncInProgress && (
        <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center">
            <div className="w-14 h-14 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />

            <h2 className="mt-5 text-lg font-semibold text-gray-800 dark:text-white">
              Ma'lumotlar yuklanmoqda...
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Iltimos kuting
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm sm:max-w-full z-[99998] animate-in slide-in-from-top duration-300">
          <div
            className={`px-4 py-3.5 rounded-2xl shadow-2xl text-white backdrop-blur-md bg-opacity-95 ${
              notification.type === "offline"
                ? "bg-red-500 shadow-red-500/20"
                : "bg-amber-500 shadow-amber-500/20"
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-center">
              <span className="text-sm font-bold tracking-wide active:scale-95 transition-transform">
                {notification.message}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SyncIndicator;
