/// <reference types="vite-plugin-pwa/client" />
import { useEffect } from 'react';

let registered = false;

export const usePwaRegistration = () => {
  useEffect(() => {
    if (registered) return;

    if (typeof window === 'undefined') return;

    void import('virtual:pwa-register').then(({ registerSW }: any) => {
      registerSW({ immediate: true });
    });

    registered = true;
  }, []);
};
