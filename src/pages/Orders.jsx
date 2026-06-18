import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders, useToast } from "../contexts";
import {
  formatCurrency,
  formatOrderTime,
  formatDate,
} from "../utils/formatters";
import { LOC_TYPE } from "../utils/locations";
import {
  FileText,
  UserRound,
  Hash,
  House,
  DoorClosed,
  CircleDot,
  CircleQuestionMark,
  SquareMinus,
  SquarePlus,
  Search,
  Pause,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOrderIcon(order) {
  if (order.customerName || order.customerId) {
    return {
      Icon: UserRound,
      bg: "bg-navy-100 dark:bg-navy-800",
      text: "text-navy-500",
    };
  }
  switch (order.locationType) {
    case LOC_TYPE.PARALLEL:
      return {
        Icon: Pause,
        bg: "bg-green-100",
        text: "text-green-700",
      };
    case LOC_TYPE.HASH:
      return { Icon: Hash, bg: "bg-orange-100", text: "text-orange-600" };
    case LOC_TYPE.ORQASI:
      return { Icon: CircleDot, bg: "bg-gray-100", text: "text-gray-600" };
    case LOC_TYPE.HOVLI:
      return { Icon: House, bg: "bg-green-100", text: "text-green-700" };
    case LOC_TYPE.XONA:
      return { Icon: DoorClosed, bg: "bg-blue-100", text: "text-blue-600" };
    default:
      return {
        Icon: CircleQuestionMark,
        bg: "bg-orange-50",
        text: "text-primary-500",
      };
  }
}

function getOrderPrimary(order) {
  if (order.customerName) return order.customerName;
  if (order.locationLabel) {
    return order.locationDesc
      ? `${order.locationLabel} (${order.locationDesc})`
      : order.locationLabel;
  }
  if (order.location) return order.location;
  if (order.tavsif) return order.tavsif;
  return order.description || order.identifier;
}

function getOrderSecondary(order) {
  // New orders
  if (order.items?.length) {
    return order.items
      .map((item) => `${item.quantity} ta ${item.kebabName}`)
      .join(", ");
  }

  // Backward compatibility for old orders
  const kebabMap = {
    qiyma: "Qiyma",
    mol: "Mol go'shti",
    quy: "Quy go'shti",
  };

  const kebab = kebabMap[order.kebabType] || order.kebabType || "";

  return `${order.quantity || 1} ta ${kebab}`;
}

const todayDateStr = formatDate(Date.now(), {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onPay, paying }) {
  const { Icon, bg, text } = getOrderIcon(order);
  const primary = getOrderPrimary(order);
  const secondary = getOrderSecondary(order);
  const showTavsif = order.tavsif && order.locationLabel;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center  ${bg} ${text}`}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-navy-900 dark:text-white text-[15px] leading-tight truncate">
          {primary}
        </p>
        {showTavsif && (
          <p className="text-xs text-primary-500 truncate">{order.tavsif}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{secondary}</p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1.5 ">
          {!order.paid && (
            <button
              onClick={() => onPay(order)}
              disabled={paying === order.id}
              className="active:scale-90 transition-transform disabled:opacity-50"
            >
              {paying === order.id ? (
                <div className="w-7 h-7 rounded-full border-2 border-success-500 border-t-transparent animate-spin" />
              ) : (
                <SquareMinus className="text-red-600" />
              )}
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <FileText size={14} />
          {formatOrderTime(order.createdAt)}
        </span>
        {order.paidAt && (
          <span className="text-xs text-green-500 flex items-center gap-1">
            <SquarePlus size={16} />
            {formatOrderTime(order.paidAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Orders = () => {
  const navigate = useNavigate();
  const { orders, loading, markOrderPaid } = useOrders();
  const { success, error, confirm } = useToast();

  const [activeTab, setActiveTab] = useState("unpaid");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paying, setPaying] = useState(null);

  const isToday = (date) => {
    const d = new Date(date);
    const today = new Date();

    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const unpaidToday = orders
    .filter((o) => !o.paid && isToday(o.createdAt))
    .sort((a, b) => a.createdAt - b.createdAt);

  const paidToday = orders
    .filter((o) => o.paid && isToday(o.paidAt || o.updatedAt || o.createdAt))
    .sort((a, b) => b.createdAt - a.createdAt);

  const debtOrders = orders.filter((o) => !o.paid && !isToday(o.createdAt));

  const displayOrders = (
    activeTab === "unpaid"
      ? unpaidToday
      : activeTab === "paid"
        ? paidToday
        : debtOrders
  ).filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      getOrderPrimary(o).toLowerCase().includes(q) ||
      (o.tavsif || "").toLowerCase().includes(q)
    );
  });

  const handlePay = async (order) => {
    if (order.paid || paying === order.id) return;

    const confirmed = await confirm(
      "To'lovni tasdiqlash",
      `"${getOrderPrimary(order)}" — to'landi deb belgilansinmi?`,
      { confirmText: "To'landi", cancelText: "Bekor" },
    );

    if (!confirmed) return;

    setPaying(order.id);
    try {
      await markOrderPaid(order.id);
      success("To'lov qabul qilindi");
    } catch (err) {
      error("Xatolik yuz berdi: " + err.message);
    } finally {
      setPaying(null);
    }
  };

  const unpaidTotal = unpaidToday.reduce((s, o) => s + (o.totalPrice || 0), 0);

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
              <div>
                <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
                  Buyurtmalar
                </h1>
                <h3 className="font-bold text-navy-900 dark:text-white mt-1">
                  Sana: {todayDateStr}
                </h3>
              </div>
            )}
            <button
              onClick={() => {
                setShowSearch((s) => !s);
                setSearchQuery("");
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 active:scale-95"
            >
              <Search />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("unpaid")}
              className={`flex-1 py-2.5 px-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all${
                activeTab === "unpaid"
                  ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500"
              }`}
            >
              To'lanmagan{" "}
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-extrabold ${
                  activeTab === "unpaid"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                }`}
              >
                {unpaidToday.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`flex-1 py-2.5 px-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all${
                activeTab === "paid"
                  ? "bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500"
              }`}
            >
              To'langan{" "}
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-extrabold ${
                  activeTab === "paid"
                    ? "bg-success-600 text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                }`}
              >
                {paidToday.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("debt")}
              className={`flex-1 py-2.5 px-0.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "debt"
                  ? "bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500"
              }`}
            >
              Nasiyalar{" "}
              <span
                className={`px-1.5 py-0.5 rounded-full   font-extrabold ${
                  activeTab === "debt"
                    ? "bg-warning-600 text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                }`}
              >
                {debtOrders.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Unpaid total */}
      {activeTab === "unpaid" && unpaidTotal > 0 && (
        <div className="px-4 py-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2.5 flex justify-between items-center shadow-sm">
            <span className="text-sm text-gray-500">Jami summa</span>
            <span className="text-xl font-extrabold text-navy-900 dark:text-white">
              {formatCurrency(unpaidTotal)}
            </span>
          </div>
        </div>
      )}

      {/* List */}
      <div className="px-4 space-y-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {activeTab === "debt"
              ? "Nasiyalar yo'q"
              : activeTab === "unpaid"
                ? `Assalomu aleykum, ${todayDateStr} uchun to'lanmangan buyurtmalar yo'q, iltimos buyurtma qo'shing`
                : `${todayDateStr} uchun to'langan buyurtmalar yo'q`}
          </div>
        ) : (
          displayOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPay={handlePay}
              paying={paying}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/new-order")}
        className="fixed right-4 bottom-20 w-14 h-14 bg-primary-500 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform z-10"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="w-7 h-7"
        >
          <path d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default Orders;
