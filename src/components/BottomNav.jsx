import { NavLink, useLocation } from "react-router-dom";

// SVG icons matching the image
const OrdersIcon = ({ active }) => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);

const HistoryIcon = ({ active }) => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const StatisticsIcon = ({ active }) => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const SettingsIcon = ({ active }) => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const NAV_ITEMS = [
  { path: "/orders", label: "Buyurtmalar", Icon: OrdersIcon },
  { path: "/history", label: "Hisobot", Icon: HistoryIcon },
  { path: "/statistics", label: "Statistika", Icon: StatisticsIcon },
  { path: "/settings", label: "Sozlamalar", Icon: SettingsIcon },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around items-end h-16">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive =
            location.pathname === path ||
            location.pathname.startsWith(path + "/");

          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center justify-end pb-2 min-w-[56px]"
            >
              <span
                className={
                  isActive
                    ? "text-primary-500"
                    : "text-gray-400 dark:text-gray-500"
                }
              >
                <Icon active={isActive} />
              </span>
              <span
                className={`text-xs mt-1 font-medium ${
                  isActive
                    ? "text-primary-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
