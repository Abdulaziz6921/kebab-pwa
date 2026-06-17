/**
 * Toast & Confirmation Dialog System
 *
 * Modern, animated notification system replacing browser alerts.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(undefined);

// ─── Toast Types ──────────────────────────────────────────────────────────────
const TOAST_TYPES = {
  success: {
    bg:      'bg-success-500',
    icon:    'check',
    animate: 'animate-slide-up',
  },
  error: {
    bg:      'bg-error-500',
    icon:    'x',
    animate: 'animate-slide-up',
  },
  info: {
    bg:      'bg-blue-500',
    icon:    'info',
    animate: 'animate-slide-up',
  },
  warning: {
    bg:      'bg-warning-500',
    icon:    'warning',
    animate: 'animate-slide-up',
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

const ToastIcon = ({ type }) => {
  switch (type) {
    case 'success':  return <CheckIcon />;
    case 'error':    return <XIcon />;
    case 'warning':  return <WarningIcon />;
    default:         return <InfoIcon />;
  }
};

// ─── Toast Component ────────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
        ${config.bg} text-white
        animate-slide-up
        min-w-[280px] max-w-[90vw]
      `}
      onClick={() => onDismiss(toast.id)}
    >
      <div className="shrink-0">
        <ToastIcon type={toast.type} />
      </div>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
function ConfirmDialog({ isOpen, title, message, confirmText = 'Tasdiqlash', cancelText = 'Bekor qilish', variant = 'danger', onConfirm, onCancel }) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in overflow-hidden">
        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">
            {title}
          </h3>
          {message && (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] ${
              isDanger ? 'bg-error-500' : 'bg-primary-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Prompt Dialog (replaces browser prompt) ────────────────────────────────────
function PromptDialog({ isOpen, title, placeholder = '', defaultValue = '', confirmText = 'Saqlash', cancelText = 'Bekor qilish', onConfirm, onCancel }) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in overflow-hidden">
        <div className="p-5">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">
            {title}
          </h3>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-navy-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-400"
            onKeyDown={e => {
              if (e.key === 'Enter' && value.trim()) onConfirm(value.trim());
              if (e.key === 'Escape') onCancel();
            }}
          />
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            disabled={!value.trim()}
            className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [promptState, setPromptState] = useState({ isOpen: false });

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);

  // Confirm dialog - returns a promise
  const confirm = useCallback((title, message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText: options.confirmText || 'Tasdiqlash',
        cancelText: options.cancelText || 'Bekor qilish',
        variant: options.variant || 'danger',
        onConfirm: () => {
          setConfirmState({ isOpen: false });
          resolve(true);
        },
        onCancel: () => {
          setConfirmState({ isOpen: false });
          resolve(false);
        },
      });
    });
  }, []);

  // Prompt dialog - returns a promise
  const prompt = useCallback((title, options = {}) => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        title,
        placeholder: options.placeholder || '',
        defaultValue: options.defaultValue || '',
        confirmText: options.confirmText || 'Saqlash',
        cancelText: options.cancelText || 'Bekor qilish',
        onConfirm: (value) => {
          setPromptState({ isOpen: false });
          resolve(value);
        },
        onCancel: () => {
          setPromptState({ isOpen: false });
          resolve(null);
        },
      });
    });
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
    confirm,
    prompt,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container - bottom center on mobile, bottom-right on desktop */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 md:bottom-4 z-50 flex flex-col gap-2 items-center md:items-end pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...confirmState} />

      {/* Prompt Dialog */}
      <PromptDialog {...promptState} />
    </ToastContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
