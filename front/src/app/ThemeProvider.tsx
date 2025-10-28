import { ReactNode, useEffect } from 'react';

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  useEffect(() => {
    document.body.dataset.theme = 'light';
  }, []);

  return <>{children}</>;
};
