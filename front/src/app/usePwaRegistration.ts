/// <reference types="vite-plugin-pwa/client" />
import { useEffect } from 'react';
import type { RegisterSWOptions } from 'workbox-window';

let registered = false;

export const usePwaRegistration = () => {
  useEffect(() => {
    if (registered) return;

    if (typeof window === 'undefined') return;

    void import('virtual:pwa-register').then(({ registerSW }: { registerSW: (options?: RegisterSWOptions) => void }) => {
      registerSW({ immediate: true });
    });

    registered = true;
  }, []);
};
