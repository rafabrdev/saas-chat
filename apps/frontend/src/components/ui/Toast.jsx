/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useEffect, useRef } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { ToastContext, TOAST_TYPES, TOAST_ACTIONS, toastReducer, useToast } from './ToastContext';

// Re-export useToast for convenience
export { useToast };

// Provider do contexto
export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = (message, type = TOAST_TYPES.INFO, options = {}) => {
    const toast = {
      message,
      type,
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      action: options.action || null
    };
    dispatch({ type: TOAST_ACTIONS.ADD_TOAST, payload: toast });
  };

  const removeToast = (id) => {
    dispatch({ type: TOAST_ACTIONS.REMOVE_TOAST, payload: id });
  };

  const clearAll = () => {
    dispatch({ type: TOAST_ACTIONS.CLEAR_ALL });
  };

  const toast = {
    success: (message, options) => addToast(message, TOAST_TYPES.SUCCESS, options),
    error: (message, options) => addToast(message, TOAST_TYPES.ERROR, options),
    warning: (message, options) => addToast(message, TOAST_TYPES.WARNING, options),
    info: (message, options) => addToast(message, TOAST_TYPES.INFO, options),
    remove: removeToast,
    clear: clearAll
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Componente individual do toast
function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    if (toast.duration && !toast.persistent) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const icons = {
    [TOAST_TYPES.SUCCESS]: CheckCircleIcon,
    [TOAST_TYPES.ERROR]: XCircleIcon,
    [TOAST_TYPES.WARNING]: ExclamationTriangleIcon,
    [TOAST_TYPES.INFO]: InformationCircleIcon
  };

  const styles = {
    [TOAST_TYPES.SUCCESS]: 'bg-green-50 border-green-200 text-green-800',
    [TOAST_TYPES.ERROR]: 'bg-red-50 border-red-200 text-red-800',
    [TOAST_TYPES.WARNING]: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    [TOAST_TYPES.INFO]: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    [TOAST_TYPES.SUCCESS]: 'text-green-400',
    [TOAST_TYPES.ERROR]: 'text-red-400',
    [TOAST_TYPES.WARNING]: 'text-yellow-400',
    [TOAST_TYPES.INFO]: 'text-blue-400'
  };

  const Icon = icons[toast.type];

  return (
    <div className={clsx(
      'max-w-sm w-full border rounded-lg shadow-lg p-4 transition-all duration-300 transform',
      'animate-in slide-in-from-right',
      styles[toast.type]
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={clsx('h-5 w-5', iconStyles[toast.type])} />
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium">{toast.message}</p>
          {toast.action && (
            <div className="mt-2">
              <button
                onClick={toast.action.onClick}
                className="text-sm font-semibold underline hover:no-underline"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onRemove(toast.id)}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Container dos toasts
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 z-50 p-6 space-y-4 pointer-events-none">
      <div className="space-y-3">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </div>
  );
}