// Utility helper functions

// Generate a unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate order number
export const generateOrderNumber = (prefix = 'ORD') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Deep clone an object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if an object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj || {}).length === 0;
};

// Check if a value is null or undefined
export const isNullOrUndefined = (value) => {
  return value === null || value === undefined;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Sleep/delay function
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry a function with exponential backoff
export const retry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
};

// Group array items by key
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

// Sort array by key
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Remove duplicates from array
export const unique = (array, key) => {
  if (key) {
    const seen = new Set();
    return array.filter((item) => {
      const keyValue = item[key];
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  }
  return [...new Set(array)];
};

// Pick specific keys from object
export const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

// Omit specific keys from object
export const omit = (obj, keys) => {
  const keysToOmit = new Set(keys);
  return Object.keys(obj).reduce((result, key) => {
    if (!keysToOmit.has(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

// Check if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Check if running as PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://');
};

// Check if device supports touch
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export default {
  generateId,
  generateOrderNumber,
  deepClone,
  isEmpty,
  isNullOrUndefined,
  debounce,
  throttle,
  sleep,
  retry,
  groupBy,
  sortBy,
  unique,
  pick,
  omit,
  isMobile,
  isPWA,
  isTouchDevice,
};
