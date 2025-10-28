import { useEffect } from 'react';

let registered = false;

export const usePwaRegistration = () => {
  useEffect(() => {
    if (registered) {
      return undefined;
    }
    if (typeof window === 'undefined') {
      return undefined;
    }
    void import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
    registered = true;
    return undefined;
  }, []);
};
