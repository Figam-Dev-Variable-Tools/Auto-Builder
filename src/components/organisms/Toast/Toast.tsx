import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import type { IconName } from '../../atoms/Icon';
import { toastMeta } from './Toast.meta';
import { ToastContext } from './toast-context';
import './Toast.css';

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ToastPlacement = 'bottom-right' | 'bottom-center' | 'top-right' | 'top-center';
export type ToastType = 'A' | 'B';

const TONE_ICON: Record<ToastTone, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'alert-circle',
};

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  /** Layout preset — A: compact single-line · B: rich with title/description/action row. */
  type?: ToastType;
  duration?: number;
  closable?: boolean;
  action?: ReactNode;
}

interface ToastRecord extends ToastOptions {
  id: string;
}

/* ----------------------------- presentational ---------------------------- */

export interface ToastProps extends ToastOptions {
  onClose?: () => void;
  placement?: ToastPlacement;
}

export function Toast({
  title,
  description,
  tone = 'neutral',
  type = 'A',
  closable = true,
  action,
  duration = 4000,
  onClose,
  placement,
}: ToastProps) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Keep the latest onClose without restarting the timer when siblings re-render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const stop = useCallback(() => clearTimeout(timer.current), []);
  const start = useCallback(() => {
    if (duration <= 0) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onCloseRef.current?.(), duration);
  }, [duration]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return (
    <div
      className={cx('tds-toast', 'tds-tone')}
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-live={tone === 'danger' ? 'assertive' : 'polite'}
      data-placement={placement}
      // Pause the auto-dismiss while hovered or focused (WCAG 2.2.1).
      onMouseEnter={stop}
      onMouseLeave={start}
      onFocusCapture={stop}
      onBlurCapture={start}
      {...toDataAttrs(toastMeta, { tone, type })}
    >
      <span className="tds-toast__icon" aria-hidden="true">
        <Icon name={TONE_ICON[tone]} size="sm" />
      </span>
      <div className="tds-toast__content">
        {title && <p className="tds-toast__title">{title}</p>}
        {description && <p className="tds-toast__description">{description}</p>}
      </div>
      {action && <div className="tds-toast__action">{action}</div>}
      {closable && (
        <button type="button" className="tds-toast__close" aria-label="Dismiss" onClick={onClose}>
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------- provider -------------------------------- */
/* `ToastContext` + `useToast` live in ./toast-context so this file exports only components. */

let toastSeq = 0;

export interface ToastProviderProps {
  children: ReactNode;
  placement?: ToastPlacement;
}

export function ToastProvider({ children, placement = 'bottom-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastSeq}`;
    setToasts((list) => [...list, { ...options, id }]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {createPortal(
        <div
          className="tds-toast-region"
          data-placement={placement}
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((t) => (
            <Toast key={t.id} {...t} placement={placement} onClose={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
