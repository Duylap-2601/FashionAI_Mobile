import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppToast, type ToastPayload } from '@/components/ui/AppToast';

interface ToastContextValue {
  showToast: (payload: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

const noopContext: ToastContextValue = { showToast: () => {} };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(ToastPayload & { key: number }) | null>(null);

  const showToast = useCallback((payload: ToastPayload) => {
    setToast({ ...payload, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? <AppToast toast={toast} onDismiss={() => setToast(null)} /> : null}
    </ToastContext.Provider>
  );
}

export function useAppToast(): ToastContextValue {
  return useContext(ToastContext) ?? noopContext;
}
