import React from "react";
import { X } from "lucide-react";
import { getOrderPrimary, KEBAB_LABELS } from "../utils/orderDisplay";
import { formatCurrency } from "../utils/formatters";

function Row({ label, value, small }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0">
        {label}
      </span>
      <span
        className={`font-medium text-navy-900 dark:text-white text-right ${small ? "text-xs" : "text-sm"}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const formatFull = (ts) =>
    ts
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date(ts))
      : "—";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-5 animate-slide-up max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slayder tutqichi (Handle) */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white">
            Buyurtma tafsiloti
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status belgisi */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${
            order.paid
              ? "bg-success-100 text-success-700"
              : "bg-orange-100 text-primary-600"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${order.paid ? "bg-success-500" : "bg-primary-500"}`}
          />
          {order.paid ? "To'langan" : "To'lanmagan"}
        </div>

        <div className="space-y-3">
          <Row label="Kim / Joy" value={getOrderPrimary(order)} />
          {order.tavsif && <Row label="Tavsif" value={order.tavsif} />}

          <Row
            label="Kebab turi"
            value={
              order.items?.length
                ? order.items.map((item) => item.kebabName).join(", ")
                : KEBAB_LABELS[order.kebabType] || order.kebabType || "—"
            }
          />

          <Row
            label="Miqdor"
            value={
              order.items?.length
                ? order.items.map((item) => `${item.quantity} ta`).join(", ")
                : `${order.quantity || 1} ta`
            }
          />

          {order.description && (
            <Row label="Tafsilot" value={order.description} />
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">Jami</span>
              <span className="text-xl font-extrabold text-primary-500">
                {formatCurrency(order.totalPrice || 0)}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
            <Row
              label="Yaratilgan vaqt"
              value={formatFull(order.createdAt)}
              small
            />
            {order.paid && (
              <Row
                label="To'langan vaqt"
                value={formatFull(order.paidAt)}
                small
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
