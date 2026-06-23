// Shared display helpers for order data

export const KEBAB_LABELS = {
  qiyma: "Qiyma",
  mol: "Mol go'shti",
  quy: "Quy go'shti",
};

export function getOrderPrimary(order) {
  if (!order) return "";
  if (order.customerName) return order.customerName;
  if (order.locationLabel) {
    return order.locationDesc
      ? `${order.locationLabel} (${order.locationDesc})`
      : order.locationLabel;
  }
  if (order.location) return order.location;
  if (order.tavsif) return order.tavsif;
  return order.description || order.identifier || "";
}

export function getOrderSecondary(order) {
  if (!order) return "";

  // New multi-kebab orders
  if (order.items?.length) {
    return order.items
      .map((item) => `${item.quantity || 1} ta ${item.kebabName}`)
      .join(", ");
  }

  // Old orders compatibility
  const kebab = KEBAB_LABELS[order.kebabType] || order.kebabType || "";

  return `${order.quantity || 1} ta${kebab ? " " + kebab : ""}`;
}

// Format a timestamp as "12 Jun 2026"
export function formatDayLabel(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

// Midnight of the given date timestamp
export function dayStart(timestamp) {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// Group orders by calendar day (keyed by midnight timestamp)
export function groupOrdersByDay(orders) {
  const map = new Map();
  for (const order of orders) {
    const key = dayStart(order.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(order);
  }
  // Sort descending by day
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([dayTs, dayOrders]) => ({
      dayTs,
      label: formatDayLabel(dayTs),
      orders: dayOrders.sort((a, b) => b.createdAt - a.createdAt),
      total: dayOrders.length,
      paid: dayOrders.filter((o) => o.paid).length,
      unpaid: dayOrders.filter((o) => !o.paid).length,
      revenue: dayOrders
        .filter((o) => o.paid)
        .reduce((s, o) => s + (o.totalPrice || 0), 0),
    }));
}
