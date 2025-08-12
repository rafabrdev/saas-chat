import { createContext, useContext } from 'react';

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Toast actions
export const TOAST_ACTIONS = {
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  CLEAR_ALL: 'CLEAR_ALL'
};

// Create context
export const ToastContext = createContext();

// Toast reducer
export function toastReducer(state, action) {
  switch (action.type) {
    case TOAST_ACTIONS.ADD_TOAST: {
      const newToast = {
        ...action.payload,
        id: Date.now() + Math.random()
      };
      return [...state, newToast];
    }
    
    case TOAST_ACTIONS.REMOVE_TOAST:
      return state.filter(toast => toast.id !== action.payload);
    
    case TOAST_ACTIONS.CLEAR_ALL:
      return [];
    
    default:
      return state;
  }
}

// Custom hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
