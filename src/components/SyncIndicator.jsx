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
        message: "📱 Internet yo'q. Ma'lumotlar keyin yuboriladi.",
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
    }, 3000);

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
        <div className="fixed top-4 right-4 z-[99998] animate-in slide-in-from-top duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl text-white max-w-md ${
              notification.type === "offline" ? "bg-red-500" : "bg-amber-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SyncIndicator;
