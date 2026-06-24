import { useState, useMemo, useCallback } from "react";
import { useOrders } from "../contexts";
import { formatCurrency } from "../utils/formatters";
import OrderDetailsModal from "./OrderDetails";

import {
  groupOrdersByDay,
  getOrderPrimary,
  getOrderSecondary,
  dayStart,
  KEBAB_LABELS,
} from "../utils/orderDisplay";
import { LOC_TYPE } from "../utils/locations";
import {
  DoorClosed,
  CircleDot,
  CircleQuestionMark,
  User,
  Hash,
  Home,
  X,
  Search,
  Calendar,
  ChevronDown,
  Pause,
} from "lucide-react";

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronIcon = ({ down }) => (
  <ChevronDown
    size={20}
    className={`transition-transform duration-200 ${down ? "rotate-180" : ""}`}
  />
);

// ─── Location / person icon (small) ──────────────────────────────────────────

function OrderTypeIcon({ order }) {
  const cls = "w-full h-full";

  if (order.customerName || order.customerId) {
    return <User className={cls} />;
  }

  switch (order.locationType) {
    case LOC_TYPE.PARALLEL:
      return <Pause className={cls} />;

    case LOC_TYPE.HASH:
      return <Hash className={cls} />;
    case LOC_TYPE.ORQASI:
      return <CircleDot className={cls} />;

    case LOC_TYPE.HOVLI:
      return <Home className={cls} />; //

    case LOC_TYPE.XONA:
      return <DoorClosed className={cls} />;
    default:
      return <CircleQuestionMark className={cls} />;
  }
}

function getIconStyle(order) {
  if (order.customerName || order.customerId)
    return "bg-navy-100 text-navy-500";
  switch (order.locationType) {
    case LOC_TYPE.PARALLEL:
      return "bg-green-100 text-green-600";
    case LOC_TYPE.HASH:
      return "bg-orange-100 text-orange-600";
    case LOC_TYPE.HOVLI:
      return "bg-green-100 text-green-600";
    case LOC_TYPE.XONA:
      return "bg-blue-100 text-blue-600";
    default:
      return "bg-orange-50 text-primary-500";
  }
}

