// App constants
export const APP_NAME = 'Restaurant Order Tracker';

export const ROUTES = {
  HOME: '/',
  ORDERS: '/orders',
  ORDER_DETAILS: '/orders/:orderId',
  KITCHEN: '/kitchen',
  SETTINGS: '/settings',
};

// Order status transitions
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['completed'],
  completed: [],
  cancelled: [],
};

// Priority levels
export const PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Time constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  LAST_SYNC: 'lastSync',
  USER_PREFERENCES: 'userPreferences',
  RESTAURANT_ID: 'restaurantId',
};

// IndexedDB constants
export const DB_NAME = 'restaurant-order-tracker';
export const DB_VERSION = 1;

// Notification settings
export const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_READY: 'order_ready',
  ORDER_CANCELLED: 'order_cancelled',
};

// Table sections/areas
export const TABLE_AREAS = {
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  BAR: 'bar',
  VIP: 'vip',
  TAKEAWAY: 'takeaway',
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  OTHER: 'other',
};

// Order item modifications
export const MODIFICATION_TYPES = {
  ADD: 'add',
  REMOVE: 'remove',
  SUBSTITUTE: 'substitute',
};

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// API timeouts
export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
};

export default {
  APP_NAME,
  ROUTES,
  STATUS_TRANSITIONS,
  PRIORITY,
  TIME,
  STORAGE_KEYS,
  DB_NAME,
  DB_VERSION,
  NOTIFICATION_TYPES,
  TABLE_AREAS,
  PAYMENT_METHODS,
  MODIFICATION_TYPES,
  PAGINATION,
  TIMEOUTS,
};
