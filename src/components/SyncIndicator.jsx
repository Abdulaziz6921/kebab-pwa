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
        <div className="fixed top-4 right-2 z-50">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M22 12a10 10 0 00-10-10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>

            <span className="text-sm font-medium">
              Ma'lumotlar sinxronlanmoqda...
            </span>
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
