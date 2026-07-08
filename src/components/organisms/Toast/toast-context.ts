import { createContext, useContext } from 'react';
import type { ToastOptions } from './Toast';

/**
 * Toast context + hook, kept in their own module so `Toast.tsx` exports only components
 * (React Fast Refresh / `react-refresh/only-export-components` hygiene). `ToastOptions` is
 * imported type-only, so there is no runtime import cycle with `Toast.tsx`.
 */
export interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Access the toast API from within a `<ToastProvider>`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
