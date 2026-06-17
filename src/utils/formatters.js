// Formatting utility functions

// Format currency (UZS by default for Uzbek so'm)
export const formatCurrency = (amount, currency = "UZS", locale = "uz-UZ") => {
  // Format with space separator for Uzbek so'm
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} so'm`;
};
// Format revenue (short version, e.g., 1.2M, 3.4k)
export const formatRevenue = (n) => {
  return n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : n.toString();
};

// Format currency short (just number)
export const formatCurrencyShort = (amount) => {
  return new Intl.NumberFormat("uz-UZ").format(amount);
};

// Format number with commas
export const formatNumber = (number, locale = "en-IN") => {
  return new Intl.NumberFormat(locale).format(number);
};

// Format date
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  };
  return new Intl.DateTimeFormat("en-IN", defaultOptions).format(
    new Date(date),
  );
};

// Format time
export const formatTime = (date, options = {}) => {
  const defaultOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };
  return new Intl.DateTimeFormat("en-IN", defaultOptions).format(
    new Date(date),
  );
};

// Format datetime
export const formatDateTime = (date, options = {}) => {
  return `${formatDate(date, options)} ${formatTime(date, options)}`;
};

// Format order time - shows exact time instead of relative
// Today: 12:45
// Yesterday: Kecha 8:30
// Older: Jun 12, 8:30
export const formatOrderTime = (date) => {
  if (!date) return "—";

  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const timeStr = new Intl.DateTimeFormat("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  if (d >= today) {
    // Today - just show time
    return timeStr;
  }

  if (d >= yesterday) {
    // Yesterday
    return `Kecha ${timeStr}`;
  }

  // Older - show date and time
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(d);

  return `${dateStr}, ${timeStr}`;
};

// Format relative time (deprecated - now uses exact time)
export const formatRelativeTime = (date) => {
  return formatOrderTime(date);
};

// Format duration (e.g., "1h 30m")
export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

// Format order status
export const formatOrderStatus = (status) => {
  const statusMap = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready for Pickup",
    served: "Served",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return statusMap[status] || status;
};

// Format table number
export const formatTableNumber = (tableNumber, prefix = "Table") => {
  return `${prefix} ${tableNumber}`;
};

// Format phone number (Indian format)
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "+91 $1-$2-$3");
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, "+$1 $2-$3-$4");
  }
  return phone;
};

// Format order items count
export const formatItemsCount = (
  count,
  singular = "item",
  plural = "items",
) => {
  return `${count} ${count === 1 ? singular : plural}`;
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

// Capitalize first letter
export const capitalize = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Convert to title case
export const toTitleCase = (text) => {
  if (!text) return "";
  return text.replace(/_/g, " ").replace(/\w\S*/g, (word) => {
    return capitalize(word.toLowerCase());
  });
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatOrderTime,
  formatDuration,
  formatOrderStatus,
  formatTableNumber,
  formatPhoneNumber,
  formatItemsCount,
  truncateText,
  capitalize,
  toTitleCase,
};