// ─── Day Group Card ────────────────────────────────────────────────────────────
function DayGroup({ group, searchQuery, onOrderClick }) {
  const [expanded, setExpanded] = useState(false);

  const filteredOrders = searchQuery
    ? group.orders.filter((o) => {
        const q = searchQuery.toLowerCase();
        return (
          getOrderPrimary(o).toLowerCase().includes(q) ||
          (o.tavsif || "").toLowerCase().includes(q) ||
          (o.items?.length
            ? o.items.some((item) =>
                (item.kebabName || "").toLowerCase().includes(q),
              )
            : (KEBAB_LABELS[o.kebabType] || "").toLowerCase().includes(q))
        );
      })
    : group.orders;

  const visibleOrders = [...filteredOrders].sort((a, b) => {
    const timeA = a.paid ? a.paidAt : a.createdAt;
    const timeB = b.paid ? b.paidAt : b.createdAt;
    return timeA - timeB; // Eski vaqtlar tepaga chiqadi
  });

  if (searchQuery && visibleOrders.length === 0) return null;

  const formatTime = (ts) =>
    new Intl.DateTimeFormat("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(ts));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Day header */}
      <button
        className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <Calendar />
          <span className="font-bold text-navy-900 dark:text-white text-base">
            {group.label}
          </span>
        </div>
        <ChevronIcon down={expanded} />
      </button>

      {/* Day stats */}
      <div className="grid grid-cols-4 gap-0 border-t border-gray-100 dark:border-gray-700">
        <StatCell
          label="Jami"
          value={group.total}
          color="text-navy-700 dark:text-gray-200"
        />
        <StatCell
          label="To'langan"
          value={group.paid}
          color="text-success-600"
        />
        <StatCell
          label="To'lanmagan"
          value={group.unpaid}
          color="text-primary-500"
        />
        <StatCell
          label="Daromad"
          value={formatCurrency(group.revenue)}
          color="text-navy-900 dark:text-white"
          small
        />
      </div>

      {/* Order list */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {visibleOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => onOrderClick(order)}
              className="w-full px-4 py-3 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700 text-left transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getIconStyle(order)}`}
              >
                <div className="w-4 h-4">
                  <OrderTypeIcon order={order} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-navy-900 dark:text-white text-sm truncate">
                  {getOrderPrimary(order)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {getOrderSecondary(order)}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-navy-900 dark:text-white">
                  {formatCurrency(order.totalPrice || 0)}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${order.paid ? "bg-success-500" : "bg-primary-400"}`}
                  />
                  <span className="text-xs text-gray-400">
                    {formatTime(order.paid ? order.paidAt : order.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, color, small }) {
  return (
    <div className="flex flex-col items-center py-2.5 px-1 border-r border-gray-100 dark:border-gray-700 last:border-r-0">
      <span
        className={`font-extrabold leading-tight text-center ${small ? "text-xs" : "text-base"} ${color}`}
      >
        {value}
      </span>
      <span className="text-xs text-gray-400 mt-0.5 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "today", label: "Bugun" },
  { id: "week", label: "Hafta" },
  { id: "month", label: "Oy" },
  { id: "all", label: "Hammasi" },
];

const History = () => {
  const { orders } = useOrders();

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);

  // ─── 🛠️ TIMEZONE-SAFE SANANI FORMATLASH (TAKRORLANISHSIZ) ───
  const getLocalDateKey = (timestamp) => {
    if (!timestamp) return "";
    let d =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    if (isNaN(d.getTime())) return "";
    const year = d.toLocaleDateString("en-US", {
      year: "numeric",
      timeZone: "Asia/Tashkent",
    });
    const month = d.toLocaleDateString("en-US", {
      month: "2-digit",
      timeZone: "Asia/Tashkent",
    });
    const day = d.toLocaleDateString("en-US", {
      day: "2-digit",
      timeZone: "Asia/Tashkent",
    });
    return `${year}-${month}-${day}`;
  };

  // 1. FILTERED ORDERS
  const filteredOrders = useMemo(() => {
    const today = dayStart(Date.now());
    const limits = { today: 0, week: 6 * 86400000, month: 29 * 86400000 };

    const limitDate = filter in limits ? today - limits[filter] : 0;
    const periodOrders = limitDate
      ? orders.filter((o) => o.createdAt >= limitDate)
      : orders;

    return periodOrders.map((o) => {
      if (o.isObed) {
        const hasNoKebab = !o.items || o.items.length === 0;
        return {
          ...o,
          quantity: hasNoKebab ? 0 : Number(o.quantity || 1),
          paid: hasNoKebab ? true : false,
          isDebt: hasNoKebab ? false : true,
          totalPrice: Number(o.totalPrice || 0),
        };
      }
      return o;
    });
  }, [orders, filter]);

  // 2. DAY GROUPS
  const dayGroups = useMemo(() => {
    const groups = groupOrdersByDay(filteredOrders);

    return groups.map((group) => {
      const firstOrder = group.orders && group.orders[0];
      const groupDateKey = firstOrder
        ? getLocalDateKey(firstOrder.createdAt)
        : getLocalDateKey(Date.now());

      // Find all obedience entries strictly for this specific day
      const dayObedOrders = filteredOrders.filter(
        (o) => o.isObed && getLocalDateKey(o.createdAt) === groupDateKey,
      );

      // Cash taken from register strictly (e.g., 5,000 or 20,000)
      const dayObedCash = dayObedOrders.reduce(
        (sum, o) => sum + (o.debtAmount || 0),
        0,
      );

      // Kebab debt eaten on this day (e.g., 15,000 or 0)
      const dayObedKebab = dayObedOrders.reduce((sum, o) => {
        return sum + ((o.totalPrice || 0) - (o.debtAmount || 0));
      }, 0);

      // Calculate gross paid revenue from real customers only (excludes obedience entries)
      const rawPaidRevenue = group.orders
        .filter((o) => o.paid && !o.isObed)
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      // Exclude lunch-only entries from this day's count metrics
      const realDayOrders = group.orders.filter(
        (o) => !(o.isObed && (!o.items || o.items.length === 0)),
      );

      let finalRevenue = rawPaidRevenue - dayObedCash;
      if (groupDateKey === getLocalDateKey(Date.now())) {
        finalRevenue = finalRevenue - dayObedKebab;
      }

      return {
        ...group,
        revenue: finalRevenue,
        total: realDayOrders.length,
        ordersCount: realDayOrders.length,
        paidCount: realDayOrders.filter((o) => o.paid).length,
        unpaidCount:
          realDayOrders.length - realDayOrders.filter((o) => o.paid).length,
      };
    });
  }, [filteredOrders]);

  // 3. SUMMARY:
  const summary = useMemo(() => {
    const realOrders = filteredOrders.filter(
      (o) => o.quantity > 0 || !o.isObed,
    );
    const totalNetRevenue = dayGroups.reduce(
      (sum, group) => sum + (group.revenue || 0),
      0,
    );

    return {
      total: realOrders.length,
      paid: realOrders.filter((o) => o.paid).length,
      unpaid: realOrders.length - realOrders.filter((o) => o.paid).length,
      revenue: totalNetRevenue, // Tied directly to dayGroups corrected balances
    };
  }, [filteredOrders, dayGroups]);

  const handleSearchToggle = useCallback(() => {
    setShowSearch((s) => !s);
    if (showSearch) setSearchQuery("");
  }, [showSearch]);

  const visibleGroups = useMemo(() => {
    if (!searchQuery) return dayGroups;
    return dayGroups.filter((g) =>
      g.orders.some((o) => {
        const q = searchQuery.toLowerCase();
        return (
          getOrderPrimary(o).toLowerCase().includes(q) ||
          (o.tavsif || "").toLowerCase().includes(q) ||
          (o.items?.length
            ? o.items.some((item) =>
                (item.kebabName || "").toLowerCase().includes(q),
              )
            : (KEBAB_LABELS[o.kebabType] || "").toLowerCase().includes(q))
        );
      }),
    );
  }, [dayGroups, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            {showSearch ? (
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidirish..."
                onBlur={() => {
                  if (!searchQuery) setShowSearch(false);
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2 text-navy-900 dark:text-white outline-none mr-2"
              />
            ) : (
              <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
                Hisobot
              </h1>
            )}
            <button
              onClick={handleSearchToggle}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 active:scale-95"
            >
              {showSearch ? <X /> : <Search />}
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  filter === f.id
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Summary strip */}
      {filteredOrders.length > 0 && (
        <div className="px-4 py-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm grid grid-cols-4">
            <StatCell
              label="Jami"
              value={summary.total}
              color="text-navy-700 dark:text-gray-200"
            />
            <StatCell
              label="To'langan"
              value={summary.paid}
              color="text-success-600"
            />
            <StatCell
              label="To'lanmagan"
              value={summary.unpaid}
              color="text-primary-500"
            />
            <StatCell
              label="Daromad"
              value={formatCurrency(summary.revenue)}
              color="text-navy-900 dark:text-white"
              small
            />
          </div>
        </div>
      )}

      {/* Day groups */}
      <div className="px-4 space-y-3 pb-4">
        {visibleGroups.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {searchQuery
              ? "Qidiruv natijasi topilmadi"
              : "Bu davrda buyurtma yo'q"}
          </div>
        ) : (
          visibleGroups.map((group) => (
            <DayGroup
              key={group.dayTs}
              group={group}
              searchQuery={searchQuery}
              onOrderClick={setModalOrder}
            />
          ))
        )}
      </div>

      {/* Order detail modal */}
      {modalOrder && (
        <OrderDetailsModal
          order={modalOrder}
          onClose={() => setModalOrder(null)}
        />
      )}
    </div>
  );
};

export default History;
